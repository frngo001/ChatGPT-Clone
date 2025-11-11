import { useMutation } from '@tanstack/react-query'
import { Message } from 'ai/react'

/**
 * Request structure for chat mutations
 * @interface ChatRequest
 */
interface ChatRequest {
  /** Array of chat messages */
  messages: Message[]
  /** Selected model name */
  selectedModel: string
  /** AI provider to use */
  selectedProvider: 'ollama' | 'deepseek'
  /** Optional streaming configuration */
  streamingConfig?: {
    /** Temperature for response generation (0.0-1.0) */
    temperature?: number
    /** Top-p sampling parameter (0.0-1.0) */
    topP?: number
    /** Maximum tokens to generate */
    maxTokens?: number
    /** Batch size for streaming */
    batchSize?: number
    /** Delay between batches in ms */
    throttleDelay?: number
  }
  /** Optional data payload */
  data?: {
    /** Array of base64 image strings */
    images?: string[]
  }
  /** Experimental attachments for multimodal input */
  experimental_attachments?: Array<{
    /** MIME type of attachment */
    contentType: string
    /** URL or data URI of attachment */
    url: string
  }>
}

/**
 * Response structure for chat mutations
 * @interface ChatResponse
 * @description Streaming response handled by AI SDK
 */
interface ChatResponse {
  // Streaming response - handled by AI SDK
}

/**
 * Hook for chat message mutations with streaming support
 * 
 * @description Handles sending chat messages to AI providers with automatic
 * retry logic, error handling, and streaming response support via AI SDK.
 * 
 * @returns {Object} Mutation object containing:
 * - `mutate`: Function to send chat request
 * - `isPending`: Loading state during request
 * - `isError`: Error state if request failed
 * - `error`: Error object if request failed
 * - `data`: Response data (streaming handled by AI SDK)
 */
export function useChatMutation() {
  return useMutation<ChatResponse, Error, ChatRequest>({
    mutationFn: async (request) => {
      const apiEndpoint = request.selectedProvider === 'ollama' 
        ? '/api/ollama/chat' 
        : '/api/deepseek/chat'

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: request.messages,
          selectedModel: request.selectedModel,
          data: request.data,
          streamingConfig: request.streamingConfig || {
            temperature: 0.7,
            topP: 0.9,
            maxTokens: 1000000,
            batchSize: 400,
            throttleDelay: 17,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Chat API Error: ${response.status} - ${errorText}`)
      }

      return response as any // AI SDK handles streaming
    },
    retry: (failureCount, error) => {
      // No retry for client errors
      if (error.message.includes('Failed to fetch')) {
        return false
      }
      // Maximum 2 retries for server errors
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Hook for downloading AI models from providers
 * 
 * @description Handles model downloads for both Ollama and DeepSeek providers.
 * Includes retry logic with extended delays for large file downloads.
 * 
 * @returns {Object} Mutation object containing:
 * - `mutate`: Function to download model
 * - `isPending`: Loading state during download
 * - `isError`: Error state if download failed
 * - `error`: Error object if download failed
 */
export function useModelDownload() {
  return useMutation<void, Error, { modelName: string; provider: 'ollama' | 'deepseek' }>({
    mutationFn: async ({ modelName, provider }) => {
      const apiEndpoint = provider === 'ollama' 
        ? `/api/ollama/pull/${modelName}` 
        : `/api/deepseek/models/${modelName}`

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Model Download Error: ${response.status} - ${errorText}`)
      }

      return
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 60000),
  })
}
