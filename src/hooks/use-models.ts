import { useQuery } from '@tanstack/react-query'

/**
 * Represents an Ollama model with detailed information
 * @interface OllamaModel
 */
interface OllamaModel {
  /** Model name identifier */
  name: string
  /** Model identifier */
  model: string
  /** Last modification timestamp */
  modified_at: string
  /** Model size in bytes */
  size: number
  /** Model digest hash */
  digest: string
  /** Detailed model information */
  details: {
    /** Parent model name */
    parent_model: string
    /** Model format */
    format: string
    /** Model family */
    family: string
    /** Model families array */
    families: string[]
    /** Parameter size description */
    parameter_size: string
    /** Quantization level */
    quantization_level: string
  }
}

/**
 * Represents a DeepSeek model from the API
 * @interface DeepSeekModel
 */
interface DeepSeekModel {
  /** Model ID */
  id: string
  /** Object type */
  object: string
  /** Creation timestamp */
  created: number
  /** Model owner */
  owned_by: string
}

/**
 * Response structure for Ollama models API
 * @interface OllamaModelsResponse
 */
interface OllamaModelsResponse {
  /** Array of available models */
  models: OllamaModel[]
}

/**
 * Response structure for DeepSeek models API
 * @interface DeepSeekModelsResponse
 */
interface DeepSeekModelsResponse {
  /** Object type */
  object: string
  /** Array of available models */
  data: DeepSeekModel[]
}

/**
 * Hook for fetching Ollama models with caching and retry logic
 * 
 * @description Fetches available Ollama models from the local API endpoint.
 * Includes automatic retry with exponential backoff and 5-minute caching.
 * 
 * @returns {Object} Query result object containing:
 * - `data`: OllamaModelsResponse with models array
 * - `isLoading`: boolean indicating loading state
 * - `isError`: boolean indicating error state
 * - `error`: Error object if request failed
 * - `refetch`: Function to manually refetch data
 */
export function useOllamaModels() {
  return useQuery<OllamaModelsResponse>({
    queryKey: ['ollama-models'],
    queryFn: async () => {
      const response = await fetch('/api/tags')
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Hook for fetching DeepSeek models with extended caching
 * 
 * @description Fetches available DeepSeek models from the external API.
 * Uses extended 10-minute caching as DeepSeek models change less frequently.
 * 
 * @returns {Object} Query result object containing:
 * - `data`: DeepSeekModelsResponse with models array
 * - `isLoading`: boolean indicating loading state
 * - `isError`: boolean indicating error state
 * - `error`: Error object if request failed
 * - `refetch`: Function to manually refetch data
 */
export function useDeepSeekModels() {
  return useQuery<DeepSeekModelsResponse>({
    queryKey: ['deepseek-models'],
    queryFn: async () => {
      const response = await fetch('/api/deepseek/models')
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (DeepSeek models change less frequently)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Hook for fetching all available models from both providers
 * 
 * @description Combines Ollama and DeepSeek model queries for unified access.
 * Provides a single interface to work with models from both providers.
 * 
 * @returns {Object} Combined query result containing:
 * - `ollamaModels`: Array of Ollama model objects
 * - `deepseekModels`: Array of DeepSeek model objects
 * - `isLoading`: Combined loading state (true if either query is loading)
 * - `isError`: Combined error state (true if either query has error)
 * - `error`: First error encountered from either query
 * - `refetch`: Function to refetch both queries simultaneously
 */
export function useAllModels() {
  const ollamaQuery = useOllamaModels()
  const deepseekQuery = useDeepSeekModels()

  return {
    ollamaModels: ollamaQuery.data?.models || [],
    deepseekModels: deepseekQuery.data?.data || [],
    isLoading: ollamaQuery.isLoading || deepseekQuery.isLoading,
    isError: ollamaQuery.isError || deepseekQuery.isError,
    error: ollamaQuery.error || deepseekQuery.error,
    refetch: () => {
      ollamaQuery.refetch()
      deepseekQuery.refetch()
    }
  }
}
