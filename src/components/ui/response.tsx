"use client"

import { memo, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { AIResponse } from "./ai/response"
import CogneeMarkdown from "./cognee-markdown"
import { Streamdown } from "streamdown"
import { type BundledTheme } from "shiki/themes"
import { toast } from "sonner"

interface ResponseProps {
  children: React.ReactNode
  className?: string
  isCogneeMode?: boolean
  originalChunks?: string
  sources?: string[] // New prop for sources
  [key: string]: any
}

/**
 * Parse sources from the Sources section
 * Format: ### Sources followed by a list of filenames
 */
const parseSources = (content: string): string[] => {
  const sourcesMatch = content.match(/### Sources\s*\n([\s\S]*?)(?=\n### |$)/i)
  if (!sourcesMatch) return []

  return sourcesMatch[1]
    .split('\n')
    .map(line => line.replace(/^[-*]\s+/, '').trim())
    .filter(line => line.length > 0)
}

/**
 * Remove Sources section from content for display
 * This ensures sources are parsed but not shown to the user
 */
const removeSourcesFromContent = (content: string): string => {
  return content
    .replace(/### Sources\s*\n[\s\S]*?(?=\n### |$)/i, '')
    .trim()
}

const Response = memo(({ children, className, isCogneeMode = false, originalChunks, sources, ...props }: ResponseProps) => {
  const content = String(children)
  const streamdownRef = useRef<HTMLDivElement>(null)

  // Check if content contains code blocks (```)
  const hasCodeBlocks = content.includes('```')

  // Check if content has Cognee-style sources
  const hasSourcesSection = content.includes('### Sources')

  // Cognee content detection - if in Cognee mode and has sources section, treat as Cognee content
  const isCogneeContent = isCogneeMode && hasSourcesSection

  // Extract sources from content if not provided as prop
  const extractedSources = sources || (isCogneeContent ? parseSources(content) : [])

  // Define shiki themes for Streamdown (light and dark)
  const shikiThemes: [BundledTheme, BundledTheme] = ['catppuccin-latte', 'github-dark']
  
  // Add event listener for copy events on Streamdown code blocks
  useEffect(() => {
    if (!hasCodeBlocks || !streamdownRef.current) return
    
    const handleCopy = (event: Event) => {
      const target = event.target as HTMLElement
      // Check if the copy event came from a Streamdown copy button
      if (target.closest('button[data-copy]') || target.closest('button[title*="copy" i]') || target.closest('[data-streamdown-copy]')) {
        toast.success("Code wurde erfolgreich kopiert!")
      }
    }
    
    const streamdownElement = streamdownRef.current
    streamdownElement.addEventListener('click', handleCopy)
    
    return () => {
      streamdownElement.removeEventListener('click', handleCopy)
    }
  }, [hasCodeBlocks])
  
  return (
    <div
      className={cn(
        // Remove top margin from first child and bottom margin from last child
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      {...props}
      data-sources={extractedSources.length > 0 ? JSON.stringify(extractedSources) : undefined}
    >
      {isCogneeContent ? (
        // Use CogneeMarkdown for content with sources
        <CogneeMarkdown
          content={content}
          originalChunks={originalChunks}
        />
      ) : hasCodeBlocks ? (
        // Use Streamdown for better code block formatting with theme support
        <div ref={streamdownRef}>
          <Streamdown
            shikiTheme={shikiThemes}
            controls={{ code: true }}
          >
            {removeSourcesFromContent(content)}
          </Streamdown>
        </div>
      ) : (
        // Use AIResponse for all text content (consistent shadcn.io styling)
        // Remove sources section before rendering to user
        <AIResponse>
          {removeSourcesFromContent(content)}
        </AIResponse>
      )}
    </div>
  )
})

Response.displayName = "Response"

export { Response }
