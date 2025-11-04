import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDatasetStore } from '@/stores/dataset-store'
import { useAuthStore } from '@/stores/auth-store'
import { canDeleteDataset } from '@/lib/permissions-helper'
import { toast } from 'sonner'

interface DeleteDatasetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dataset: {
    id: string
    name: string
    filesCount: number
  }
  onSuccess?: () => void
}

export function DeleteDatasetDialog({ 
  open, 
  onOpenChange, 
  dataset, 
  onSuccess 
}: DeleteDatasetDialogProps) {
  const { deleteDataset, error, getDatasetById } = useDatasetStore()
  const { auth } = useAuthStore()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    // Prüfe Berechtigung
    const fullDataset = getDatasetById(dataset.id)
    if (!fullDataset) {
      toast.error('Dataset nicht gefunden')
      return
    }

    if (!canDeleteDataset(auth.user, fullDataset)) {
      toast.error('Sie haben keine Berechtigung, dieses Dataset zu löschen.')
      return
    }

    setIsDeleting(true)
    try {
      await deleteDataset(dataset.id)
      toast.success(`Dataset "${dataset.name}" wurde erfolgreich gelöscht`)
      onSuccess?.()
      
      // Close modal after short delay to show toast
      setTimeout(() => {
        onOpenChange(false)
      }, 500)
    } catch (error) {
      console.error('Failed to delete dataset:', error)
      const errorMessage = error instanceof Error ? error.message : 'Dataset konnte nicht gelöscht werden'
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dataset löschen</DialogTitle>
          <DialogDescription>
            Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Möchten Sie das Dataset <strong>"{dataset.name}"</strong> wirklich löschen?
          </p>
          {dataset.filesCount > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Dieses Dataset enthält {dataset.filesCount} Datei{dataset.filesCount === 1 ? '' : 'en'}, die ebenfalls gelöscht werden.
            </p>
          )}
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
            <strong>Fehler:</strong> {error}
          </div>
        )}

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Abbrechen
          </Button>
          <Button 
            type="button" 
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Löschen...' : 'Löschen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
