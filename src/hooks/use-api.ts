/**
 * ============================================================================
 * REACT QUERY API HOOKS
 * ============================================================================
 * 
 * @file use-api.ts
 * @description 
 * Custom React Hooks für API-Status, Chat-Historie und Settings.
 * Nutzt TanStack Query (React Query) für State Management und Caching.
 * 
 * Features:
 * - API Health Monitoring
 * - Optimistic Updates
 * - Cache Management
 * - Automatic Refetching
 * 
 * @author ChatGPT-Clone Team
 * @since 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CACHE_CONFIG } from '@/config/cache-config'

/**
 * ============================================================================
 * API STATUS HOOK
 * ============================================================================
 */

/**
 * Hook für API Health Status Monitoring
 * 
 * @description 
 * Prüft parallel den Health-Status von Ollama und DeepSeek APIs.
 * Nutzt Promise.allSettled für unabhängige Error-Behandlung.
 * 
 * Caching: 30 Sekunden
 * Retries: 2 Versuche
 * 
 * @returns {Object} Query result mit:
 * - `data`: API Status Info
 *   - `ollama`: boolean (true = healthy)
 *   - `deepseek`: boolean (true = healthy)
 *   - `ollamaError`: Error falls Ollama fehlschlägt
 *   - `deepseekError`: Error falls DeepSeek fehlschlägt
 * - `isLoading`: boolean
 * - `isError`: boolean
 * 
 * @example
 * ```typescript
 * const { data } = useApiStatus();
 * if (data?.ollama) console.log('Ollama is ready');
 * if (data?.deepseek) console.log('DeepSeek is ready');
 * ```
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
    ...CACHE_CONFIG.API_STATUS,
    retry: 2,
  })
}

/**
 * ============================================================================
 * CHAT HISTORY HOOK
 * ============================================================================
 */

/**
 * Hook für Chat-Historie Management
 * 
 * @description 
 * Verwaltet Chat-Historie-Daten. Aktuell nutzt lokalen Store.
 * Kann erweitert werden für Backend-Integration.
 * 
 * Caching: 5 Minuten
 * 
 * @returns {Object} Query result mit:
 * - `data`: Array von Chat-History Items (aktuell leer)
 * - `isLoading`: boolean
 * 
 * @todo Backend-Integration für persistente Chat-Historie
 */
export function useChatHistory() {
  return useQuery({
    queryKey: ['chat-history'],
    queryFn: async () => {
      // Here chat history data could be fetched from a backend
      // Currently we use the local store
      return []
    },
    ...CACHE_CONFIG.CHAT_HISTORY,
  })
}

/**
 * ============================================================================
 * USER SETTINGS HOOK
 * ============================================================================
 */

/**
 * Hook für Benutzereinstellungen
 * 
 * @description 
 * Lädt Benutzereinstellungen mit erweitertem Caching.
 * Aktuell: Default-Werte
 * Erweiterbar: Backend-Integration
 * 
 * Caching: 10 Minuten
 * 
 * @returns {Object} Query result mit:
 * - `data`: Settings object (theme, language, defaultModel, defaultProvider)
 * - `isLoading`: boolean
 * 
 * @todo Backend-Integration für persistente Settings
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
    ...CACHE_CONFIG.USER_SETTINGS,
  })
}

/**
 * ============================================================================
 * CACHE INVALIDATION HOOK
 * ============================================================================
 */

/**
 * Hook für Cache Management Utilities
 * 
 * @description 
 * Bietet Convenience-Funktionen für Cache-Invalidierung und Refetching.
 * Besonders nützlich für Model-bezogene Queries.
 * 
 * @returns {Object} Cache-Utilities:
 * - `invalidateModels`: Invalidiert Ollama + DeepSeek Model Queries
 * - `invalidateAll`: Invalidiert alle Queries im Cache
 * - `refetchModels`: Refetched beide Model Queries
 * 
 * @example
 * ```typescript
 * const { invalidateModels } = useInvalidateQueries();
 * await addModel();
 * invalidateModels(); // Cache refresh
 * ```
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
 * ============================================================================
 * OPTIMISTIC UPDATES HOOK
 * ============================================================================
 */

/**
 * Hook für Optimistic Chat Message Updates
 * 
 * @description 
 * Implementiert Optimistic Updates für Chat-Nachrichten.
 * Features:
 * - Sofortige UI-Updates (Optimistic)
 * - Automatisches Rollback bei Fehler
 * - Cache-Invalidierung nach Completion
 * 
 * @returns {Object} Mutation object mit:
 * - `mutate`: Funktion zum Hinzufügen von Messages
 * - `isPending`: Loading-State während Mutation
 * - `isError`: Error-State bei Fehlschlag
 * - `error`: Error-Objekt bei Fehler
 * 
 * @example
 * ```typescript
 * const { mutate } = useOptimisticChat();
 * 
 * mutate({
 *   id: 'msg-1',
 *   content: 'Hello!',
 *   role: 'user'
 * });
 * ```
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
