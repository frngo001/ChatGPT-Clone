import { memo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Eye,
  Download,
  Trash2,
  ExternalLink,
  FileText,
  Calendar,
} from 'lucide-react'
import type { DatasetFile } from '@/stores/dataset-store'
import { cn, formatDate } from '@/lib/utils'

interface FileCardProps {
  file: DatasetFile
  onPreview?: (fileId: string, fileName: string, fileType?: string, fileExtension?: string) => void
  onDownload?: (fileId: string, fileName: string) => void
  onDelete?: (fileId: string, fileName: string) => void
  getFaviconUrl?: (url: string) => string | null
  getUrlDescription?: (url: string) => string
  truncateFileName?: (fileName: string, maxLength?: number) => string
  className?: string
  variant?: 'grid' | 'list'
}

const FileCardComponent = ({
  file,
  onPreview,
  onDownload,
  onDelete,
  getFaviconUrl,
  getUrlDescription,
  truncateFileName = (name) => name,
  className,
  variant = 'grid',
}: FileCardProps) => {
  const isUrl = file.type === 'text/url' || file.type === 'text/uri-list' || file.extension === 'url'
  const faviconUrl = isUrl && getFaviconUrl ? getFaviconUrl(file.name) : null
  const isListVariant = variant === 'list'

  const handleCardClick = () => {
    if (isUrl) {
      // For URLs, open in new tab
      window.open(file.name, '_blank', 'noopener,noreferrer')
    } else if (onPreview) {
      // For files, trigger preview
      onPreview(file.id, file.name, file.type, file.extension)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(file.id, file.name)
  }

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDownload?.(file.id, file.name)
  }

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPreview?.(file.id, file.name, file.type, file.extension)
  }

  if (isListVariant) {
    // List view - simplified horizontal layout
    return (
      <Card
        className={cn(
          'group relative overflow-hidden',
          'cursor-pointer hover:shadow-md hover:shadow-primary/5',
          'hover:border-primary/50',
          'bg-transparent',
          'flex flex-row items-center justify-between p-1.5 sm:p-2',
          className
        )}
        onClick={handleCardClick}
      >
        <div className="flex-1 min-w-0 flex items-center gap-3">
          {/* Icon/Favicon */}
          {isUrl && faviconUrl ? (
            <img 
              src={faviconUrl} 
              alt=""
              className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 rounded-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-muted-foreground" />
          )}

          {/* Name */}
          <div className="flex-1 min-w-0">
            {isUrl ? (
              <a
                href={file.name}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs sm:text-sm md:text-xs font-medium text-primary underline decoration-dotted underline-offset-2 flex items-center gap-1.5 truncate"
                title={file.name}
              >
                <span className="truncate">{truncateFileName(file.name)}</span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
              </a>
            ) : (
              <div className="text-xs sm:text-sm md:text-xs font-medium truncate" title={file.name}>
                {truncateFileName(file.name)}
              </div>
            )}
            <div className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {isUrl && getUrlDescription 
                ? getUrlDescription(file.name)
                : file.type || 'Unbekannter Typ'
              }
            </div>
          </div>

          {/* Badge */}
          {!isUrl && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0 hidden sm:flex leading-none">
              {file.extension?.toUpperCase() || 'UNKNOWN'}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {isUrl ? (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-primary/10 hover:text-primary"
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Löschen</span>
            </Button>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-primary/10 hover:text-primary"
                onClick={handlePreviewClick}
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">Vorschau</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-primary/10 hover:text-primary"
                onClick={handleDownloadClick}
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">Herunterladen</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-primary/10 hover:text-primary"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Löschen</span>
              </Button>
            </>
          )}
        </div>
      </Card>
    )
  }

  // Grid view - full card layout
  return (
    <Card
      className={cn(
        'group relative overflow-hidden',
        'cursor-pointer hover:shadow-md hover:shadow-primary/5',
        'hover:border-primary/50 hover:-translate-y-0.5',
        'active:translate-y-0',
        'bg-transparent',
        'h-full flex flex-col',
        className
      )}
      onClick={handleCardClick}
    >

      <CardHeader className="relative z-10 pb-1.5 sm:pb-2 flex-shrink-0 px-3 sm:px-4 pt-2 sm:pt-2.5">
        <div className="flex items-start justify-between gap-2">
          {/* Content */}
          <div className="flex-1 min-w-0 space-y-0">
            {isUrl ? (
              <a
                href={file.name}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] sm:text-xs md:text-[11px] font-semibold text-primary underline decoration-dotted underline-offset-2 flex items-center gap-1 w-fit group/link leading-tight"
                title={file.name}
              >
                {faviconUrl && (
                  <img 
                    src={faviconUrl} 
                    alt=""
                    className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 rounded-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <span className="truncate line-clamp-2 group-hover/link:text-primary/80 leading-tight">
                  {truncateFileName(file.name, 40)}
                </span>
                <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 opacity-70 group-hover/link:opacity-100" />
              </a>
            ) : (
              <CardTitle 
                className="text-[11px] sm:text-xs md:text-[11px] font-semibold line-clamp-2 group-hover:text-primary leading-tight"
                title={file.name}
              >
                {truncateFileName(file.name, 40)}
              </CardTitle>
            )}
            
            <CardDescription className="text-[9px] sm:text-[10px] line-clamp-2 mt-0">
              {isUrl && getUrlDescription 
                ? getUrlDescription(file.name)
                : file.type || 'Unbekannter Typ'
              }
            </CardDescription>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            {isUrl ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  'h-6 w-6 sm:h-7 sm:w-7 p-0',
                  'hover:bg-primary/10 hover:text-primary'
                )}
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">Löschen</span>
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    'h-6 w-6 sm:h-7 sm:w-7 p-0',
                    'hover:bg-primary/10 hover:text-primary'
                  )}
                  onClick={handlePreviewClick}
                >
                  <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="sr-only">Vorschau</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    'h-6 w-6 sm:h-7 sm:w-7 p-0',
                    'hover:bg-primary/10 hover:text-primary'
                  )}
                  onClick={handleDownloadClick}
                >
                  <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="sr-only">Herunterladen</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    'h-6 w-6 sm:h-7 sm:w-7 p-0',
                    'hover:bg-primary/10 hover:text-primary'
                  )}
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="sr-only">Löschen</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 pt-0 mt-auto flex items-center justify-between gap-2 px-3 sm:px-4 pb-2 sm:pb-2.5 text-[9px] sm:text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
          <Badge variant="outline" className="text-[8px] sm:text-[9px] px-1 py-0 h-3 sm:h-3.5 font-medium leading-none">
            {file.extension?.toUpperCase() || 'UNKNOWN'}
          </Badge>
        </div>
        <div className="flex items-center gap-1 shrink-0 min-w-0">
          <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
          <span className="truncate" title={formatDate(file.uploadDate, { includeTime: true })}>
            {formatDate(file.uploadDate, { includeTime: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// Memoized FileCard mit custom comparison function für optimale Performance
// memo gibt true zurück wenn KEIN Re-render nötig ist (Props sind gleich)
export const FileCard = memo(FileCardComponent, (prevProps, nextProps) => {
  // Prüfe ob sich relevante Props geändert haben
  const prevDate = prevProps.file.uploadDate instanceof Date 
    ? prevProps.file.uploadDate.getTime() 
    : (prevProps.file.uploadDate ? new Date(prevProps.file.uploadDate).getTime() : null)
  const nextDate = nextProps.file.uploadDate instanceof Date 
    ? nextProps.file.uploadDate.getTime() 
    : (nextProps.file.uploadDate ? new Date(nextProps.file.uploadDate).getTime() : null)
  
  const propsChanged = (
    prevProps.file.id !== nextProps.file.id ||
    prevProps.file.name !== nextProps.file.name ||
    prevProps.file.type !== nextProps.file.type ||
    prevProps.file.extension !== nextProps.file.extension ||
    prevDate !== nextDate ||
    prevProps.variant !== nextProps.variant ||
    prevProps.className !== nextProps.className
  )
  
  // Wenn Props sich geändert haben, return false (Re-render nötig)
  // Wenn Props gleich sind, return true (kein Re-render)
  // Callbacks (onPreview, onDownload, onDelete, getFaviconUrl, getUrlDescription, truncateFileName) 
  // werden ignoriert, da sie Referenzen sind die häufig neu erstellt werden
  return !propsChanged
})

FileCard.displayName = 'FileCard'
