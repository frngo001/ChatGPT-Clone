"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkEmoji from "remark-emoji"
import rehypeHighlight from "rehype-highlight"
import rehypeRaw from "rehype-raw"
import rehypeSlug from "rehype-slug"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
  content: string
  config?: {
    codeTheme?: "light" | "dark" | "github" | "monokai"
    mathTheme?: "default" | "colorful"
    linkTarget?: string
    showLineNumbers?: boolean
  }
  onLinkClick?: (url: string, event: React.MouseEvent) => void
  onDownloadClick?: (url: string, filename: string) => void
  enableMermaid?: boolean
  enableMath?: boolean
  enableEmoji?: boolean
  maxWidth?: string
  className?: string
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  config = {},
  onLinkClick,
  onDownloadClick,
  enableMath = true,
  enableEmoji = true,
  maxWidth = "100%",
  className,
}) => {
  const {

    linkTarget = "_blank",
    showLineNumbers = false,
  } = config

  const handleLinkClick = (url: string, event: React.MouseEvent) => {
    if (onLinkClick) {
      onLinkClick(url, event)
    } else {
      console.log("Link clicked:", url)
    }
  }

  const handleDownloadClick = (url: string, filename: string) => {
    if (onDownloadClick) {
      onDownloadClick(url, filename)
    } else {
      console.log("Download clicked:", url, filename)
    }
  }

  const isExternalLink = (url: string) => {
    return url.startsWith("http://") || url.startsWith("https://")
  }

  const isDownloadLink = (url: string) => {
    return url.includes("download") || url.endsWith(".pdf") || url.endsWith(".zip")
  }

  return (
    <div
      className={cn("markdown", className)}
      style={{ maxWidth }}
    >
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          ...(enableMath ? [remarkMath] : []),
          ...(enableEmoji ? [remarkEmoji] : []),
        ]}
        rehypePlugins={[
          rehypeRaw,
          rehypeSlug,
          rehypeHighlight,
        ]}
        components={{
          // Code blocks with syntax highlighting
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "")
            const language = match ? match[1] : ""
            
            if (!inline && language) {
              return (
                <div className="relative">
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language}
                    showLineNumbers={showLineNumbers}
                    customStyle={{
                      margin: 0,
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                  <button
                    className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      navigator.clipboard.writeText(String(children))
                    }}
                  >
                    Copy
                  </button>
                </div>
              )
            }
            
            return (
              <code
                className="bg-muted px-1 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            )
          },
          
          // Links with smart behavior
          a({ href, children, ...props }) {
            if (!href) return <a {...props}>{children}</a>
            
            const isExternal = isExternalLink(href)
            const isDownload = isDownloadLink(href)
            
            return (
              <a
                href={href}
                target={isExternal ? linkTarget : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                onClick={(e) => {
                  if (isDownload) {
                    e.preventDefault()
                    const filename = href.split("/").pop() || "download"
                    handleDownloadClick(href, filename)
                  } else {
                    handleLinkClick(href, e)
                  }
                }}
                className="text-blue-500 hover:text-blue-700 underline underline-offset-4"
                {...props}
              >
                {children}
              </a>
            )
          },
          
          // Lists with proper styling
          ul({ children, ...props }) {
            return (
              <ul className="list-disc ml-6 space-y-1" {...props}>
                {children}
              </ul>
            )
          },
          
          ol({ children, ...props }) {
            return (
              <ol className="list-decimal ml-6 space-y-1" {...props}>
                {children}
              </ol>
            )
          },
          
          li({ children, ...props }) {
            return (
              <li className="leading-relaxed" {...props}>
                {children}
              </li>
            )
          },
          
          // Headings
          h1({ children, ...props }) {
            return (
              <h1 className="text-xl font-bold mb-2" {...props}>
                {children}
              </h1>
            )
          },
          
          h2({ children, ...props }) {
            return (
              <h2 className="text-lg font-semibold mb-2" {...props}>
                {children}
              </h2>
            )
          },
          
          h3({ children, ...props }) {
            return (
              <h3 className="text-base font-semibold mb-1" {...props}>
                {children}
              </h3>
            )
          },
          
          // Paragraphs
          p({ children, ...props }) {
            return (
              <p className="mb-2" {...props}>
                {children}
              </p>
            )
          },
          
          // Blockquotes
          blockquote({ children, ...props }) {
            return (
              <blockquote
                className="border-l-4 border-border pl-4 italic"
                {...props}
              >
                {children}
              </blockquote>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
