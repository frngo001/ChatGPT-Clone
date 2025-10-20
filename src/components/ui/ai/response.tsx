"use client"

import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"
import { memo } from "react"
import ReactMarkdown, { type Options } from "react-markdown"
import remarkGfm from "remark-gfm"

/**
 * Parses markdown text and removes incomplete tokens to prevent partial rendering
 * of links, images, bold, and italic formatting during streaming.
 */
function parseIncompleteMarkdown(text: string): string {
  if (!text || typeof text !== "string") {
    return text
  }
  let result = text

  // Handle incomplete links and images
  // Pattern: [...] or ![...] where the closing ] is missing
  const linkImagePattern = /(!?\[)([^\]]*?)$/
  const linkMatch = result.match(linkImagePattern)
  if (linkMatch) {
    // If we have an unterminated [ or ![, remove it and everything after
    const startIndex = result.lastIndexOf(linkMatch[1])
    result = result.substring(0, startIndex)
  }

  // Handle incomplete bold formatting (**)
  const boldPattern = /(\*\*)([^*]*?)$/
  const boldMatch = result.match(boldPattern)
  if (boldMatch) {
    // Count the number of ** in the entire string
    const asteriskPairs = (result.match(/\*\*/g) || []).length
    // If odd number of **, we have an incomplete bold - complete it
    if (asteriskPairs % 2 === 1) {
      result = `${result}**`
    }
  }

  // Handle incomplete italic formatting (__)
  const italicPattern = /(__)([^_]*?)$/
  const italicMatch = result.match(italicPattern)
  if (italicMatch) {
    // Count the number of __ in the entire string
    const underscorePairs = (result.match(/__/g) || []).length
    // If odd number of __, we have an incomplete italic - complete it
    if (underscorePairs % 2 === 1) {
      result = `${result}__`
    }
  }

  // Handle incomplete single asterisk italic (*)
  const singleAsteriskPattern = /(\*)([^*]*?)$/
  const singleAsteriskMatch = result.match(singleAsteriskPattern)
  if (singleAsteriskMatch) {
    // Count single asterisks that aren't part of **
    const singleAsterisks = result.split("").reduce((acc, char, index) => {
      if (char === "*") {
        // Check if it's part of a ** pair
        const prevChar = result[index - 1]
        const nextChar = result[index + 1]
        if (prevChar !== "*" && nextChar !== "*") {
          return acc + 1
        }
      }
      return acc
    }, 0)
    // If odd number of single *, we have an incomplete italic - complete it
    if (singleAsterisks % 2 === 1) {
      result = `${result}*`
    }
  }

  // Handle incomplete strikethrough formatting (~~)
  const strikethroughPattern = /(~~)([^~]*?)$/
  const strikethroughMatch = result.match(strikethroughPattern)
  if (strikethroughMatch) {
    // Count the number of ~~ in the entire string
    const tildePairs = (result.match(/~~/g) || []).length
    // If odd number of ~~, we have an incomplete strikethrough - complete it
    if (tildePairs % 2 === 1) {
      result = `${result}~~`
    }
  }

  // Handle incomplete inline code formatting (`)
  const inlineCodePattern = /(`)([^`]*?)$/
  const inlineCodeMatch = result.match(inlineCodePattern)
  if (inlineCodeMatch) {
    // Count single backticks that aren't part of ```
    const singleBackticks = result.split("").reduce((acc, char, index) => {
      if (char === "`") {
        // Check if it's part of a ``` block
        const prevChar = result[index - 1]
        const nextChar = result[index + 1]
        if (prevChar !== "`" && nextChar !== "`") {
          return acc + 1
        }
      }
      return acc
    }, 0)
    // If odd number of single `, we have an incomplete inline code - complete it
    if (singleBackticks % 2 === 1) {
      result = `${result}\``
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
    const content = shouldParseIncompleteMarkdown
      ? parseIncompleteMarkdown(children)
      : children

    const components: Options["components"] = {
      h1: ({ children, ...props }) => (
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-3xl mt-5" {...props}>
          {children}
        </h1>
      ),
      h2: ({ children, ...props }) => (
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-3" {...props}>
          {children}
        </h2>
      ),
      h3: ({ children, ...props }) => (
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-3" {...props}>
          {children}
        </h3>
      ),
      h4: ({ children, ...props }) => (
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mt-3" {...props}>
          {children}
        </h4>
      ),
      h5: ({ children, ...props }) => (
        <h5 className="scroll-m-20 text-lg font-semibold tracking-tight mt-2" {...props}>
          {children}
        </h5>
      ),
      h6: ({ children, ...props }) => (
        <h6 className="scroll-m-20 text-base font-semibold tracking-tight mt-2" {...props}>
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
        <li {...props}>
          {children}
        </li>
      ),
      blockquote: ({ children, ...props }) => (
        <blockquote className="mt-6 border-l-2 pl-6 italic" {...props}>
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
            className="font-medium underline underline-offset-4"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          >
            {children}
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
      // Render inline code as plain text (no styling)
      code: ({ children, ...props }) => (
        <span {...props}>{children}</span>
      ),
      // Render code blocks as plain text (no styling)
      pre: ({ children, ...props }) => (
        <div {...(props as HTMLAttributes<HTMLDivElement>)}>{children}</div>
      ),
    }

    return (
      <div className={cn("prose dark:prose-invert", className)} {...props}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
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
