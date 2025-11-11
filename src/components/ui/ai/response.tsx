"use client"

import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"
import { memo, useMemo } from "react"
import ReactMarkdown, { type Options } from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { ExternalLink } from "lucide-react"
import "katex/dist/katex.min.css"
import remarkEmoji from "remark-emoji"
import remarkBreaks from "remark-breaks"
import remarkSmartypants from "remark-smartypants"
import remarkToc from "remark-toc"
import remarkFrontmatter from "remark-frontmatter"
import rehypeRaw from "rehype-raw"
import rehypeHighlight from "rehype-highlight"

/**
 * Simplified and optimized markdown parser that handles incomplete tokens during streaming.
 * Uses efficient regex operations and avoids expensive string operations.
 */
function parseIncompleteMarkdown(text: string): string {
  if (!text || typeof text !== "string") {
    return text
  }
  
  let result = text
  const length = result.length

  // Handle incomplete links at the end - remove if unterminated
  const lastOpenBracket = result.lastIndexOf('[')
  const lastCloseBracket = result.lastIndexOf(']')
  if (lastOpenBracket > lastCloseBracket) {
    result = result.substring(0, lastOpenBracket)
  }

  // Quick check for incomplete markdown tokens at the end
  // Only process the last ~50 characters for performance
  const checkEnd = Math.min(50, length)
  const endText = result.slice(-checkEnd)
  
  // Check for incomplete tokens using simple pattern matching
  // Bold (**)
  const asteriskCount = (endText.match(/\*\*/g) || []).length
  if (asteriskCount % 2 === 1) {
    result = result + '**'
  }
  
  // Underscore italic (__)
  const underscoreCount = (endText.match(/__/g) || []).length
  if (underscoreCount % 2 === 1) {
    result = result + '__'
  }
  
  // Strikethrough (~~)
  const tildeCount = (endText.match(/~~/g) || []).length
  if (tildeCount % 2 === 1) {
    result = result + '~~'
  }
  
  // Inline code (`) - only check if there's a trailing backtick
  if (endText.includes('`') && !endText.includes('```')) {
    const backtickCount = (endText.match(/`/g) || []).length
    if (backtickCount % 2 === 1) {
      result = result + '`'
    }
  }

  return result
}

interface AIResponseProps extends HTMLAttributes<HTMLDivElement> {
  children: string
  options?: Options
  allowedImagePrefixes?: string[]
  allowedLinkPrefixes?: string[]
  defaultOrigin?: string
  parseIncompleteMarkdown?: boolean
}

const AIResponse = memo(
  ({
    children,
    options,
    allowedImagePrefixes = ["*"],
    allowedLinkPrefixes = ["*"],
    defaultOrigin,
    parseIncompleteMarkdown: shouldParseIncompleteMarkdown = true,
    className,
    ...props
  }: AIResponseProps) => {
    // Memoize the parsed content to avoid unnecessary re-parsing
    const content = useMemo(() => {
      return shouldParseIncompleteMarkdown
        ? parseIncompleteMarkdown(children)
        : children
    }, [children, shouldParseIncompleteMarkdown])

    // Memoize components to avoid re-creating them on every render
    const components: Options["components"] = useMemo(() => ({
      h1: ({ children, ...props }) => (
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-3xl mt-5" {...props}>
          {children}
        </h1>
      ),
      h2: ({ children, ...props }) => (
        <h2 className="scroll-m-20 border-b pb-2 text-lg font-semibold tracking-tight mt-3" {...props}>
          {children}
        </h2>
      ),
      h3: ({ children, ...props }) => (
        <h3 className="scroll-m-20 text-base font-semibold tracking-tight mt-3" {...props}>
          {children}
        </h3>
      ),
      h4: ({ children, ...props }) => (
        <h4 className="scroll-m-20 text-sm font-semibold tracking-tight mt-3" {...props}>
          {children}
        </h4>
      ),
      h5: ({ children, ...props }) => (
        <h5 className="scroll-m-20 text-xs font-semibold tracking-tight mt-2" {...props}>
          {children}
        </h5>
      ),
      h6: ({ children, ...props }) => (
        <h6 className="scroll-m-20 text-xs font-semibold tracking-tight mt-2" {...props}>
          {children}
        </h6>
      ),
      p: ({ children, ...props }) => (
        <p className="leading-7 [&:not(:first-child)]:mt-6" {...props}>
          {children}
        </p>
      ),
      ul: ({ children, ...props }) => (
        <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>
          {children}
        </ol>
      ),
      li: ({ children, ...props }) => (
        <li className="marker:text-muted-foreground" {...props}>
          {children}
        </li>
      ),
      blockquote: ({ children, ...props }) => (
        <blockquote className="mt-6 border-l-4 pl-6" {...props}>
          {children}
        </blockquote>
      ),
      a: ({ children, href, ...props }) => {
        const isAllowed = allowedLinkPrefixes.some((prefix) =>
          prefix === "*" || href?.startsWith(prefix)
        )
        if (!isAllowed) {
          return <span {...props}>{children}</span>
        }
        return (
          <a
            className="inline-flex items-center gap-1 font-medium underline decoration-dotted underline-offset-2"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          >
            {children}
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        )
      },
      strong: ({ children, ...props }) => (
        <strong className="font-semibold" {...props}>
          {children}
        </strong>
      ),
      em: ({ children, ...props }) => (
        <em className="italic" {...props}>
          {children}
        </em>
      ),
      del: ({ children, ...props }) => (
        <del className="line-through" {...props}>
          {children}
        </del>
      ),
      // Render inline code with proper styling
      code: ({ children, ...props }) => (
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
      ),
      // Render code blocks as plain text (no styling)
      pre: ({ children, ...props }) => (
        <div {...(props as HTMLAttributes<HTMLDivElement>)}>{children}</div>
      ),
    }), [allowedLinkPrefixes])

    return (
      <div className={cn("prose dark:prose-invert", className)} {...props}>
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkGfm, remarkEmoji, remarkBreaks, remarkSmartypants, remarkToc, remarkFrontmatter]}
          rehypePlugins={[rehypeKatex, rehypeRaw, rehypeHighlight]}
          components={components}
          {...options}
        >
          {content}
        </ReactMarkdown>
      </div>
    )
  }
)

AIResponse.displayName = "AIResponse"

export { AIResponse }
