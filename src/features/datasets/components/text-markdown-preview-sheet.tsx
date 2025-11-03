import { useState, useEffect, useRef } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { useDatasetStore } from '@/stores/dataset-store'
import { datasetsApi } from '@/lib/api/datasets-api'
import { useTheme } from '@/context/theme-provider'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkEmoji from 'remark-emoji'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

// Import CSS für Syntax-Highlighting und KaTeX
import 'highlight.js/styles/github-dark.css'
import 'katex/dist/katex.min.css'

// Zusätzliche Styles für bessere LaTeX-Darstellung
const katexStyles = `
  .katex {
    font-size: 1.1em;
  }
  .katex-display {
    margin: 1.5em 0;
    overflow-x: auto;
    overflow-y: hidden;
    text-align: center;
  }
  .katex-display > .katex {
    display: inline-block;
    text-align: initial;
  }
  .katex .base {
    display: inline-block;
  }
  /* Ensure matrices and large expressions render properly */
  .katex-display .katex {
    max-width: 100%;
    overflow-x: auto;
  }
  /* Better spacing for integrals and matrices */
  .katex .strut {
    display: inline-block;
  }
  .katex .vlist-t {
    display: inline-block;
  }
  /* Fix for multi-line expressions */
  .katex .mtable {
    margin: 0.5em 0;
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'text-markdown-preview-katex-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = katexStyles
    document.head.appendChild(style)
  }
}

interface TextMarkdownPreviewSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileId: string
  fileName: string
  datasetId: string
  fileType?: string
  fileExtension?: string
}

export function TextMarkdownPreviewSheet({
  open,
  onOpenChange,
  fileId,
  fileName,
  datasetId,
  fileType,
  fileExtension,
}: TextMarkdownPreviewSheetProps) {
  const [content, setContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  const { downloadDatasetFile } = useDatasetStore()
  const { resolvedTheme } = useTheme()

  // Determine if file is Markdown
  const isMarkdown = 
    fileType === 'text/markdown' ||
    fileExtension?.toLowerCase() === '.md' ||
    fileExtension?.toLowerCase() === '.markdown' ||
    fileName.toLowerCase().endsWith('.md') ||
    fileName.toLowerCase().endsWith('.markdown')

  // Determine language for syntax highlighting
  const getLanguageFromExtension = (ext?: string, name?: string): string => {
    const extension = ext?.toLowerCase() || name?.split('.').pop()?.toLowerCase() || ''
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
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
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash',
      'yaml': 'yaml',
      'yml': 'yaml',
      'json': 'json',
      'xml': 'xml',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'md': 'markdown',
      'markdown': 'markdown',
      'txt': 'text',
      'log': 'text',
    }
    
    return languageMap[extension] || 'text'
  }

  // Preprocess Markdown content for Upmath-specific features
  const preprocessMarkdown = (text: string): string => {
    let processed = text

    // Handle Upmath inline math: $$\inline ...$$ -> $...$ (convert to inline math)
    // remark-math uses $...$ for inline and $$...$$ for block math
    processed = processed.replace(/\$\$\\inline\s+([^$]+)\$\$/g, (_, content) => {
      // Convert to inline math format for remark-math (single $ for inline)
      return `$${content.trim()}$`
    })

    // IMPORTANT: Don't modify LaTeX code blocks - preserve them as-is
    // Only apply typographic replacements outside of LaTeX math blocks
    
    // Split by LaTeX math blocks to preserve them
    const parts: string[] = []
    let lastIndex = 0
    const mathRegex = /\$\$?[^$]+\$\$?/g
    let match: RegExpExecArray | null
    
    while ((match = mathRegex.exec(text)) !== null) {
      // Add text before math block
      const beforeMath = text.substring(lastIndex, match.index)
      parts.push(beforeMath)
      // Add math block as-is (no processing)
      parts.push(match[0])
      lastIndex = match.index + match[0].length
    }
    // Add remaining text
    parts.push(text.substring(lastIndex))

    // Apply typographic replacements only to non-math parts
    const processedParts = parts.map((part) => {
      // Skip math blocks - preserve LaTeX exactly as-is
      if (part.match(/^\$\$?[^$]+\$\$?$/)) {
        return part
      }
      
      // Apply typographic replacements to text parts
      let processedPart = part
      processedPart = processedPart.replace(/\(c\)/g, '©')
      processedPart = processedPart.replace(/\(r\)/g, '®')
      processedPart = processedPart.replace(/\(tm\)/g, '™')
      processedPart = processedPart.replace(/\+-/g, '±')
      processedPart = processedPart.replace(/---/g, '—')
      processedPart = processedPart.replace(/--/g, '–')
      // Handle HTML entities
      processedPart = processedPart.replace(/&ndash;/g, '–')
      processedPart = processedPart.replace(/&nbsp;/g, '\u00A0')
      processedPart = processedPart.replace(/&rarr;/g, '→')
      
      return processedPart
    })

    return processedParts.join('')
  }

  // Load file content
  const loadContent = async () => {
    setIsLoading(true)
    setError(null)
    setContent(null)

    try {
      const blob = await datasetsApi.getRawData(datasetId, fileId)
      
      // Check if it's a text-based file
      const ext = fileExtension?.toLowerCase() || fileName.split('.').pop()?.toLowerCase() || ''
      const isTextFile = 
        blob.type.startsWith('text/') ||
        ['txt', 'md', 'markdown', 'json', 'jsonl', 'xml', 'html', 'css', 'js', 'jsx', 'ts', 'tsx', 'csv', 'log', 'sh', 'bash', 'yaml', 'yml'].includes(ext)

      if (!isTextFile && blob.type !== 'application/json' && blob.type !== 'application/javascript' && blob.type !== 'application/typescript') {
        setError('Nur Text- und Markdown-Dateien können angezeigt werden')
        setIsLoading(false)
        return
      }

      // Read blob as text and preprocess
      const text = await blob.text()
      const processedText = isMarkdown ? preprocessMarkdown(text) : text
      setContent(processedText)
      setIsLoading(false)
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

  // Load content when sheet opens
  useEffect(() => {
    if (open && fileId && datasetId) {
      loadContent()
    } else {
      // Reset state when closed
      setContent(null)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fileId, datasetId])

  const handleDownload = async () => {
    try {
      await downloadDatasetFile(datasetId, fileId, fileName)
      toast.success('Datei erfolgreich heruntergeladen')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Herunterladen der Datei'
      toast.error(errorMessage)
    }
  }

  const language = getLanguageFromExtension(fileExtension, fileName)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:max-w-[900px] p-0 flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="flex flex-col gap-1 min-w-0">
              <SheetTitle className="text-base truncate">{fileName}</SheetTitle>
              <SheetDescription className="text-xs">
                {isMarkdown ? 'Markdown-Vorschau' : `${language.charAt(0).toUpperCase() + language.slice(1)}-Vorschau`}
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

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
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
              <Button size="sm" variant="outline" onClick={loadContent}>
                Erneut versuchen
              </Button>
            </div>
          )}

          {content && !error && (
            <div ref={scrollContainerRef} className="h-full overflow-auto">
              <div className="h-full p-4">
                {isMarkdown ? (
                  // Markdown rendering
                  <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800 dark:prose-a:text-blue-400 dark:hover:prose-a:text-blue-300 prose-strong:font-bold prose-em:italic prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-transparent prose-pre:p-0">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath, remarkEmoji]}
                      rehypePlugins={[
                        rehypeSlug,
                        rehypeRaw,
                        rehypeHighlight,
                        [
                          rehypeKatex,
                          {
                            throwOnError: false,
                            errorColor: '#cc0000',
                            fleqn: false,
                            output: 'htmlAndMathml',
                            strict: false,
                            trust: false,
                            macros: {
                              // Support common LaTeX macros
                              '\\RR': '\\mathbb{R}',
                              '\\NN': '\\mathbb{N}',
                              '\\ZZ': '\\mathbb{Z}',
                              '\\QQ': '\\mathbb{Q}',
                              '\\CC': '\\mathbb{C}',
                            },
                          },
                        ],
                      ]}
                      components={{
                        // Code blocks with syntax highlighting
                        // Important: Math expressions should NOT be processed here
                        code({ node, inline, className, children, ...props }: any) {
                          // Skip if this is a math expression (handled by rehypeKatex)
                          if (className?.includes('math') || className?.includes('math-inline')) {
                            return <code {...props}>{children}</code>
                          }
                          
                          const match = /language-(\w+)/.exec(className || '')
                          const codeString = String(children).replace(/\n$/, '')
                          const codeStyle = resolvedTheme === 'dark' ? oneDark : oneLight
                          
                          if (!inline && match) {
                            return (
                              <div className="my-4">
                                <SyntaxHighlighter
                                  style={codeStyle}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{
                                    borderRadius: '0.5rem',
                                    padding: '1rem',
                                  }}
                                  {...props}
                                >
                                  {codeString}
                                </SyntaxHighlighter>
                              </div>
                            )
                          }
                          
                          return (
                            <code 
                              className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono before:content-none after:content-none" 
                              {...props}
                            >
                              {children}
                            </code>
                          )
                        },
                        // Links with classic blue color and underline (like standard web links)
                        a({ node, href, children, ...props }: any) {
                          const isExternal = href?.startsWith('http://') || href?.startsWith('https://') || href?.startsWith('//')
                          const isAnchor = href?.startsWith('#')
                          
                          const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                            if (isAnchor && scrollContainerRef.current) {
                              e.preventDefault()
                              const id = href.substring(1) // Remove the #
                              // Try different ID formats that rehypeSlug might generate
                              const selectors = [`#${id}`, `[id="${id}"]`, `#${id.toLowerCase().replace(/\s+/g, '-')}`]
                              
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
                        // Images with proper styling
                        img({ node, src, alt, ...props }: any) {
                          return (
                            <img
                              src={src}
                              alt={alt}
                              className="rounded-lg my-4 max-w-full h-auto"
                              {...props}
                            />
                          )
                        },
                        // Lists with better spacing
                        ul({ node, children, ...props }: any) {
                          return (
                            <ul className="list-disc my-4 ml-6 space-y-2" {...props}>
                              {children}
                            </ul>
                          )
                        },
                        ol({ node, children, ...props }: any) {
                          return (
                            <ol className="list-decimal my-4 ml-6 space-y-2" {...props}>
                              {children}
                            </ol>
                          )
                        },
                        li({ node, children, ...props }: any) {
                          return (
                            <li className="my-1" {...props}>
                              {children}
                            </li>
                          )
                        },
                        // Headings with better spacing
                        h1({ node, children, ...props }: any) {
                          return (
                            <h1 className="text-3xl font-bold mt-8 mb-4 pb-2 border-b" {...props}>
                              {children}
                            </h1>
                          )
                        },
                        h2({ node, children, ...props }: any) {
                          return (
                            <h2 className="text-2xl font-semibold mt-6 mb-3 pb-2 border-b" {...props}>
                              {children}
                            </h2>
                          )
                        },
                        h3({ node, children, ...props }: any) {
                          return (
                            <h3 className="text-xl font-semibold mt-4 mb-2" {...props}>
                              {children}
                            </h3>
                          )
                        },
                        // Blockquotes
                        blockquote({ node, children, ...props }: any) {
                          return (
                            <blockquote 
                              className="border-l-4 border-primary/30 pl-4 my-4 italic text-muted-foreground" 
                              {...props}
                            >
                              {children}
                            </blockquote>
                          )
                        },
                        // Tables (from GFM)
                        table({ node, children, ...props }: any) {
                          return (
                            <div className="overflow-x-auto my-4">
                              <table className="min-w-full border-collapse border border-border" {...props}>
                                {children}
                              </table>
                            </div>
                          )
                        },
                        th({ node, children, ...props }: any) {
                          return (
                            <th className="border border-border px-4 py-2 bg-muted font-semibold text-left" {...props}>
                              {children}
                            </th>
                          )
                        },
                        td({ node, children, ...props }: any) {
                          return (
                            <td className="border border-border px-4 py-2" {...props}>
                              {children}
                            </td>
                          )
                        },
                        // Horizontal rule
                        hr({ node, ...props }: any) {
                          return (
                            <hr className="my-8 border-t border-border" {...props} />
                          )
                        },
                        // Paragraph for better spacing and Upmath subscripts/superscripts
                        p({ node, children, ...props }: any) {
                          // Handle Upmath subscripts/superscripts in text
                          // Convert ~0~ to subscript and ^2^ to superscript
                          const processChildren = (child: any): any => {
                            if (typeof child === 'string') {
                              // Replace subscripts ~0~ and superscripts ^2^ (but not in code)
                              let processed = child
                              processed = processed.replace(/\~(\d+)\~/g, '<sub>$1</sub>')
                              processed = processed.replace(/\^(\d+)\^/g, '<sup>$1</sup>')
                              // If replacements were made, return as HTML
                              if (processed !== child) {
                                return <span dangerouslySetInnerHTML={{ __html: processed }} />
                              }
                              return child
                            }
                            if (Array.isArray(child)) {
                              return child.map(processChildren)
                            }
                            return child
                          }
                          
                          const processedChildren = Array.isArray(children) 
                            ? children.map(processChildren) 
                            : processChildren(children)
                          
                          return (
                            <p className="my-4 leading-7" {...props}>
                              {processedChildren}
                            </p>
                          )
                        },
                        // Pre blocks - handle carefully to not break LaTeX
                        pre({ node, children, ...props }: any) {
                          // Check if this contains math (should be rendered by KaTeX)
                          const hasMath = node?.children?.some((child: any) => 
                            child.type === 'element' && 
                            (child.tagName === 'code' && child.properties?.className?.includes('math'))
                          )
                          
                          if (hasMath) {
                            return <pre {...props}>{children}</pre>
                          }
                          
                          return (
                            <pre className="bg-muted rounded-lg p-4 overflow-x-auto my-4" {...props}>
                              {children}
                            </pre>
                          )
                        },
                        // Handle failed LaTeX rendering (e.g., TikZ) - show as code block
                        div({ node, children, className, ...props }: any) {
                          // If KaTeX fails, it might leave raw LaTeX in a div
                          // Check if content looks like TikZ/PGFPlots
                          const content = typeof children === 'string' ? children : ''
                          if (content.includes('\\begin{tikzpicture}') || content.includes('\\begin{axis}')) {
                            return (
                              <div className="my-4">
                                <div className="text-xs text-muted-foreground mb-2 italic">
                                  Hinweis: TikZ/PGFPlots werden im Browser nicht gerendert. LaTeX-Quellcode:
                                </div>
                                <SyntaxHighlighter
                                  language="latex"
                                  style={resolvedTheme === 'dark' ? oneDark : oneLight}
                                  customStyle={{
                                    borderRadius: '0.5rem',
                                    padding: '1rem',
                                  }}
                                >
                                  {content}
                                </SyntaxHighlighter>
                              </div>
                            )
                          }
                          return <div className={className} {...props}>{children}</div>
                        },
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  // Plain text or code with syntax highlighting
                  <div className="h-full">
                    <SyntaxHighlighter
                      language={language}
                      style={resolvedTheme === 'dark' ? oneDark : oneLight}
                      customStyle={{
                        margin: 0,
                        borderRadius: '0.5rem',
                        height: '100%',
                      }}
                      showLineNumbers
                      wrapLines
                    >
                      {content}
                    </SyntaxHighlighter>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

