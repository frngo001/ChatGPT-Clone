import { useState, useEffect, lazy, Suspense } from 'react'
import { Download, Loader2, FileText, FileCode, File as FileIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { useDatasetStore } from '@/stores/dataset-store'
import { datasetsApi } from '@/lib/api/datasets-api'
import { getFileInfo } from '@/lib/utils/file-utils'
import { Response } from '@/components/ui/response'
import { useTheme } from '@/context/theme-provider'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

// Lazy load preview components
const PdfPreviewSheet = lazy(() => import('./pdf-preview-sheet').then(module => ({ default: module.PdfPreviewSheet })))
const ImagePreviewSheet = lazy(() => import('./image-preview-sheet').then(module => ({ default: module.ImagePreviewSheet })))

interface FilePreviewSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileId: string
  fileName: string
  datasetId: string
}

/**
 * Generische File Preview Komponente, die verschiedene Dateitypen unterstützt
 * - PDFs: Vollständiger PDF-Viewer
 * - Bilder: Zoom/Rotate-Funktionen
 * - Text/Markdown/Code: Syntax-Highlighting und Rendering
 * - Andere: Download-Option
 */
export function FilePreviewSheet({
  open,
  onOpenChange,
  fileId,
  fileName,
  datasetId,
}: FilePreviewSheetProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string>('')
  
  const { downloadDatasetFile } = useDatasetStore()
  const { resolvedTheme } = useTheme()

  // Detect file type
  const getFileTypeCategory = (fileName: string, mimeType: string): string => {
    const fileInfo = getFileInfo(fileName)
    const ext = fileInfo.extension.toLowerCase()
    
    // PDF
    if (ext === 'pdf' || mimeType === 'application/pdf') {
      return 'pdf'
    }
    
    // Images
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif', 'ico', 'heic', 'heif']
    if (imageExts.includes(ext) || mimeType.startsWith('image/')) {
      return 'image'
    }
    
    // CSV
    if (ext === 'csv' || mimeType === 'text/csv') {
      return 'csv'
    }
    
    // Code files - check FIRST to ensure HTML/CSS/JS etc. are always treated as code
    // Extension-based detection takes priority over MIME type
    const codeExts = [
      'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'hpp', 'cs', 
      'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'clj', 'sql', 'sh', 
      'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd', 'html', 'htm', 'css', 
      'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'conf'
    ]
    const codeMimeTypes = [
      'text/html', 'text/css', 'application/javascript', 'application/typescript',
      'text/x-python', 'text/x-java-source', 'text/x-c++src', 'text/x-csrc',
      'text/x-php', 'text/x-ruby', 'text/x-go', 'text/x-rust', 'text/x-swift',
      'text/x-kotlin', 'text/x-scala', 'text/x-clojure', 'text/x-sql',
      'text/x-shellscript', 'application/x-powershell', 'application/json',
      'text/xml', 'text/yaml', 'text/x-toml'
    ]
    // Priority: Extension first, then MIME type (but only if extension doesn't indicate text/markdown)
    if (codeExts.includes(ext)) {
      return 'code'
    }
    if (codeMimeTypes.some(mt => mimeType.includes(mt))) {
      return 'code'
    }
    
    // Text/Markdown - check AFTER code to ensure Markdown is rendered as Markdown, not code
    // Only check if NOT a code extension
    const textExts = ['txt', 'md', 'markdown']
    if (textExts.includes(ext) || (mimeType === 'text/plain' && !codeExts.includes(ext)) || mimeType === 'text/markdown') {
      return 'text'
    }
    
    return 'other'
  }

  // Load file function
  const loadFile = async () => {
    setIsLoading(true)
    setError(null)

    // Cleanup previous URL
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl)
    }

    try {
      const blob = await datasetsApi.getRawData(datasetId, fileId)
      const type = getFileTypeCategory(fileName, blob.type)
      setFileType(type)
      
      // For text and code files, read content as text
      if (type === 'text' || type === 'code' || type === 'csv') {
        const text = await blob.text()
        setFileContent(text)
        setIsLoading(false)
      } else {
        // For binary files (PDF, images), create URL
        const url = URL.createObjectURL(blob)
        setFileUrl(url)
        setIsLoading(false)
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          setError('Datei nicht gefunden')
        } else {
          setError('Datei konnte nicht geladen werden')
        }
      } else {
        setError('Datei konnte nicht geladen werden')
      }
      
      setIsLoading(false)
    }
  }

  // Load file when sheet opens
  useEffect(() => {
    if (open && fileId && datasetId) {
      loadFile()
    } else {
      // Reset state and cleanup URL when closed
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl)
      }
      setFileUrl(null)
      setFileContent(null)
      setError(null)
      setFileType('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fileId, datasetId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl)
      }
    }
  }, [fileUrl])

  const handleDownload = async () => {
    try {
      await downloadDatasetFile(datasetId, fileId, fileName)
      toast.success('Datei erfolgreich heruntergeladen')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Herunterladen der Datei'
      toast.error(errorMessage)
    }
  }

  // If it's a PDF or image, use specialized component
  if (fileType === 'pdf') {
    return (
      <Suspense fallback={
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">PDF-Viewer wird geladen...</p>
          </div>
        </div>
      }>
        <PdfPreviewSheet
          open={open}
          onOpenChange={onOpenChange}
          fileId={fileId}
          fileName={fileName}
          datasetId={datasetId}
        />
      </Suspense>
    )
  }

  if (fileType === 'image') {
    return (
      <Suspense fallback={
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Bild-Viewer wird geladen...</p>
          </div>
        </div>
      }>
        <ImagePreviewSheet
          open={open}
          onOpenChange={onOpenChange}
          fileId={fileId}
          fileName={fileName}
          datasetId={datasetId}
        />
      </Suspense>
    )
  }

  // Get file icon and description
  const getFileIcon = () => {
    switch (fileType) {
      case 'text':
        return <FileText className="h-5 w-5" />
      case 'code':
        return <FileCode className="h-5 w-5" />
      case 'csv':
        return <FileText className="h-5 w-5" />
      default:
        return <FileIcon className="h-5 w-5" />
    }
  }

  const getFileDescription = () => {
    switch (fileType) {
      case 'text':
        return 'Text-Vorschau'
      case 'code':
        return 'Code-Vorschau'
      case 'csv':
        return 'CSV-Vorschau'
      default:
        return 'Datei-Vorschau'
    }
  }

  // Detect language for syntax highlighting
  const getLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'bash',
      'fish': 'bash',
      'ps1': 'powershell',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'toml': 'toml',
      'md': 'markdown',
      'markdown': 'markdown',
    }
    return langMap[ext] || 'plaintext'
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:max-w-[900px] p-0 flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2">
                {getFileIcon()}
                <SheetTitle className="text-base truncate">{fileName}</SheetTitle>
              </div>
              <SheetDescription className="text-xs">
                {getFileDescription()}
              </SheetDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 px-3 text-xs shrink-0"
            >
              <Download className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </SheetHeader>

        {/* File Content */}
        <div className="flex-1 overflow-auto relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Datei wird geladen...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background z-10">
              <div className="rounded-full bg-destructive/10 p-3">
                <svg
                  className="h-6 w-6 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium">{error}</p>
              <Button size="sm" variant="outline" onClick={loadFile}>
                Erneut versuchen
              </Button>
            </div>
          )}

          {fileContent && !error && (
            <div className="p-4">
              {fileType === 'text' && (
                fileName.toLowerCase().endsWith('.md') || 
                fileName.toLowerCase().endsWith('.markdown') ||
                fileContent.trim().match(/^#+\s|^\*\s|^-\s|^\d+\.\s/m)
              ) ? (
                // Markdown rendering
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Response className="text-sm leading-relaxed">
                    {fileContent}
                  </Response>
                </div>
              ) : fileType === 'code' || fileType === 'csv' ? (
                // Code with syntax highlighting
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted px-4 py-2 text-xs font-medium border-b border-border flex items-center justify-between">
                    <span>{fileName}</span>
                    <span className="text-muted-foreground">{getLanguage(fileName)}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <SyntaxHighlighter
                      language={getLanguage(fileName)}
                      style={resolvedTheme === 'dark' ? oneDark : oneLight}
                      customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        fontSize: '0.75rem',
                        lineHeight: '1.5',
                        padding: '1rem',
                      }}
                      PreTag="div"
                    >
                      {fileContent}
                    </SyntaxHighlighter>
                  </div>
                </div>
              ) : (
                // Plain text
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted px-4 py-2 text-xs font-medium border-b border-border">
                    {fileName}
                  </div>
                  <pre className="p-4 overflow-x-auto text-xs whitespace-pre-wrap break-words font-mono">
                    {fileContent}
                  </pre>
                </div>
              )}
            </div>
          )}

          {fileType === 'other' && !isLoading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background">
              <div className="rounded-full bg-muted p-4">
                <FileIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Vorschau nicht verfügbar</p>
              <p className="text-xs text-muted-foreground">Laden Sie die Datei herunter, um sie zu öffnen</p>
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Datei herunterladen
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

