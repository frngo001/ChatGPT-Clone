"use client"

import React, { useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkEmoji from "remark-emoji"
import rehypeHighlight from "rehype-highlight"
import rehypeRaw from "rehype-raw"
import rehypeSlug from "rehype-slug"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Suggestion,
  Suggestions,
  SuggestionItem,
} from "@/components/ai-elements/suggestion"

interface Citation {
  number: string
  documentType: string
  documentName: string
  section: string
  topic: string
  content: string
  url?: string
}

// Function to translate document types to German
const translateDocumentType = (documentType: string): string => {
  const translations: Record<string, string> = {
    'MANUAL': 'HANDBUCH',
    'PDF': 'PDF',
    'DOC': 'DOKUMENT',
    'WEB': 'WEB',
    'DATABASE': 'DATENBANK',
    'REPORT': 'BERICHT',
    'GUIDE': 'ANLEITUNG',
    'OTHER': 'ANDERE'
  }
  return translations[documentType.toUpperCase()] || documentType
}

interface AIMarkdownProps {
  content: string
  onQuestionSelect?: (question: string) => void
  className?: string
  originalChunks?: string
}

/**
 * Parse citations from the Citations section with improved regex for various formats
 * Format: [NUMBER] DOCUMENT_TYPE: DOCUMENT_NAME | SECTION: SECTION_IDENTIFIER | TOPIC: MAIN_CONTENT_AREA | CONTENT: SPECIFIC_INFORMATION_SUMMARY
 */
const parseCitations = (content: string): Map<string, Citation> => {
  const citations = new Map<string, Citation>()
  
  // Find Citations section with more flexible matching
  const citationsMatch = content.match(/### Citations\s*\n([\s\S]*?)(?=\n### Suggested Questions|\n### |$)/i)
  if (!citationsMatch) return citations
  
  const citationsText = citationsMatch[1]
  
  // More robust regex to handle various formatting variations
  const citationRegex = /\[(\d+)\]\s*([A-Z]+):\s*([^|]+?)\s*\|\s*SECTION:\s*([^|]+?)\s*\|\s*TOPIC:\s*([^|]+?)\s*\|\s*CONTENT:\s*(.+?)(?=\n\s*\[|\n\s*$|$)/gs
  
  let match
  while ((match = citationRegex.exec(citationsText)) !== null) {
    const [, number, documentType, documentName, section, topic, content] = match
    
    // Clean up extracted content
    const cleanContent = content.trim().replace(/\n\s*/g, ' ')
    
    citations.set(number, {
      number,
      documentType: documentType.trim(),
      documentName: documentName.trim(),
      section: section.trim(),
      topic: topic.trim(),
      content: cleanContent,
      url: `#ref-${number}`,
    })
  }
  
  // Fallback: try to parse citations without strict format if no matches found
  if (citations.size === 0) {
    const fallbackRegex = /\[(\d+)\]\s*(.+?)(?=\n\s*\[|\n\s*$|$)/gs
    let fallbackMatch
    while ((fallbackMatch = fallbackRegex.exec(citationsText)) !== null) {
      const [, number, rawContent] = fallbackMatch
      const content = rawContent.trim()
      
      citations.set(number, {
        number,
        documentType: 'DOCUMENT',
        documentName: 'Unknown Document',
        section: 'Unknown Section',
        topic: 'General',
        content: content,
        url: `#ref-${number}`,
      })
    }
  }
  
  return citations
}

/**
 * Parse suggested questions from the Suggested Questions section with improved regex
 */
const parseSuggestedQuestions = (content: string): string[] => {
  const questions: string[] = []
  
  // Find Suggested Questions section with more flexible matching
  const questionsMatch = content.match(/### Suggested Questions\s*\n([\s\S]*?)(?=\n### |$)/i)
  if (!questionsMatch) return questions
  
  const questionsText = questionsMatch[1]
  
  // Parse each question with various formats: * Question text?, - Question text?, 1. Question text?
  const questionRegex = /^[\*\-\+]\s+(.+?)(?:\?|$)/gm
  
  let match
  while ((match = questionRegex.exec(questionsText)) !== null) {
    const question = match[1].trim()
    if (question.length > 0) {
      questions.push(question)
    }
  }
  
  // Fallback: try numbered questions
  if (questions.length === 0) {
    const numberedRegex = /^\d+\.\s+(.+?)(?:\?|$)/gm
    let numberedMatch
    while ((numberedMatch = numberedRegex.exec(questionsText)) !== null) {
      const question = numberedMatch[1].trim()
      if (question.length > 0) {
        questions.push(question)
      }
    }
  }
  
  return questions
}

/**
 * Remove Citations and Suggested Questions sections from main content
 */
const extractMainContent = (content: string): string => {
  return content
    .replace(/### Citations\n[\s\S]*?(?=\n### Suggested Questions|$)/i, '')
    .replace(/### Suggested Questions\n[\s\S]*$/i, '')
    .trim()
}

/**
 * Check if content has citations to render
 */
const hasCitationsInContent = (content: string): boolean => {
  return /\[CITATION:\d+\]/.test(content)
}

/**
 * Enhanced Citation Badge Component with improved inline code support
 */
const CitationBadge: React.FC<{
  citationNumber: string
  citation: Citation
}> = ({ citationNumber, citation }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="secondary" 
          className="ml-1 cursor-pointer hover:bg-secondary/80 transition-colors"
        >
          {citationNumber}
        </Badge>
      </TooltipTrigger>
      <TooltipContent 
        className="max-w-sm p-3 border"
        style={{ 
          backgroundColor: 'hsl(0, 0%, 96.1%)',
          color: 'hsl(0, 0%, 0%)',
          borderColor: 'hsl(0, 0%, 90%)'
        }}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{ 
                backgroundColor: 'hsl(0, 0%, 90%)',
                color: 'hsl(0, 0%, 0%)',
                borderColor: 'hsl(0, 0%, 80%)'
              }}
            >
              {translateDocumentType(citation.documentType)}
            </Badge>
            <span 
              className="text-sm font-medium"
              style={{ color: 'hsl(0, 0%, 0%)' }}
            >
              Zitat {citationNumber}
            </span>
          </div>
          
          <div className="space-y-1">
            <div 
              className="text-sm font-medium"
              style={{ color: 'hsl(0, 0%, 0%)' }}
            >
              {citation.documentName}
            </div>
            <div 
              className="text-xs"
              style={{ color: 'hsl(0, 0%, 40%)' }}
            >
              <strong>Abschnitt:</strong> {citation.section}
            </div>
            <div 
              className="text-xs"
              style={{ color: 'hsl(0, 0%, 40%)' }}
            >
              <strong>Thema:</strong> {citation.topic}
            </div>
          </div>
          
          <div 
            className="border-l-2 pl-2 text-xs italic"
            style={{ 
              borderLeftColor: 'hsl(0, 0%, 80%)',
              color: 'hsl(0, 0%, 20%)'
            }}
          >
            {citation.content}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Enhanced content rendering with improved inline code support
 */
const renderContentWithCitations = (
  content: string,
  citations: Map<string, Citation>
): React.ReactNode => {
  // Split content by citation markers [CITATION:N] and render inline
  const parts: React.ReactNode[] = []
  const citationRegex = /\[CITATION:(\d+)\]/g
  let lastIndex = 0
  let match
  let key = 0
  
  while ((match = citationRegex.exec(content)) !== null) {
    const citationNumber = match[1]
    const citation = citations.get(citationNumber)
    
    // Add text before citation with enhanced inline code support
    if (match.index > lastIndex) {
      const textBeforeCitation = content.substring(lastIndex, match.index)
      if (textBeforeCitation.trim()) {
        parts.push(
          <ReactMarkdown 
            key={`text-${key++}`}
            remarkPlugins={[remarkGfm, remarkMath, remarkEmoji]}
            rehypePlugins={[rehypeRaw, rehypeSlug, rehypeHighlight]}
            components={{
              p: ({ children, ...props }) => (
                <span className="inline" {...props}>{children}</span>
              ),
              code: ({ children, ...props }) => (
                <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              ),
              a: ({ href, children, ...props }) => (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 underline underline-offset-4"
                  {...props}
                >
                  {children}
                </a>
              ),
            }}
          >
            {textBeforeCitation}
          </ReactMarkdown>
        )
      }
    }
    
    // Add citation badge inline
    if (citation) {
      parts.push(
        <CitationBadge 
          key={`citation-${key++}`}
          citationNumber={citationNumber}
          citation={citation}
        />
      )
    } else {
      // If citation not found, show a simple badge
      parts.push(
        <Badge 
          key={`citation-${key++}`} 
          variant="outline" 
          className="ml-1 text-xs"
        >
          [{citationNumber}]
        </Badge>
      )
    }
    
    lastIndex = match.index + match[0].length
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex)
    if (remainingText.trim()) {
      parts.push(
        <ReactMarkdown 
          key={`text-${key++}`}
          remarkPlugins={[remarkGfm, remarkMath, remarkEmoji]}
          rehypePlugins={[rehypeRaw, rehypeSlug, rehypeHighlight]}
          components={{
            p: ({ children, ...props }) => (
              <span className="inline" {...props}>{children}</span>
            ),
            code: ({ children, ...props }) => (
              <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            ),
            a: ({ href, children, ...props }) => (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 underline underline-offset-4"
                {...props}
              >
                {children}
              </a>
            ),
          }}
        >
          {remainingText}
        </ReactMarkdown>
      )
    }
  }
  
  return (
    <div className="prose prose-sm max-w-none">
      {parts}
    </div>
  )
}

/**
 * Enhanced code block rendering with improved syntax highlighting
 */
const renderCodeBlock = (content: string, language?: string): React.ReactNode => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath, remarkEmoji]}
      rehypePlugins={[rehypeRaw, rehypeSlug, rehypeHighlight]}
      components={{
        code: ({ node, inline, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || "")
          const language = match ? match[1] : ""
          
          if (!inline && language) {
            return (
              <div className="relative">
                <pre className="bg-muted p-3 rounded overflow-x-auto">
                  <code className={`language-${language}`} {...props}>
                    {String(children).replace(/\n$/, "")}
                  </code>
                </pre>
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
      }}
    >
      {`\`\`\`${language || 'text'}\n${content}\n\`\`\``}
    </ReactMarkdown>
  )
}

const AIMarkdown: React.FC<AIMarkdownProps> = ({
  content,
  onQuestionSelect,
  className,
}) => {
  const { mainContent, citations, suggestedQuestions, hasInlineCitations } = useMemo(() => {
    const citations = parseCitations(content)
    const suggestedQuestions = parseSuggestedQuestions(content)
    const mainContent = extractMainContent(content)
    const hasInlineCitations = hasCitationsInContent(mainContent)
    
    return { mainContent, citations, suggestedQuestions, hasInlineCitations }
  }, [content])
  
  // Check if content has citations
  const hasCitations = citations.size > 0
  
  return (
    <TooltipProvider>
      <div className={className}>
        {/* Main content with inline citations using enhanced rendering */}
        {hasCitations && hasInlineCitations ? (
          <div className="prose prose-sm max-w-none">
            {renderContentWithCitations(mainContent, citations)}
          </div>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath, remarkEmoji]}
            rehypePlugins={[rehypeRaw, rehypeSlug, rehypeHighlight]}
            components={{
              code: ({ children, ...props }) => (
                <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              ),
              a: ({ href, children, ...props }) => (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 underline underline-offset-4"
                  {...props}
                >
                  {children}
                </a>
              ),
            }}
          >
            {mainContent}
          </ReactMarkdown>
        )}
        
        {/* Suggested Questions */}
        {suggestedQuestions.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Vorgeschlagene Fragen</h3>
            <Suggestions>
              {suggestedQuestions.map((question, index) => (
                <SuggestionItem
                  key={index}
                  suggestion={question}
                  onClick={(suggestion) => onQuestionSelect?.(suggestion)}
                />
              ))}
            </Suggestions>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

export default AIMarkdown
