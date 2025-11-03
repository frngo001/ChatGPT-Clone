/**
 * ============================================================================
 * CACHE CONFIGURATION
 * ============================================================================
 * 
 * @file cache-config.ts
 * @description 
 * Zentrale Konfiguration für React Query Cache-Zeiten (TTLs).
 * Verschiedene Endpoints haben unterschiedliche Cache-Strategien basierend
 * auf ihrer Datenaktualität und Update-Frequenz.
 * 
 * @author ChatGPT-Clone Team
 * @since 2.0.0
 */

/**
 * Cache-Zeiten in Millisekunden
 */
export const CACHE_TIMES = {
  // Sehr kurze Cache-Zeiten (häufig wechselnde Daten)
  API_STATUS: 30 * 1000,           // 30 Sekunden - API Health Status
  DATASET_STATUS: 10 * 1000,       // 10 Sekunden - Processing Status
  
  // Mittlere Cache-Zeiten (moderat wechselnde Daten)
  OLLAMA_MODELS: 5 * 60 * 1000,    // 5 Minuten - Lokale Modelle ändern sich selten
  CHAT_HISTORY: 5 * 60 * 1000,     // 5 Minuten - Chat-Historie
  DATASET_LIST: 2 * 60 * 1000,     // 2 Minuten - Dataset-Liste
  DATASET_DATA: 3 * 60 * 1000,     // 3 Minuten - Dataset-Dateien
  
  // Lange Cache-Zeiten (selten wechselnde Daten)
  DEEPSEEK_MODELS: 10 * 60 * 1000, // 10 Minuten - Cloud Modelle ändern sich sehr selten
  USER_SETTINGS: 10 * 60 * 1000,   // 10 Minuten - Einstellungen ändern sich selten
  TAGS: 15 * 60 * 1000,            // 15 Minuten - Tags ändern sich sehr selten
  PERMISSIONS: 5 * 60 * 1000,      // 5 Minuten - Berechtigungen
  
  // Sehr lange Cache-Zeiten (quasi-statische Daten)
  STATIC_CONTENT: 30 * 60 * 1000,  // 30 Minuten - Statische Inhalte
} as const

/**
 * Cache-Konfiguration für verschiedene Query-Typen
 * 
 * @example
 * ```typescript
 * import { CACHE_CONFIG } from '@/config/cache-config'
 * 
 * useQuery({
 *   queryKey: ['api-status'],
 *   queryFn: fetchApiStatus,
 *   ...CACHE_CONFIG.API_STATUS
 * })
 * ```
 */
export const CACHE_CONFIG = {
  API_STATUS: {
    staleTime: CACHE_TIMES.API_STATUS,
    gcTime: CACHE_TIMES.API_STATUS * 2, // Garbage Collection nach 2x staleTime
    refetchOnWindowFocus: true, // Refetch wenn Tab fokussiert wird
  },
  
  DATASET_STATUS: {
    staleTime: CACHE_TIMES.DATASET_STATUS,
    gcTime: CACHE_TIMES.DATASET_STATUS * 3,
    refetchOnWindowFocus: false,
  },
  
  OLLAMA_MODELS: {
    staleTime: CACHE_TIMES.OLLAMA_MODELS,
    gcTime: CACHE_TIMES.OLLAMA_MODELS * 2,
    refetchOnWindowFocus: false,
  },
  
  DEEPSEEK_MODELS: {
    staleTime: CACHE_TIMES.DEEPSEEK_MODELS,
    gcTime: CACHE_TIMES.DEEPSEEK_MODELS * 2,
    refetchOnWindowFocus: false,
  },
  
  CHAT_HISTORY: {
    staleTime: CACHE_TIMES.CHAT_HISTORY,
    gcTime: CACHE_TIMES.CHAT_HISTORY * 2,
    refetchOnWindowFocus: false,
  },
  
  DATASET_LIST: {
    staleTime: CACHE_TIMES.DATASET_LIST,
    gcTime: CACHE_TIMES.DATASET_LIST * 2,
    refetchOnWindowFocus: false,
  },
  
  DATASET_DATA: {
    staleTime: CACHE_TIMES.DATASET_DATA,
    gcTime: CACHE_TIMES.DATASET_DATA * 2,
    refetchOnWindowFocus: false,
  },
  
  USER_SETTINGS: {
    staleTime: CACHE_TIMES.USER_SETTINGS,
    gcTime: CACHE_TIMES.USER_SETTINGS * 2,
    refetchOnWindowFocus: false,
  },
  
  TAGS: {
    staleTime: CACHE_TIMES.TAGS,
    gcTime: CACHE_TIMES.TAGS * 2,
    refetchOnWindowFocus: false,
  },
  
  PERMISSIONS: {
    staleTime: CACHE_TIMES.PERMISSIONS,
    gcTime: CACHE_TIMES.PERMISSIONS * 2,
    refetchOnWindowFocus: false,
  },
  
  STATIC_CONTENT: {
    staleTime: CACHE_TIMES.STATIC_CONTENT,
    gcTime: CACHE_TIMES.STATIC_CONTENT * 2,
    refetchOnWindowFocus: false,
  },
} as const

/**
 * Helper-Funktion um Cache-Konfiguration basierend auf Endpoint-Typ zu erhalten
 * 
 * @param type - Typ des Endpoints
 * @returns Cache-Konfiguration
 * 
 * @example
 * ```typescript
 * const config = getCacheConfig('API_STATUS')
 * useQuery({ queryKey: ['status'], queryFn: fetchStatus, ...config })
 * ```
 */
export function getCacheConfig(type: keyof typeof CACHE_CONFIG) {
  return CACHE_CONFIG[type]
}

