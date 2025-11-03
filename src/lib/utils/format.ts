/**
 * Date formatting utilities
 */

export interface FormatDateOptions {
  /** Include time in the formatted string */
  includeTime?: boolean
  /** Use long format for month (e.g., "Januar" instead of "Jan") */
  longMonth?: boolean
  /** Custom locale (default: 'de-DE') */
  locale?: string
}

/**
 * Formats a date according to German locale conventions
 * 
 * @param date - Date to format (Date object, ISO string, or undefined)
 * @param options - Formatting options
 * @returns Formatted date string or 'Unbekannt' if date is invalid
 * 
 * @example
 * formatDate(new Date()) // "28. Okt. 2025, 12:00"
 * formatDate(new Date(), { includeTime: false }) // "28. Okt. 2025"
 * formatDate(new Date(), { longMonth: true }) // "28. Oktober 2025, 12:00"
 */
export function formatDate(
  date: Date | string | undefined | null,
  options: FormatDateOptions = {}
): string {
  if (!date) return 'Unbekannt'

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return 'Unbekannt'
    }

    const { includeTime = true, longMonth = false, locale = 'de-DE' } = options

    const formatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: longMonth ? 'long' : 'short',
      day: 'numeric',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj)
  } catch {
    return 'Unbekannt'
  }
}

/**
 * File name truncation utilities
 */

export interface TruncateFileNameOptions {
  /** Maximum length for the truncated string */
  maxLength?: number
  /** Preserve file extension when truncating */
  preserveExtension?: boolean
  /** Show ellipsis at the end (default: true) */
  showEllipsis?: boolean
}

/**
 * Truncates a file name to fit within a maximum length
 * For URLs, tries to preserve domain and path information
 * 
 * @param fileName - File name or URL to truncate
 * @param options - Truncation options
 * @returns Truncated file name
 * 
 * @example
 * truncateFileName('very-long-file-name.pdf', { maxLength: 20 }) // "very-long-file-nam..."
 * truncateFileName('https://example.com/path/to/file.pdf', { maxLength: 30 }) // "example.com/...file.pdf"
 */
export function truncateFileName(
  fileName: string,
  options: TruncateFileNameOptions = {}
): string {
  const {
    maxLength = 35,
    preserveExtension = true,
    showEllipsis = true,
  } = options

  if (fileName.length <= maxLength) return fileName

  // For URLs, try to keep the domain and path visible
  if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
    try {
      const url = new URL(fileName)
      const domain = url.hostname
      const pathname = url.pathname

      // If just the domain + short path fits, show that
      const shortPath = pathname.length > 20 ? '...' + pathname.slice(-17) : pathname
      const displayUrl = domain + shortPath

      if (displayUrl.length <= maxLength) {
        return displayUrl
      }

      // Otherwise, show domain and truncated path
      const maxDomainLength = Math.min(domain.length, Math.floor(maxLength / 2))
      const maxPathLength = maxLength - maxDomainLength - 4
      return (
        domain.substring(0, maxDomainLength) +
        '...' +
        pathname.slice(-maxPathLength)
      )
    } catch {
      // If URL parsing fails, fall back to regular truncation
    }
  }

  // Regular truncation for non-URLs or if URL parsing fails
  if (preserveExtension) {
    const lastDotIndex = fileName.lastIndexOf('.')
    if (lastDotIndex > 0) {
      const extension = fileName.substring(lastDotIndex)
      const nameWithoutExt = fileName.substring(0, lastDotIndex)
      const maxNameLength = maxLength - extension.length - (showEllipsis ? 3 : 0)
      
      if (nameWithoutExt.length > maxNameLength) {
        return (
          nameWithoutExt.substring(0, maxNameLength) +
          (showEllipsis ? '...' : '') +
          extension
        )
      }
    }
  }

  // Simple truncation
  return (
    fileName.substring(0, maxLength - (showEllipsis ? 3 : 0)) +
    (showEllipsis ? '...' : '')
  )
}

