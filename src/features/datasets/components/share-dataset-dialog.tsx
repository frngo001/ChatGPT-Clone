import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useDatasetStore } from '@/stores/dataset-store'
import { usePermissionsStore } from '@/stores/permissions-store'
import { useToast } from '@/hooks/use-sonner-toast'

interface ShareDatasetDialogProps {
  datasetId: string
  datasetName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareDatasetDialog({ 
  datasetId, 
  datasetName, 
  open, 
  onOpenChange 
}: ShareDatasetDialogProps) {
  const { shareDatasetWithTenant } = useDatasetStore()
  const { tenant } = usePermissionsStore()
  const { toast } = useToast()
  const [isSharing, setIsSharing] = useState(false)
  
  const handleShare = async () => {
    if (!tenant) {
      toast({ title: 'Fehler', description: 'Kein Tenant gefunden', variant: 'error' })
      return
    }
    
    setIsSharing(true)
    try {
      await shareDatasetWithTenant(datasetId, tenant.id)
      toast({ 
        title: 'Dataset geteilt', 
        description: `"${datasetName}" ist jetzt für alle Nutzer sichtbar (Read-Only)`,
        variant: 'success' 
      })
      onOpenChange(false)
    } catch (error) {
      toast({ 
        title: 'Fehler beim Teilen', 
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'error' 
      })
    } finally {
      setIsSharing(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dataset teilen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Möchten Sie das Dataset "{datasetName}" mit allen Nutzern teilen?
            Alle Nutzer erhalten Read-Only-Zugriff.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleShare} disabled={isSharing}>
              {isSharing ? 'Wird geteilt...' : 'Teilen'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

