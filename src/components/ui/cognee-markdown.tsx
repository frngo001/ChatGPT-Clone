"use client"

import React, { useMemo } from "react"
import { AIResponse } from "./ai/response"

interface CogneeMarkdownProps {
  content: string
  className?: string
  originalChunks?: string
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
 * Remove Sources section from main content
 */
const extractMainContent = (content: string): string => {
  return content
    .replace(/### Sources\n[\s\S]*$/i, '')
    .trim()
}

const CogneeMarkdown: React.FC<CogneeMarkdownProps> = ({
  content,
  className,
}) => {
  const { mainContent } = useMemo(() => {
    parseSources(content)
    const mainContent = extractMainContent(content)

    return { mainContent }
  }, [content])

  return (
    <div className={className}>
      {/* Main content without citations or suggestions */}
      <AIResponse>
        {mainContent}
      </AIResponse>
    </div>
  )
}

export default CogneeMarkdown