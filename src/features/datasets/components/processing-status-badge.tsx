import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'

interface ProcessingStatusBadgeProps {
  status?: string
  className?: string
}

export function ProcessingStatusBadge({ status, className }: ProcessingStatusBadgeProps) {
  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'DATASET_PROCESSING_STARTED':
        return {
          label: 'Wird verarbeitet...',
          variant: 'secondary' as const,
          icon: <Loader2 className="h-3 w-3 animate-spin text-blue-600 dark:text-blue-400" />,
          className: 'bg-muted text-foreground dark:text-foreground border-border'
        }
      case 'DATASET_PROCESSING_COMPLETED':
        return {
          label: 'Verarbeitet',
          variant: 'secondary' as const,
          icon: <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />,
          className: 'bg-muted text-foreground dark:text-foreground border-border'
        }
      case 'DATASET_PROCESSING_ERRORED':
        return {
          label: 'Verarbeitung fehlgeschlagen',
          variant: 'secondary' as const,
          icon: <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />,
          className: 'bg-muted text-foreground dark:text-foreground border-border'
        }
      case 'DATASET_PROCESSING_INITIATED':
      default:
        return {
          label: 'Muss verarbeitet werden',
          variant: 'secondary' as const,
          icon: <AlertTriangle className="h-3 w-3 text-orange-600 dark:text-orange-400" />,
          className: 'bg-muted text-foreground dark:text-foreground border-border'
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Badge 
      variant={config.variant} 
      className={`flex items-center gap-1 text-xs ${config.className} ${className || ''}`}
    >
      {config.icon}
      {config.label}
    </Badge>
  )
}
