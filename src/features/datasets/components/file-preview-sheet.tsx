import React, { useState, useEffect, lazy, Suspense, useRef } from 'react'
import { Download, Loader2, FileText, FileCode, File as FileIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { useDatasetStore } from '@/stores/dataset-store'
import { datasetsApi } from '@/lib/api/datasets-api'
import { getFileInfo } from '@/lib/utils/file-utils'
import { useTheme } from '@/context/theme-provider'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { cn } from '@/lib/utils'

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
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
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
        <div 
          ref={scrollContainerRef} 
          className={cn(
            "flex-1 overflow-auto relative",
            "[&::-webkit-scrollbar]:w-2",
            "[&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30",
            "[&::-webkit-scrollbar-thumb]:rounded-full",
            "[&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/50",
            "dark:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40",
            "dark:[&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/60"
          )}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
          }}
        >
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
                // Markdown rendering with blue links and anchor navigation
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSlug]}
                    components={{
                      a({ href, children, ...props }) {
                        if (!href) return <a {...props}>{children}</a>
                        
                        const isExternal = href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')
                        const isAnchor = href.startsWith('#')
                        
                        const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                          if (isAnchor && scrollContainerRef.current) {
                            e.preventDefault()
                            const id = href.substring(1) // Remove the #
                            // Try different ID formats that rehypeSlug might generate
                            const selectors = [
                              `#${id}`,
                              `[id="${id}"]`,
                              `#${id.toLowerCase().replace(/\s+/g, '-')}`,
                              `#${id.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`
                            ]
                            
                            for (const selector of selectors) {
                              const element = scrollContainerRef.current.querySelector(selector)
                              if (element) {
                                // Add some offset for header
                                const yOffset = -20
                                const y = element.getBoundingClientRect().top + scrollContainerRef.current.scrollTop + yOffset
                                scrollContainerRef.current.scrollTo({ top: y, behavior: 'smooth' })
                                return
                              }
                            }
                          }
                        }
                        
                        return (
                          <a
                            href={href}
                            target={isExternal ? '_blank' : undefined}
                            rel={isExternal ? 'noopener noreferrer' : undefined}
                            onClick={handleClick}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                            {...props}
                          >
                            {children}
                          </a>
                        )
                      },
                      h1({ children, ...props }) {
                        return <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-3xl mt-5" {...props}>{children}</h1>
                      },
                      h2({ children, ...props }) {
                        return <h2 className="scroll-m-20 border-b pb-2 text-lg font-semibold tracking-tight mt-3" {...props}>{children}</h2>
                      },
                      h3({ children, ...props }) {
                        return <h3 className="scroll-m-20 text-base font-semibold tracking-tight mt-3" {...props}>{children}</h3>
                      },
                      h4({ children, ...props }) {
                        return <h4 className="scroll-m-20 text-sm font-semibold tracking-tight mt-3" {...props}>{children}</h4>
                      },
                      h5({ children, ...props }) {
                        return <h5 className="scroll-m-20 text-xs font-semibold tracking-tight mt-2" {...props}>{children}</h5>
                      },
                      h6({ children, ...props }) {
                        return <h6 className="scroll-m-20 text-xs font-semibold tracking-tight mt-2" {...props}>{children}</h6>
                      },
                      p({ children, ...props }) {
                        return <p className="leading-7 [&:not(:first-child)]:mt-6 text-sm" {...props}>{children}</p>
                      },
                      ul({ children, ...props }) {
                        return <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>{children}</ul>
                      },
                      ol({ children, ...props }) {
                        return <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>{children}</ol>
                      },
                      li({ children, ...props }) {
                        return <li className="marker:text-muted-foreground" {...props}>{children}</li>
                      },
                      blockquote({ children, ...props }) {
                        return <blockquote className="mt-6 border-l-4 pl-6" {...props}>{children}</blockquote>
                      },
                      strong({ children, ...props }) {
                        return <strong className="font-semibold" {...props}>{children}</strong>
                      },
                      em({ children, ...props }) {
                        return <em className="italic" {...props}>{children}</em>
                      },
                      code({ children, className, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        if (match) {
                          return (
                            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          )
                        }
                        return (
                          <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                            {children}
                          </code>
                        )
                      },
                      pre({ children, ...props }) {
                        return <pre className="bg-muted p-4 rounded text-sm font-mono overflow-x-auto my-4" {...props}>{children}</pre>
                      },
                    }}
                  >
                    {fileContent}
                  </ReactMarkdown>
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

