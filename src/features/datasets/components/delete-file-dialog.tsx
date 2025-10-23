import { useState } from 'react'
import { Trash2 } from 'lucide-react'
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
import { toast } from 'sonner'

interface DeleteFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  datasetId: string
  fileId: string
  fileName: string
  onSuccess?: () => void
}

export function DeleteFileDialog({ 
  open, 
  onOpenChange, 
  datasetId,
  fileId,
  fileName,
  onSuccess 
}: DeleteFileDialogProps) {
  const { removeFileFromDataset, error } = useDatasetStore()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await removeFileFromDataset(datasetId, fileId)
      toast.success(`${fileName} wurde erfolgreich entfernt.`)
      onSuccess?.()
      
      // Close modal after short delay to show toast
      setTimeout(() => {
        onOpenChange(false)
      }, 500)
    } catch (error) {
      console.error('Failed to delete file:', error)
      toast.error(`Fehler beim Löschen von ${fileName}: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
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
          <DialogTitle>
            Datei löschen
          </DialogTitle>
          <DialogDescription>
            Möchten Sie die Datei <strong>"{fileName}"</strong> wirklich löschen? 
            Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="rounded-md bg-destructive/15 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Abbrechen
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Wird gelöscht...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Löschen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
