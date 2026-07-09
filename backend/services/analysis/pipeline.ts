import type { CredibilityReport } from '@veritas/shared'
import { AppError } from '../../utils/errors.js'
import { logger } from '../../utils/logger.js'
import { createMeshClient } from '../mesh/client.js'
import {
  buildRepairPrompt,
  buildUserPrompt,
  CREDIBILITY_REPORT_JSON_SCHEMA,
  SYSTEM_PROMPT,
} from './prompts.js'
import { getValidationErrorMessage, parseCredibilityReport } from './parser.js'
import { createStubReport } from './stub.js'

export interface AnalysisInput {
  content: string
  sourceType: import('@veritas/shared').SourceType
  title?: string
  compareContent?: string
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

async function callMeshForReport(
  input: AnalysisInput,
): Promise<{ content: string; model: string; latencyMs: number }> {
  const mesh = createMeshClient()
  const startedAt = Date.now()

  const response = await mesh.complete({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(input) },
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

  const response = await mesh.complete({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(input) },
      { role: 'assistant', content: invalidJson },
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
  yield 'prepare'

  if (shouldUseStub()) {
    logger.warn('Mesh API not configured — using development stub analyzer')
    yield 'stub_analysis'
    return {
      report: createStubReport(input),
      meshModel: 'stub',
      meshLatencyMs: 0,
    }
  }

  try {
    yield 'mesh_request'
    const meshResult = await callMeshForReport(input)

    yield 'parse'
    const report = await parseWithRepair(input, meshResult.content)

    yield 'complete'
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

  while (!stage.done) {
    logger.debug('Analysis stage', { stage: stage.value })
    stage = await generator.next()
  }

  if (!stage.value) {
    throw new AppError('Analysis pipeline failed', 'INTERNAL', 500)
  }

  return stage.value
}
