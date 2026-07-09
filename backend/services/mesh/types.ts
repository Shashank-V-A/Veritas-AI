export interface MeshMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface MeshJsonSchemaFormat {
  type: 'json_schema'
  json_schema: {
    name: string
    schema: Record<string, unknown>
  }
}

export interface MeshJsonObjectFormat {
  type: 'json_object'
}

export type MeshResponseFormat = MeshJsonSchemaFormat | MeshJsonObjectFormat

export interface MeshCompletionRequest {
  model: string
  messages: MeshMessage[]
  temperature?: number
  max_tokens?: number
  response_format?: MeshResponseFormat
}

export interface MeshCompletionChoice {
  index: number
  message: {
    role: string
    content: string | null
  }
  finish_reason: string | null
}

export interface MeshCompletionResponse {
  id: string
  choices: MeshCompletionChoice[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface MeshConfig {
  apiKey: string
  baseUrl: string
  model: string
  timeoutMs: number
  maxRetries: number
}
