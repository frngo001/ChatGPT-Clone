import { Badge } from '@/components/ui/badge'
import { Lock, Share2, User } from 'lucide-react'

interface PermissionsBadgeProps {
  isOwner: boolean
  isShared: boolean
}

export function PermissionsBadge({ isOwner, isShared }: PermissionsBadgeProps) {
  if (isOwner && isShared) {
    return (
      <Badge variant="default" className="bg-green-500">
        <Share2 className="w-3 h-3 mr-1" />
        Geteilt
      </Badge>
    )
  }
  
  if (isOwner) {
    return (
      <Badge variant="default" className="bg-blue-500">
        <User className="w-3 h-3 mr-1" />
        Eigentümer
      </Badge>
    )
  }
  
  if (isShared) {
    return (
      <Badge variant="secondary">
        <Lock className="w-3 h-3 mr-1" />
        Nur Lesen
      </Badge>
    )
  }
  
  return null
}

