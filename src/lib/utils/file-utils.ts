/**
 * Utility functions for file operations
 */

/**
 * Known file extensions that should NOT be treated as URLs
 */
const FILE_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'ods', 'odp',
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'tif', 'heic', 'heif',
  'txt', 'md', 'markdown', 'csv', 'xml', 'html', 'htm', 'css', 'json', 'jsonl', 'rtf',
  'js', 'jsx', 'mjs', 'ts', 'tsx', 'py', 'pyc', 'pyo', 'java', 'class', 'jar',
  'cpp', 'cxx', 'cc', 'c', 'h', 'hpp', 'cs', 'php', 'rb', 'go', 'rs', 'swift',
  'kt', 'scala', 'clj', 'sql', 'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
  'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma',
  'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv',
  'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'yaml', 'yml', 'toml', 'ini', 'conf', 'log'
]

/**
 * Checks if a string is a URL (not a regular filename)
 * @param str - The string to check
 * @returns true if the string appears to be a URL
 */
export function isUrl(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false
  }
  
  const trimmed = str.trim()
  
  // FIRST: Check for explicit URL patterns (these always indicate URLs, even with file extensions)
  const explicitUrlPatterns = [
    /^https?:\/\//i,           // http:// or https://
    /^ftp:\/\//i,               // ftp://
    /^s3:\/\//i,                // s3://
    /^file:\/\//i,              // file://
    /^www\./i,                  // www.example.com
  ]
  
  // If it matches explicit URL patterns, it's definitely a URL
  if (explicitUrlPatterns.some(pattern => pattern.test(trimmed))) {
    return true
  }
  
  // SECOND: If it has a known file extension (and no URL protocol), it's likely a filename, not a URL
  const hasFileExtension = FILE_EXTENSIONS.some(ext => {
    // Check if string ends with .extension (case insensitive)
    const extPattern = new RegExp(`\\.${ext}$`, 'i')
    return extPattern.test(trimmed)
  })
  
  if (hasFileExtension) {
    return false
  }
  
  // THIRD: Check for domain patterns only if no file extension was found
  // Domain must have at least one slash or query parameter to distinguish from filenames
  const domainPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(\/|\?|#|$)/i
  
  // Only treat as URL if it looks like a domain with a path, query, or fragment
  // This prevents "filename.md" from being recognized as a URL
  return domainPattern.test(trimmed) && (trimmed.includes('/') || trimmed.includes('?') || trimmed.includes('#'))
}

/**
 * Extracts the file extension from a filename (including the dot)
 * @param filename - The filename to extract extension from
 * @returns The file extension including the dot (e.g., '.pdf'), or empty string if no extension
 */
export function getFileExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return ''
  }
  
  // If it's a URL, return 'url' as extension
  if (isUrl(filename)) {
    return '.url'
  }
  
  const lastDot = filename.lastIndexOf('.')
  return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : ''
}

/**
 * Determines the MIME type based on file extension or filename
 * @param extension - The file extension (with or without dot, e.g., '.pdf' or 'pdf')
 * @param filename - Optional filename for URL detection
 * @returns The MIME type string, defaults to 'application/octet-stream' if unknown
 */
export function getMimeTypeFromExtension(extension: string, filename?: string): string {
  if (!extension || typeof extension !== 'string') {
    // If filename is provided, check if it's a URL
    if (filename && isUrl(filename)) {
      return 'url'
    }
    return 'application/octet-stream'
  }

  // Normalize extension: remove leading dot and convert to lowercase
  const normalizedExt = extension.startsWith('.') 
    ? extension.substring(1).toLowerCase() 
    : extension.toLowerCase()

  // Comprehensive MIME type mapping
  const mimeTypeMap: Record<string, string> = {
    // URLs - must be 'url' not 'text/uri-list'
    'url': 'url',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'odt': 'application/vnd.oasis.opendocument.text',
    'ods': 'application/vnd.oasis.opendocument.spreadsheet',
    'odp': 'application/vnd.oasis.opendocument.presentation',
    
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
    'tiff': 'image/tiff',
    'tif': 'image/tiff',
    'heic': 'image/heic',
    'heif': 'image/heif',
    
    // Text files
    'txt': 'text/plain',
    'md': 'text/markdown',
    'markdown': 'text/markdown',
    'csv': 'text/csv',
    'xml': 'text/xml',
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'json': 'application/json',
    'jsonl': 'application/jsonl',
    'rtf': 'application/rtf',
    
    // Code files
    'js': 'application/javascript',
    'jsx': 'application/javascript',
    'mjs': 'application/javascript',
    'ts': 'application/typescript',
    'tsx': 'application/typescript',
    'py': 'text/x-python',
    'pyc': 'application/x-python-code',
    'pyo': 'application/x-python-code',
    'java': 'text/x-java-source',
    'class': 'application/java-vm',
    'jar': 'application/java-archive',
    'cpp': 'text/x-c++src',
    'cxx': 'text/x-c++src',
    'cc': 'text/x-c++src',
    'c': 'text/x-csrc',
    'h': 'text/x-chdr',
    'hpp': 'text/x-c++hdr',
    'cs': 'text/x-csharp',
    'php': 'text/x-php',
    'rb': 'text/x-ruby',
    'go': 'text/x-go',
    'rs': 'text/x-rust',
    'swift': 'text/x-swift',
    'kt': 'text/x-kotlin',
    'scala': 'text/x-scala',
    'clj': 'text/x-clojure',
    'sql': 'text/x-sql',
    'sh': 'text/x-shellscript',
    'bash': 'text/x-shellscript',
    'zsh': 'text/x-shellscript',
    'fish': 'text/x-shellscript',
    'ps1': 'application/x-powershell',
    'bat': 'application/x-msdos-program',
    'cmd': 'application/x-msdos-program',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
    'aac': 'audio/aac',
    'm4a': 'audio/mp4',
    'wma': 'audio/x-ms-wma',
    
    // Video
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    'webm': 'video/webm',
    'mkv': 'video/x-matroska',
    
    // Other common types
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
    'bz2': 'application/x-bzip2',
    'xz': 'application/x-xz',
    'yaml': 'text/yaml',
    'yml': 'text/yaml',
    'toml': 'text/x-toml',
    'ini': 'text/plain',
    'conf': 'text/plain',
    'log': 'text/plain',
  }

  return mimeTypeMap[normalizedExt] || 'application/octet-stream'
}

/**
 * Gets both extension and MIME type from a filename
 * @param filename - The filename to analyze (can be a URL or regular filename)
 * @returns An object containing the extension and mimeType
 */
export function getFileInfo(filename: string): { extension: string; mimeType: string } {
  // Check if it's a URL first
  if (isUrl(filename)) {
    return {
      extension: 'url',
      mimeType: 'url',
    }
  }
  
  const extension = getFileExtension(filename)
  const mimeType = getMimeTypeFromExtension(extension, filename)
  
  return {
    extension: extension.startsWith('.') ? extension.substring(1) : extension,
    mimeType,
  }
}
