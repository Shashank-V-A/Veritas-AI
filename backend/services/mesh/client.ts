import { MESH_MAX_RETRIES, MESH_TIMEOUT_MS } from '@veritas/shared'
import { isAppError } from '../../utils/errors.js'
import { logger } from '../../utils/logger.js'
import { mapMeshHttpError, mapMeshNetworkError } from './errors.js'
import type {
  MeshCompletionRequest,
  MeshCompletionResponse,
  MeshConfig,
} from './types.js'

function getMeshConfig(): MeshConfig {
  const apiKey = process.env.MESH_API_KEY
  const baseUrl = (process.env.MESH_API_URL ?? 'https://api.meshapi.ai').replace(
    /\/$/,
    '',
  )
  const model = process.env.MESH_MODEL ?? 'google/gemini-2.5-flash'

  if (!apiKey) {
    throw new Error('MESH_API_KEY is not configured')
  }

  return {
    apiKey,
    baseUrl,
    model,
    timeoutMs: Number(process.env.MESH_TIMEOUT_MS ?? MESH_TIMEOUT_MS),
    maxRetries: Number(process.env.MESH_MAX_RETRIES ?? MESH_MAX_RETRIES),
  }
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export class MeshClient {
  private readonly config: MeshConfig

  constructor(config?: Partial<MeshConfig>) {
    this.config = { ...getMeshConfig(), ...config }
  }

  async complete(request: Omit<MeshCompletionRequest, 'model'> & { model?: string }) {
    const url = `${this.config.baseUrl}/v1/chat/completions`
    const payload: MeshCompletionRequest = {
      model: request.model ?? this.config.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.max_tokens ?? 8192,
      response_format: request.response_format,
    }

    let lastError: unknown

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs)

      try {
        logger.debug('Mesh API request', {
          model: payload.model,
          attempt: attempt + 1,
        })

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        const bodyText = await response.text()

        if (!response.ok) {
          const retryable = response.status === 429 || response.status >= 500
          if (retryable && attempt < this.config.maxRetries) {
            logger.warn('Mesh API retrying after error', {
              status: response.status,
              attempt: attempt + 1,
            })
            await sleep(1000 * (attempt + 1))
            continue
          }
          throw mapMeshHttpError(response.status, bodyText)
        }

        const data = JSON.parse(bodyText) as MeshCompletionResponse
        const content = data.choices?.[0]?.message?.content

        if (!content) {
          throw mapMeshHttpError(502, 'Mesh API returned an empty response')
        }

        return {
          content,
          usage: data.usage,
          model: payload.model,
        }
      } catch (error) {
        lastError = error

        if (isAppError(error)) {
          const retryable = error.status === 429 || error.status >= 500
          if (retryable && attempt < this.config.maxRetries) {
            logger.warn('Mesh API retrying after error', {
              code: error.code,
              attempt: attempt + 1,
            })
            await sleep(1000 * (attempt + 1))
            continue
          }
          throw error
        }

        if (attempt < this.config.maxRetries) {
          logger.warn('Mesh API network retry', { attempt: attempt + 1 })
          await sleep(1000 * (attempt + 1))
          continue
        }

        throw mapMeshNetworkError(error)
      } finally {
        clearTimeout(timeout)
      }
    }

    throw mapMeshNetworkError(lastError)
  }
}

export function createMeshClient(config?: Partial<MeshConfig>) {
  return new MeshClient(config)
}
