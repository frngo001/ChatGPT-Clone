'use client'

import { useEffect, useRef, useState } from 'react'
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

export type SourcesContentProps = ComponentProps<typeof CollapsibleContent>

export const SourcesContent = ({ className, ...props }: SourcesContentProps) => (
  <CollapsibleContent
    className={cn(
      'mt-3 flex flex-col gap-2 w-auto min-w-full max-w-[10vw] space-y-2',
      'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
      className
    )}
    {...props}
  />
)

export type SourceProps = ComponentProps<'a'>

export const Source = ({ href, title, children, ...props }: SourceProps) => (
  <a
    className="inline-flex items-center gap-2 max-w-full align-middle"
    href={href}
    rel="noreferrer"
    target="_blank"
    {...props}
  >
    {children ?? (
      <>
        <BookIcon className="h-4 w-4 flex-shrink-0" />
        <span className="inline-block font-medium truncate max-w-[80vw] align-middle" title={String(title)}>{title}</span>
      </>
    )}
  </a>
)
