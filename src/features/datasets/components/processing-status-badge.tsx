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
          variant: 'default' as const,
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        }
      case 'DATASET_PROCESSING_COMPLETED':
        return {
          label: 'Verarbeitet',
          variant: 'default' as const,
          icon: <CheckCircle2 className="h-3 w-3" />,
          className: 'bg-green-100 text-green-800 border-green-200'
        }
      case 'DATASET_PROCESSING_ERRORED':
        return {
          label: 'Verarbeitung fehlgeschlagen',
          variant: 'destructive' as const,
          icon: <AlertCircle className="h-3 w-3" />,
          className: 'bg-red-100 text-red-800 border-red-200'
        }
      case 'DATASET_PROCESSING_INITIATED':
      default:
        return {
          label: 'Muss verarbeitet werden',
          variant: 'secondary' as const,
          icon: <AlertTriangle className="h-3 w-3" />,
          className: 'bg-orange-100 text-orange-800 border-orange-200'
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
