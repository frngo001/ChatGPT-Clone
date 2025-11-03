/**
 * ============================================================================
 * RETRY UTILITY
 * ============================================================================
 * 
 * @file retry.ts
 * @description 
 * Utility-Funktionen für Retry-Logik bei API-Calls.
 * Unterstützt exponential backoff und konfigurierbare Retry-Bedingungen.
 * 
 * @author ChatGPT-Clone Team
 * @since 1.0.0
 */

/**
 * Retry-Konfiguration
 */
export interface RetryOptions {
  /** Maximale Anzahl an Retry-Versuchen (default: 3) */
  maxRetries?: number
  /** Initiale Verzögerung in ms (default: 1000) */
  initialDelay?: number
  /** Maximaler Delay in ms (default: 30000) */
  maxDelay?: number
  /** Exponential Backoff Multiplikator (default: 2) */
  backoffMultiplier?: number
  /** Bedingung für Retry - gibt zurück ob retry gemacht werden soll */
  shouldRetry?: (error: Error, attempt: number) => boolean
  /** Callback vor jedem Retry */
  onRetry?: (error: Error, attempt: number, delay: number) => void
}

/**
 * Default Retry-Optionen
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  shouldRetry: (error: Error) => {
    // Retry für alle Fehler außer Auth-Fehler
    return !error.message.includes('401') && !error.message.includes('403')
  },
  onRetry: () => {},
}

/**
 * Berechnet Delay für exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt)
  return Math.min(delay, maxDelay)
}

/**
 * Wartet für die angegebene Zeit
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Führt eine asynchrone Funktion mit Retry-Logik aus
 * 
 * @param fn - Die Funktion die ausgeführt werden soll
 * @param options - Retry-Optionen
 * @returns Promise mit dem Ergebnis der Funktion
 * @throws Letzter Fehler wenn alle Retries fehlgeschlagen sind
 * 
 * @example
 * ```typescript
 * const result = await retry(
 *   () => fetch('/api/datasets'),
 *   { maxRetries: 3, initialDelay: 1000 }
 * )
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: Error

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Prüfe ob Retry gemacht werden soll
      if (!config.shouldRetry(lastError, attempt)) {
        throw lastError
      }

      // Kein Retry mehr bei letztem Versuch
      if (attempt >= config.maxRetries) {
        throw lastError
      }

      // Berechne Delay für nächsten Retry
      const delay = calculateDelay(
        attempt,
        config.initialDelay,
        config.maxDelay,
        config.backoffMultiplier
      )

      // Callback vor Retry
      config.onRetry(lastError, attempt + 1, delay)

      // Warte vor nächstem Versuch
      await wait(delay)
    }
  }

  throw lastError!
}

/**
 * Prüft ob ein Fehler retry-fähig ist
 * 
 * @param error - Der Fehler
 * @returns true wenn retry-fähig, false sonst
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase()

  // Nicht retry-fähig: Auth-Fehler, Validation-Fehler, Client-Fehler (4xx außer 429)
  if (message.includes('401') || message.includes('unauthorized')) return false
  if (message.includes('403') || message.includes('forbidden')) return false
  if (message.includes('404') || message.includes('not found')) return false
  if (message.includes('400') || message.includes('bad request')) return false
  if (message.includes('422') || message.includes('validation')) return false

  // Retry-fähig: Server-Fehler (5xx), Network-Fehler, Rate-Limiting (429), Timeout
  if (message.includes('500') || message.includes('502') || message.includes('503')) return true
  if (message.includes('504') || message.includes('timeout')) return true
  if (message.includes('429') || message.includes('rate limit')) return true
  if (message.includes('network') || message.includes('fetch failed')) return true

  // Default: retry-fähig für unbekannte Fehler
  return true
}

/**
 * Retry-Konfiguration für kritische API-Calls
 */
export const CRITICAL_API_RETRY_CONFIG: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  shouldRetry: isRetryableError,
  onRetry: (error, attempt, delay) => {
    if (import.meta.env.DEV) {
      console.warn(`Retry attempt ${attempt} after ${delay}ms:`, error.message)
    }
  },
}

/**
 * Retry-Konfiguration für File-Uploads (längere Retries)
 */
export const FILE_UPLOAD_RETRY_CONFIG: RetryOptions = {
  maxRetries: 2,
  initialDelay: 2000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  shouldRetry: isRetryableError,
  onRetry: (error, attempt, delay) => {
    if (import.meta.env.DEV) {
      console.warn(`File upload retry attempt ${attempt} after ${delay}ms:`, error.message)
    }
  },
}

