import type { CredibilityReport } from '@veritas/shared'
import { AppError } from '../../utils/errors.js'
import { logger } from '../../utils/logger.js'
import { createMeshClient } from '../mesh/client.js'
import { buildSearchContext, searchWeb } from '../search/webSearch.js'
import { syncAnalysisToGraph } from '../graph/neo4j.js'
import {
  buildRepairPrompt,
  buildUserPrompt,
  CREDIBILITY_REPORT_JSON_SCHEMA,
  SYSTEM_PROMPT,
} from './prompts.js'
import { enrichReportWithSearch } from './enrich.js'
import { getValidationErrorMessage, parseCredibilityReport } from './parser.js'
import { createStubReport } from './stub.js'

/** Keep Mesh prompts bounded so JSON responses stay complete and parseable. */
const MESH_CONTENT_MAX_CHARS = 10_000

export interface AnalysisInput {
  content: string
  sourceType: import('@veritas/shared').SourceType
  title?: string
  compareContent?: string
  searchContext?: string
}

export interface AnalysisPipelineResult {
  report: CredibilityReport
  meshModel: string
  meshLatencyMs: number
}

function shouldUseStub(): boolean {
  return (
    process.env.MESH_USE_STUB === 'true' ||
    !process.env.MESH_API_KEY
  )
}

function truncateForMesh(text: string, max = MESH_CONTENT_MAX_CHARS): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max)}\n\n[Content truncated for analysis — ${trimmed.length} characters total.]`
}

function prepareInputForMesh(input: AnalysisInput): AnalysisInput {
  return {
    ...input,
    content: truncateForMesh(input.content),
    compareContent: input.compareContent
      ? truncateForMesh(input.compareContent, 4_000)
      : undefined,
  }
}

async function callMeshForReport(
  input: AnalysisInput,
): Promise<{ content: string; model: string; latencyMs: number }> {
  const mesh = createMeshClient()
  const startedAt = Date.now()
  const meshInput = prepareInputForMesh(input)

  const response = await mesh.complete({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(meshInput) },
    ],
    temperature: 0.2,
    max_tokens: 8192,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'credibility_report',
        schema: CREDIBILITY_REPORT_JSON_SCHEMA,
      },
    },
  })

  logger.info('Mesh API analysis complete', {
    model: response.model,
    usage: response.usage,
    latencyMs: Date.now() - startedAt,
    contentChars: meshInput.content.length,
  })

  return {
    content: response.content,
    model: response.model,
    latencyMs: Date.now() - startedAt,
  }
}

async function callMeshForRepair(
  input: AnalysisInput,
  invalidJson: string,
  validationError: string,
): Promise<string> {
  const mesh = createMeshClient()
  const meshInput = prepareInputForMesh(input)

  const response = await mesh.complete({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(meshInput) },
      { role: 'assistant', content: invalidJson.slice(0, 6000) },
      { role: 'user', content: buildRepairPrompt(invalidJson, validationError) },
    ],
    temperature: 0,
    max_tokens: 8192,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'credibility_report',
        schema: CREDIBILITY_REPORT_JSON_SCHEMA,
      },
    },
  })

  return response.content
}

async function parseWithRepair(
  input: AnalysisInput,
  raw: string,
): Promise<CredibilityReport> {
  try {
    return parseCredibilityReport(raw)
  } catch (firstError) {
    const validationError = getValidationErrorMessage(raw)
    logger.warn('Mesh response validation failed, attempting repair', {
      validationError,
      rawLength: raw.length,
    })

    const repairedRaw = await callMeshForRepair(input, raw, validationError)

    try {
      return parseCredibilityReport(repairedRaw)
    } catch {
      throw firstError instanceof AppError
        ? firstError
        : new AppError(
            'Mesh API returned invalid JSON after repair attempt',
            'MESH_ERROR',
            502,
          )
    }
  }
}

/**
 * Analysis pipeline orchestrator with stage logging.
 * All AI inference routes through Mesh API — never call LLMs directly.
 */
export async function* runAnalysisWithStages(
  input: AnalysisInput,
): AsyncGenerator<string, AnalysisPipelineResult> {
  yield 'claim_extraction'

  let pipelineInput = { ...input }

  if (!input.searchContext) {
    yield 'web_search'
    const query = input.title ?? input.content.slice(0, 120).replace(/\s+/g, ' ')
    const results = await searchWeb(query, 5)
    pipelineInput = {
      ...input,
      searchContext: buildSearchContext(results),
    }
  }

  if (shouldUseStub()) {
    logger.warn('Mesh API not configured — using development stub analyzer')
    yield 'verdict_synthesis'
    const report = enrichReportWithSearch(createStubReport(pipelineInput), [])
    return {
      report,
      meshModel: 'stub',
      meshLatencyMs: 0,
    }
  }

  try {
    yield 'evidence_scan'
    const meshResult = await callMeshForReport(pipelineInput)

    yield 'bias_scan'
    let report = await parseWithRepair(pipelineInput, meshResult.content)

    yield 'fallacy_scan'
    if (pipelineInput.searchContext) {
      const results = await searchWeb(
        pipelineInput.title ?? pipelineInput.content.slice(0, 80),
        5,
      )
      report = enrichReportWithSearch(report, results)
    }

    yield 'dossier_compile'
    return {
      report,
      meshModel: meshResult.model,
      meshLatencyMs: meshResult.latencyMs,
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    logger.error('Unexpected analysis pipeline error', {
      message: error instanceof Error ? error.message : String(error),
    })

    throw new AppError('Analysis pipeline failed', 'INTERNAL', 500)
  }
}

export async function runAnalysis(input: AnalysisInput): Promise<AnalysisPipelineResult> {
  const generator = runAnalysisWithStages(input)
  let stage = await generator.next()
  let result: AnalysisPipelineResult | undefined

  while (!stage.done) {
    logger.debug('Analysis stage', { stage: stage.value })
    stage = await generator.next()
  }

  result = stage.value
  if (!result) {
    throw new AppError('Analysis pipeline failed', 'INTERNAL', 500)
  }

  return result
}

export async function runAnalysisAndSyncGraph(
  analysisId: string,
  input: AnalysisInput,
): Promise<AnalysisPipelineResult> {
  const result = await runAnalysis(input)
  await syncAnalysisToGraph(analysisId, result.report)
  return result
}
