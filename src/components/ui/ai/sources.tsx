'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { BookIcon, ChevronDownIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { getFaviconUrl as getCachedFaviconUrl } from '@/lib/url-cache'

export type SourcesProps = ComponentProps<typeof Collapsible>

export const Sources = ({ className, open: openProp, onOpenChange, ...props }: SourcesProps) => {
  const [open, setOpen] = useState<boolean>(!!openProp)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync controlled prop if provided
  useEffect(() => {
    if (typeof openProp === 'boolean') setOpen(openProp)
  }, [openProp])

  // Close on outside click when open
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        onOpenChange?.(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, onOpenChange])

  return (
    <Collapsible
      ref={containerRef as any}
      open={open}
      onOpenChange={(v) => {
        setOpen(!!v)
        onOpenChange?.(!!v)
      }}
      className={cn('not-prose mb-0 text-primary text-xs', className)}
      {...props}
    />
  )
}

export type SourcesTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  count: number
}

export const SourcesTrigger = ({
  className,
  count,
  children,
  ...props
}: SourcesTriggerProps) => (
  <CollapsibleTrigger className={cn('group flex items-center gap-2', className)} {...props}>
    {children ?? (
      <>
        <p className="font-medium">
          {count === 1 ? '1 Quelle verwendet' : `${count} Quellen verwendet`}
        </p>
        <ChevronDownIcon className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
      </>
    )}
  </CollapsibleTrigger>
)

export type SourcesContentProps = ComponentProps<typeof CollapsibleContent> & {
  datasetId?: string
  onSourceClick?: (sourceName: string) => void
}

export const SourcesContent = ({ className, datasetId, onSourceClick, children, ...props }: SourcesContentProps) => {
  // Clone children and pass datasetId and onSourceClick to Source components
  const enhancedChildren = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.type === Source) {
      return React.cloneElement(child as React.ReactElement<SourceProps>, {
        datasetId,
        onSourceClick,
      })
    }
    return child
  })

  return (
    <CollapsibleContent
      className={cn(
        'mt-3 flex flex-col gap-2 w-auto min-w-full space-y-2',
        'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
        className
      )}
      {...props}
    >
      {enhancedChildren}
    </CollapsibleContent>
  )
}

export type SourceProps = ComponentProps<'a'> & {
  datasetId?: string
  onSourceClick?: (sourceName: string) => void
}

// getFaviconUrl mit Fallback für nicht-URLs (nutzt getCachedFaviconUrl von url-cache.ts)
const getFaviconUrl = (input: string) => {
  // Versuche zuerst die zentrale Funktion
  try {
    const cached = getCachedFaviconUrl(input)
    if (cached) return cached
  } catch {
    // Fallback für nicht-URLs oder ungültige URLs
  }
  
  // Fallback: Versuche als vollständige URL oder Domain zu parsen
  try {
    let hostname: string
    try {
      const urlObj = new URL(input)
      hostname = urlObj.hostname
    } catch {
      // Fällt zurück auf Domain/Hostname ohne Protokoll
      const trimmed = input.trim()
      // Wenn nur Hostname (z.B. "www.seite.de" oder "seite.de")
      const domainMatch = trimmed.match(/^([a-z0-9.-]+\.[a-z]{2,})(?:\/[\S]*)?$/i)
      if (trimmed.startsWith('www.') || domainMatch) {
        hostname = (domainMatch ? domainMatch[1] : trimmed).replace(/^https?:\/\//, '')
      } else {
        // Letzter Versuch: prepend https:// und erneut parsen
        const urlObj = new URL(`https://${trimmed}`)
        hostname = urlObj.hostname
      }
    }
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch (e) {
    return null
  }
}

const isUrl = (str: string) => {
  return str?.startsWith('http://') || str?.startsWith('https://')
}

const isPdf = (str: string) => {
  return str?.toLowerCase().endsWith('.pdf')
}

// Extract and shorten URL from DuckDuckGo redirect links
const extractAndShortenUrl = (url: string): string => {
  try {
    let actualUrl = url
    
    // Check if it's a DuckDuckGo redirect
    if (url.includes('duckduckgo.com') && url.includes('uddg=')) {
      const decodedUrl = decodeURIComponent(url)
      const match = decodedUrl.match(/uddg=([^&]+)/)
      if (match) {
        actualUrl = match[1]
      }
    }
    
    // If URL is less than 40 characters, show full URL
    if (actualUrl.length < 60) {
      try {
        const urlObj = new URL(actualUrl)
        // Remove protocol for display if URL is short enough
        return actualUrl.replace(/^https?:\/\//, '')
      } catch {
        return actualUrl
      }
    }
    
    // If URL is 40+ characters, show shortened version (domain only)
    const urlObj = new URL(actualUrl)
    return urlObj.hostname.replace('www.', '')
  } catch (e) {
    // If parsing fails, check length and return accordingly
    if (url.length < 40) {
      return url.replace(/^https?:\/\//, '')
    }
    // Try to extract domain from string
    const match = url.match(/https?:\/\/([^/]+)/)
    if (match) {
      return match[1].replace('www.', '')
    }
    return url
  }
}

// Ensure a domain-like string has a protocol for safe linking
const ensureUrlHasProtocol = (input: string): string => {
  if (!input) return input
  if (input.startsWith('http://') || input.startsWith('https://')) return input
  // Heuristik: bei offensichtlichen Domains Protokoll ergänzen
  const looksLikeDomain = /^(www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(input.trim())
  return looksLikeDomain ? `https://${input}` : input
}

export const Source = ({ href, title, children, datasetId, onSourceClick, ...props }: SourceProps) => {
  // Check if href or title is a URL
  const sourceUrl = isUrl(href || '') ? href : (isUrl(title || '') ? title : null)
  
  // Extract and shorten URL for web search sources  
  const displayUrl = sourceUrl ? extractAndShortenUrl(sourceUrl) : ''
  const rawHref = sourceUrl || href || title || ''
  const actualHref = ensureUrlHasProtocol(rawHref)
  
  // Get favicon for the actual URL (not the DDG redirect)
  const faviconUrl = getFaviconUrl(rawHref)
  
  // Show shortened display name
  const displayName = sourceUrl ? displayUrl : (title || href || '')
  
  // Check if this is a PDF from a dataset
  const sourceName = title || href || ''
  const isPdfSource = isPdf(sourceName)
  const isDatasetPdf = isPdfSource && datasetId && onSourceClick
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isDatasetPdf) {
      e.preventDefault()
      onSourceClick!(sourceName)
    }
  }
  
  return (
    <a
      className="flex items-center gap-2 align-middle hover:underline max-w-full"
      href={actualHref || "#"}
      rel="noreferrer"
      target={actualHref && actualHref !== "#" ? "_blank" : undefined}
      title={actualHref}  // Show full URL in tooltip
      onClick={handleClick}
      {...props}
    >
      {children ?? (
        <>
          {isPdfSource ? (
            <img
              src="/icons/image.png"
              alt="PDF"
              className="h-4 w-4 flex-shrink-0"
            />
          ) : (
            <>
              {faviconUrl && (
                <img
                  src={faviconUrl}
                  alt=""
                  className="h-4 w-4 flex-shrink-0 rounded-sm"
                  onError={(e) => {
                    // Hide img on error and show BookIcon as fallback
                    e.currentTarget.style.display = 'none'
                    // Show BookIcon after error
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement
                    if (fallback) {
                      fallback.style.display = 'inline-flex'
                    }
                  }}
                />
              )}
              <BookIcon
                className="h-4 w-4 flex-shrink-0 text-muted-foreground"
                style={{ display: faviconUrl ? 'none' : 'inline-flex' }}
              />
            </>
          )}
          <span className="truncate flex-1 font-medium align-middle text-xs">{displayName}</span>
        </>
      )}
    </a>
  )
}
