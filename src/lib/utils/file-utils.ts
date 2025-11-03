/**
 * Utility functions for file operations
 */

/**
 * Extracts the file extension from a filename (including the dot)
 * @param filename - The filename to extract extension from
 * @returns The file extension including the dot (e.g., '.pdf'), or empty string if no extension
 */
export function getFileExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return ''
  }
  
  const lastDot = filename.lastIndexOf('.')
  return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : ''
}

/**
 * Determines the MIME type based on file extension
 * @param extension - The file extension (with or without dot, e.g., '.pdf' or 'pdf')
 * @returns The MIME type string, defaults to 'application/octet-stream' if unknown
 */
export function getMimeTypeFromExtension(extension: string): string {
  if (!extension || typeof extension !== 'string') {
    return 'application/octet-stream'
  }

  // Normalize extension: remove leading dot and convert to lowercase
  const normalizedExt = extension.startsWith('.') 
    ? extension.substring(1).toLowerCase() 
    : extension.toLowerCase()

  // Comprehensive MIME type mapping
  const mimeTypeMap: Record<string, string> = {
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
    
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
    
    // Code files
    'js': 'application/javascript',
    'jsx': 'application/javascript',
    'ts': 'application/typescript',
    'tsx': 'application/typescript',
    'py': 'text/x-python',
    'java': 'text/x-java-source',
    'cpp': 'text/x-c++src',
    'c': 'text/x-csrc',
    'cs': 'text/x-csharp',
    'php': 'text/x-php',
    'rb': 'text/x-ruby',
    'go': 'text/x-go',
    'rs': 'text/x-rust',
    'swift': 'text/x-swift',
    'kt': 'text/x-kotlin',
    'sql': 'text/x-sql',
    'sh': 'text/x-shellscript',
    'bash': 'text/x-shellscript',
    
    // Other common types
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
    'yaml': 'text/yaml',
    'yml': 'text/yaml',
    'log': 'text/plain',
    'url': 'text/uri-list',
  }

  return mimeTypeMap[normalizedExt] || 'application/octet-stream'
}

/**
 * Gets both extension and MIME type from a filename
 * @param filename - The filename to analyze
 * @returns An object containing the extension and mimeType
 */
export function getFileInfo(filename: string): { extension: string; mimeType: string } {
  const extension = getFileExtension(filename)
  const mimeType = getMimeTypeFromExtension(extension)
  
  return {
    extension: extension.startsWith('.') ? extension.substring(1) : extension,
    mimeType,
  }
}
