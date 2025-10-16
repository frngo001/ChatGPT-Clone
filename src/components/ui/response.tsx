"use client"

import { memo, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import MarkdownRenderer from "./markdown"
import CogneeMarkdown from "./cognee-markdown"
import { Streamdown } from "streamdown"
import { type BundledTheme } from "shiki/themes"
import { toast } from "sonner"

interface ResponseProps {
  children: React.ReactNode
  className?: string
  isCogneeMode?: boolean
  onQuestionSelect?: (question: string) => void
  originalChunks?: string
  useAIElements?: boolean // New prop to enable AI Elements
  [key: string]: any
}

const Response = memo(({ children, className, isCogneeMode = false, onQuestionSelect, originalChunks, useAIElements = false, ...props }: ResponseProps) => {
  const content = String(children)
  const streamdownRef = useRef<HTMLDivElement>(null)
  
  // Check if content contains code blocks (```)
  const hasCodeBlocks = content.includes('```')
  
  // Check if content has Cognee-style citations and suggestions
  const hasInlineCitations = content.includes('[CITATION:')
  const hasCitationsSection = content.includes('### Citations')
  const hasSuggestions = content.includes('### Suggested Questions')
  
  // Cognee content detection - if in Cognee mode and has any citation markers, treat as Cognee content
  const isCogneeContent = isCogneeMode && (hasInlineCitations || hasCitationsSection || hasSuggestions)
  
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
    >
      {isCogneeContent ? (
        // Use CogneeMarkdown for content with citations and suggestions
        <CogneeMarkdown
          content={content}
          onQuestionSelect={onQuestionSelect}
          originalChunks={originalChunks}
          useAIElements={useAIElements}
        />
      ) : hasCodeBlocks ? (
        // Use Streamdown for better code block formatting with theme support
        <div ref={streamdownRef}>
          <Streamdown 
            shikiTheme={shikiThemes}
            controls={{ code: true }}
          >
            {content}
          </Streamdown>
        </div>
      ) : (
        // Use new MarkdownRenderer for better list formatting
        <MarkdownRenderer
          content={content}
          enableMath={true}
          enableEmoji={true}
          enableMermaid={true}
        />
      )}
    </div>
  )
})

Response.displayName = "Response"

export { Response }
