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

const getFaviconUrl = (url: string) => {
  try {
    const urlObj = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
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
    // Check if it's a DuckDuckGo redirect
    if (url.includes('duckduckgo.com') && url.includes('uddg=')) {
      const decodedUrl = decodeURIComponent(url)
      const match = decodedUrl.match(/uddg=([^&]+)/)
      if (match) {
        const actualUrl = match[1]
        const urlObj = new URL(actualUrl)
        return urlObj.hostname.replace('www.', '')
      }
    }
    
    // Regular URL - show just domain
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch (e) {
    // If parsing fails, try to extract domain from string
    const match = url.match(/https?:\/\/([^/]+)/)
    if (match) {
      return match[1].replace('www.', '')
    }
    return url
  }
}

export const Source = ({ href, title, children, datasetId, onSourceClick, ...props }: SourceProps) => {
  // Check if href or title is a URL
  const sourceUrl = isUrl(href || '') ? href : (isUrl(title || '') ? title : null)
  
  // Extract and shorten URL for web search sources  
  const displayUrl = sourceUrl ? extractAndShortenUrl(sourceUrl) : ''
  const actualHref = sourceUrl || href || title || ''
  
  // Get favicon for the actual URL (not the DDG redirect)
  const faviconUrl = actualHref && isUrl(actualHref) ? getFaviconUrl(actualHref) : null
  
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
      className="inline-flex items-center gap-2 align-middle hover:underline"
      href={actualHref || "#"}
      rel="noreferrer"
      target={actualHref && actualHref !== "#" ? "_blank" : undefined}
      title={actualHref}  // Show full URL in tooltip
      onClick={handleClick}
      {...props}
    >
      {children ?? (
        <>
          {faviconUrl && (
            <img 
              src={faviconUrl} 
              alt=""
              className="h-5 w-5 flex-shrink-0 rounded-sm"
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
            className="h-5 w-5 flex-shrink-0 text-muted-foreground" 
            style={{ display: faviconUrl ? 'none' : 'inline-flex' }}
          />
          <span className="inline-block font-medium align-middle text-sm">{displayName}</span>
        </>
      )}
    </a>
  )
}
