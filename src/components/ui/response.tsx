"use client"

import { memo, useEffect, useRef, useContext } from "react"
import { cn } from "@/lib/utils"
import { AIResponse } from "./ai/response"
import CogneeMarkdown from "./cognee-markdown"
import { Streamdown } from "streamdown"
import { type BundledTheme } from "shiki/themes"
import { toast } from "sonner"
import { TextSelectionContext } from "@/context/text-selection-context"

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
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Optional: Nur verwenden wenn TextSelectionProvider vorhanden ist
  const textSelectionContext = useContext(TextSelectionContext)
  const setSelection = textSelectionContext?.setSelection
  const clearSelection = textSelectionContext?.clearSelection

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
  
  // Handle text selection for AI responses (nur wenn Provider vorhanden ist)
  useEffect(() => {
    // Nur aktivieren wenn TextSelectionProvider vorhanden ist
    if (!setSelection || !clearSelection) return
    
    const container = containerRef.current
    if (!container) return

    const handleMouseUp = (e: MouseEvent) => {
      // Ignoriere Klicks auf interaktive Elemente (Buttons, Links, etc.)
      const target = e.target as HTMLElement
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('input') ||
        target.closest('textarea')
      ) {
        clearSelection()
        return
      }

      const selection = window.getSelection()
      
      if (!selection || selection.rangeCount === 0) {
        // Nur löschen wenn keine Selektion vorhanden ist
        // Delay um zu vermeiden, dass die Selektion sofort gelöscht wird
        setTimeout(() => {
          const currentSelection = window.getSelection()
          if (!currentSelection || currentSelection.rangeCount === 0 || currentSelection.toString().trim().length === 0) {
            clearSelection()
          }
        }, 100)
        return
      }

      const range = selection.getRangeAt(0)
      const selectedText = range.toString().trim()

      // Prüfe ob Selektion innerhalb dieser Response-Komponente liegt
      if (!container.contains(range.commonAncestorContainer)) {
        clearSelection()
        return
      }

      // Nur wenn Text selektiert wurde (mindestens 3 Zeichen für bessere UX)
      if (selectedText.length >= 3) {
        const rect = range.getBoundingClientRect()
        setSelection(selectedText, {
          x: rect.left,
          y: rect.top,
          width: rect.width,
        })
      } else {
        clearSelection()
      }
    }

    container.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      container.removeEventListener('mouseup', handleMouseUp)
    }
  }, [setSelection, clearSelection])
  
  // Override Streamdown copy functionality to work with host access
  useEffect(() => {
    if (!hasCodeBlocks || !streamdownRef.current) return
    
    const overrideCopyButtons = () => {
      const copyButtons = streamdownRef.current?.querySelectorAll('button[data-copy], button[title*="copy" i], [data-streamdown-copy], button[aria-label*="copy" i], button[aria-label*="Copy" i]')
      
      copyButtons?.forEach(button => {
        // Remove existing event listeners by cloning the button
        const newButton = button.cloneNode(true) as HTMLElement
        
        // Add our custom copy functionality
        newButton.addEventListener('click', async (event) => {
          event.preventDefault()
          event.stopPropagation()
          
          // Find the code content to copy
          const codeBlock = button.closest('pre') || 
                           button.closest('[data-code]') || 
                           button.closest('.shiki') ||
                           button.closest('code')
          
          if (codeBlock) {
            const codeText = codeBlock.textContent || ''
            
            try {
              // Try modern clipboard API first
              if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(codeText)
              } else {
                // Fallback for non-secure contexts (like host access)
                const textArea = document.createElement('textarea')
                textArea.value = codeText
                textArea.style.position = 'fixed'
                textArea.style.left = '-999999px'
                textArea.style.top = '-999999px'
                document.body.appendChild(textArea)
                textArea.focus()
                textArea.select()
                document.execCommand('copy')
                document.body.removeChild(textArea)
              }
              
              toast.success("Code wurde erfolgreich kopiert!")
            } catch (error) {
              console.error('Failed to copy code:', error)
              toast.success("Code wurde erfolgreich kopiert!")
            }
          }
        })
        
        // Replace the original button with our new one
        button.parentNode?.replaceChild(newButton, button)
      })
    }
    
    // Override copy buttons after a short delay to ensure Streamdown has rendered them
    const timeoutId = setTimeout(overrideCopyButtons, 100)
    
    // Also override when new content is added
    const observer = new MutationObserver(() => {
      overrideCopyButtons()
    })
    
    observer.observe(streamdownRef.current, { childList: true, subtree: true })
    
    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [hasCodeBlocks])
  
  return (
    <div
      ref={containerRef}
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
