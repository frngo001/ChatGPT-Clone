/**
 * URL Cache Service
 * 
 * Speichert Favicon-URLs und URL-Beschreibungen persistent im localStorage,
 * um unnötige Neuabfragen zu vermeiden.
 */

interface CachedUrlData {
  faviconUrl: string | null
  description: string | null
  cachedAt: number
}

const CACHE_PREFIX = 'url_cache_'
const CACHE_EXPIRY_DAYS = 30 // Cache gültig für 30 Tage
const CACHE_EXPIRY_MS = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000

/**
 * Generiert einen Cache-Schlüssel für eine URL
 */
function getCacheKey(url: string): string {
  return `${CACHE_PREFIX}${url}`
}

/**
 * Prüft, ob ein Cache-Eintrag abgelaufen ist
 */
function isCacheExpired(cachedAt: number): boolean {
  return Date.now() - cachedAt > CACHE_EXPIRY_MS
}

/**
 * Lädt gecachte Daten für eine URL
 */
export function getCachedUrlData(url: string): CachedUrlData | null {
  try {
    const cacheKey = getCacheKey(url)
    const cached = localStorage.getItem(cacheKey)
    
    if (!cached) return null
    
    const data: CachedUrlData = JSON.parse(cached)
    
    // Prüfe, ob Cache abgelaufen ist
    if (isCacheExpired(data.cachedAt)) {
      localStorage.removeItem(cacheKey)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error reading URL cache:', error)
    return null
  }
}

/**
 * Speichert Daten für eine URL im Cache
 */
export function setCachedUrlData(url: string, data: Partial<CachedUrlData>): void {
  try {
    const cacheKey = getCacheKey(url)
    const existing = getCachedUrlData(url)
    
    const cachedData: CachedUrlData = {
      faviconUrl: data.faviconUrl ?? existing?.faviconUrl ?? null,
      description: data.description ?? existing?.description ?? null,
      cachedAt: existing?.cachedAt ?? Date.now(),
    }
    
    // Aktualisiere cachedAt nur wenn neue Daten hinzugefügt werden
    if (data.faviconUrl !== undefined || data.description !== undefined) {
      cachedData.cachedAt = Date.now()
    }
    
    localStorage.setItem(cacheKey, JSON.stringify(cachedData))
  } catch (error) {
    console.error('Error writing URL cache:', error)
    // Ignoriere QuotaExceededError - Cache ist voll
  }
}

/**
 * Löscht gecachte Daten für eine URL
 */
export function clearCachedUrlData(url: string): void {
  try {
    const cacheKey = getCacheKey(url)
    localStorage.removeItem(cacheKey)
  } catch (error) {
    console.error('Error clearing URL cache:', error)
  }
}

/**
 * Löscht alle abgelaufenen Cache-Einträge
 */
export function cleanupExpiredCache(): void {
  try {
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key)
          if (cached) {
            const data: CachedUrlData = JSON.parse(cached)
            if (isCacheExpired(data.cachedAt)) {
              keysToRemove.push(key)
            }
          }
        } catch {
          // Fehlerhafte Einträge ebenfalls löschen
          keysToRemove.push(key)
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
  } catch (error) {
    console.error('Error cleaning up URL cache:', error)
  }
}

/**
 * Ruft Favicon-URL für eine URL ab (mit Cache)
 */
export function getFaviconUrl(url: string): string | null {
  try {
    // Prüfe zuerst den Cache
    const cached = getCachedUrlData(url)
    if (cached?.faviconUrl) {
      return cached.faviconUrl
    }
    
    // Generiere Favicon-URL
    const urlObj = new URL(url)
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
    
    // Speichere im Cache
    setCachedUrlData(url, { faviconUrl })
    
    return faviconUrl
  } catch {
    return null
  }
}

/**
 * Ruft Beschreibung für eine URL ab (mit Cache)
 */
export function getUrlDescription(url: string): string | null {
  try {
    // Prüfe zuerst den Cache
    const cached = getCachedUrlData(url)
    if (cached?.description) {
      return cached.description
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Speichert Beschreibung für eine URL im Cache
 */
export function setUrlDescription(url: string, description: string): void {
  setCachedUrlData(url, { description })
}

/**
 * Führt Cleanup beim Start der Anwendung durch
 */
export function initializeUrlCache(): void {
  cleanupExpiredCache()
}

