import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FolderOpen,
  FileText,
  User,
  Calendar,
  Clock,
  Trash2,
} from 'lucide-react'
import type { Dataset } from '@/stores/dataset-store'
import { ProcessingStatusBadge } from './processing-status-badge'
import { cn } from '@/lib/utils'

interface DatasetCardProps {
  dataset: Dataset
  ownerName?: string
  onClick?: () => void
  onDelete?: (e: React.MouseEvent) => void
  className?: string
  variant?: 'grid' | 'list'
}

export const DatasetCard = ({
  dataset,
  ownerName = 'Unbekannt',
  onClick,
  onDelete,
  className,
  variant = 'grid',
}: DatasetCardProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const isListVariant = variant === 'list'

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Unbekannt'
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      
      if (isNaN(dateObj.getTime())) {
        return 'Unbekannt'
      }
      
      return new Intl.DateTimeFormat('de-DE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(dateObj)
    } catch {
      return 'Unbekannt'
    }
  }

  const truncateDescription = (text: string | undefined | null, maxLength: number = 50) => {
    if (!text) return 'Keine Beschreibung'
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trim() + '...'
  }

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-[50ms]',
        'cursor-pointer hover:shadow-md hover:border-primary/50',
        'bg-background',
        isListVariant && 'flex flex-row items-center',
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn(
        'relative z-10',
        isListVariant ? 'flex-1 flex items-center gap-3 p-3' : 'p-3 sm:p-4 space-y-2'
      )}>
        {/* Header: Icon, Title, Status & Actions */}
        <div className={cn(
          'flex items-start gap-2 justify-between w-full',
          isListVariant && 'flex-1 min-w-0'
        )}>
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {/* Icon Container */}
            <div className={cn(
              'h-8 w-8 rounded-md',
              'bg-primary/10',
              'flex items-center justify-center shrink-0'
            )}>
              <FolderOpen className="h-4 w-4 text-primary" />
            </div>

            {/* Title */}
            <div className={cn(
              'flex-1 min-w-0'
            )}>
              <h3 
                className={cn(
                  'font-semibold leading-tight',
                  isListVariant ? 'text-sm' : 'text-sm'
                )}
                title={dataset.name}
              >
                {dataset.name}
              </h3>
              {/* Tags in List View */}
              {isListVariant && dataset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {dataset.tags.slice(0, 3).map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="text-[10px] px-1.5 py-0.5 h-5"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {dataset.tags.length > 3 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 h-5">
                      +{dataset.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status & Actions - ganz rechts */}
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {dataset.processingStatus && (
              <div className="shrink-0">
                <ProcessingStatusBadge 
                  status={dataset.processingStatus} 
                  className="text-[9px] px-2 py-0.5 h-5"
                />
              </div>
            )}
            {!isListVariant && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(e)
                }}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Löschen</span>
              </Button>
            )}
          </div>
        </div>

        {/* Grid View Additional Info */}
        {!isListVariant && (
          <>
            {/* Files Count & Tags */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {dataset.files.length} {dataset.files.length === 1 ? 'Datei' : 'Dateien'}
                </span>
              </div>
              {dataset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {dataset.tags.slice(0, 3).map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="text-[9px] px-1.5 py-0.5 h-4"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {dataset.tags.length > 3 && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 h-4">
                      +{dataset.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Footer: Owner & Dates */}
            <div className="pt-1.5 border-t space-y-1 text-[10px] text-muted-foreground">
              {/* Owner */}
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 shrink-0" />
                <span className="truncate" title={ownerName}>
                  {ownerName}
                </span>
              </div>

              {/* Dates */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span className="truncate" title={formatDate(dataset.createdAt)}>
                    {formatDate(dataset.createdAt)}
                  </span>
                </div>
                {dataset.updatedAt && (
                  <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span className="truncate" title={formatDate(dataset.updatedAt)}>
                      {formatDate(dataset.updatedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* List View: Additional Info */}
        {isListVariant && (
          <div className="flex items-center gap-4 shrink-0">
            {/* Files Count */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium hidden sm:inline">
                {dataset.files.length} {dataset.files.length === 1 ? 'Datei' : 'Dateien'}
              </span>
              <span className="font-medium sm:hidden">
                {dataset.files.length}
              </span>
            </div>

            {/* Owner */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[150px]" title={ownerName}>
                {ownerName}
              </span>
            </div>

            {/* Date */}
            <div className="hidden lg:block text-xs text-muted-foreground shrink-0">
              {formatDate(dataset.createdAt)}
            </div>

            {/* Delete Button */}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(e)
                }}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Löschen</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

