import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Hook for monitoring API health status
 * 
 * @description Checks the health status of both Ollama and DeepSeek APIs
 * in parallel with individual error tracking and 30-second caching.
 * 
 * @returns {Object} Query result containing:
 * - `data`: Object with API status information
 *   - `ollama`: boolean indicating Ollama API health
 *   - `deepseek`: boolean indicating DeepSeek API health
 *   - `ollamaError`: Error object for Ollama API if failed
 *   - `deepseekError`: Error object for DeepSeek API if failed
 * - `isLoading`: boolean indicating loading state
 * - `isError`: boolean indicating error state
 */
export function useApiStatus() {
  return useQuery({
    queryKey: ['api-status'],
    queryFn: async () => {
      const [ollamaResponse, deepseekResponse] = await Promise.allSettled([
        fetch('/api/tags').then(res => res.ok),
        fetch('/api/deepseek/models').then(res => res.ok)
      ])

      return {
        ollama: ollamaResponse.status === 'fulfilled' && ollamaResponse.value,
        deepseek: deepseekResponse.status === 'fulfilled' && deepseekResponse.value,
        ollamaError: ollamaResponse.status === 'rejected' ? ollamaResponse.reason : null,
        deepseekError: deepseekResponse.status === 'rejected' ? deepseekResponse.reason : null,
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  })
}

/**
 * Hook for managing chat history data
 * 
 * @description Currently uses local store for chat history management.
 * Can be extended to fetch from backend API in the future.
 * 
 * @returns {Object} Query result containing:
 * - `data`: Array of chat history items (currently empty)
 * - `isLoading`: boolean indicating loading state
 */
export function useChatHistory() {
  return useQuery({
    queryKey: ['chat-history'],
    queryFn: async () => {
      // Here chat history data could be fetched from a backend
      // Currently we use the local store
      return []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for managing user settings
 * 
 * @description Fetches user settings with extended caching.
 * Currently returns default values, can be extended to fetch from backend.
 * 
 * @returns {Object} Query result containing:
 * - `data`: User settings object with theme, language, and model preferences
 * - `isLoading`: boolean indicating loading state
 */
export function useUserSettings() {
  return useQuery({
    queryKey: ['user-settings'],
    queryFn: async () => {
      // Here user settings could be fetched from a backend
      return {
        theme: 'system',
        language: 'de',
        defaultModel: null,
        defaultProvider: 'ollama' as const,
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook for cache invalidation utilities
 * 
 * @description Provides convenient functions for invalidating and refetching
 * TanStack Query cache entries, particularly useful for model-related queries.
 * 
 * @returns {Object} Cache invalidation utilities:
 * - `invalidateModels`: Invalidates both Ollama and DeepSeek model queries
 * - `invalidateAll`: Invalidates all queries in the cache
 * - `refetchModels`: Refetches both model queries
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient()

  return {
    invalidateModels: () => {
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] })
      queryClient.invalidateQueries({ queryKey: ['deepseek-models'] })
    },
    invalidateAll: () => {
      queryClient.invalidateQueries()
    },
    refetchModels: () => {
      queryClient.refetchQueries({ queryKey: ['ollama-models'] })
      queryClient.refetchQueries({ queryKey: ['deepseek-models'] })
    }
  }
}

/**
 * Hook for optimistic chat message updates
 * 
 * @description Implements optimistic updates for chat messages with automatic
 * rollback on error and cache invalidation after completion.
 * 
 * @returns {Object} Mutation object containing:
 * - `mutate`: Function to add message optimistically
 * - `isPending`: Loading state during mutation
 * - `isError`: Error state if mutation failed
 * - `error`: Error object if mutation failed
 */
export function useOptimisticChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newMessage: { id: string; content: string; role: 'user' | 'assistant' }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100))
      return newMessage
    },
    onMutate: async (newMessage) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['chat-history'] })
      
      const previousHistory = queryClient.getQueryData(['chat-history'])
      
      queryClient.setQueryData(['chat-history'], (old: any) => [
        ...(old || []),
        newMessage
      ])

      return { previousHistory }
    },
    onError: (_err, _newMessage, context) => {
      // Rollback on error
      if (context?.previousHistory) {
        queryClient.setQueryData(['chat-history'], context.previousHistory)
      }
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['chat-history'] })
    },
  })
}
