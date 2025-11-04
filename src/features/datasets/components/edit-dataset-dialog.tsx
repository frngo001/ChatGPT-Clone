import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useDatasetStore } from '@/stores/dataset-store'
import { useToast } from '@/hooks/use-sonner-toast'
import { useAuthStore } from '@/stores/auth-store'
import { canWriteDataset } from '@/lib/permissions-helper'

interface EditDatasetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  datasetId: string
  onSuccess?: () => void
}

export function EditDatasetDialog({ open, onOpenChange, datasetId, onSuccess }: EditDatasetDialogProps) {
  const { updateDataset, getDatasetById, isLoading, error, fetchDatasetDataWithCache } = useDatasetStore()
  const { toast } = useToast()
  const { auth } = useAuthStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  // Load dataset data when dialog opens
  useEffect(() => {
    if (open && datasetId) {
      const dataset = getDatasetById(datasetId)
      if (dataset) {
        setName(dataset.name)
        setDescription(dataset.description || '')
        setTags(dataset.tags || [])
      }
    }
  }, [open, datasetId, getDatasetById])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const dataset = getDatasetById(datasetId)
    if (!dataset) {
      toast({
        title: "Fehler",
        description: "Dataset nicht gefunden.",
        variant: "error",
      })
      return
    }

    // Prüfe Berechtigung
    if (!canWriteDataset(auth.user, dataset)) {
      toast({
        title: "Sie haben keine Berechtigung, dieses Dataset zu bearbeiten.",
        variant: "error",
      })
      return
    }

    try {
      await updateDataset(datasetId, {
        description: description.trim(),
        tags: tags,
      })
      
      // Modal sofort schließen
      onOpenChange(false)
      onSuccess?.()
      
      // Show success toast
      toast({
        title: "Dataset aktualisiert",
        description: `Das Dataset wurde erfolgreich aktualisiert.`,
        variant: "success",
      })
      
      // Dateien im Hintergrund neu laden (nicht blockierend)
      fetchDatasetDataWithCache(datasetId).catch((fetchError) => {
        console.error('Failed to refresh dataset files:', fetchError)
      })
    } catch (error) {
      // Error is handled by the store
      console.error('Failed to update dataset:', error)
      toast({
        title: "Fehler beim Aktualisieren",
        description: "Das Dataset konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.",
        variant: "error",
      })
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dataset bearbeiten</DialogTitle>
          <DialogDescription>
            Ändern Sie die Metadaten dieses Datasets.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              disabled
              readOnly
              className="bg-muted cursor-not-allowed"
              placeholder="Dataset-Name eingeben"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreiben Sie, was dieses Dataset enthält"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tags hinzufügen"
              />
              <Button type="button" onClick={handleAddTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Aktualisiere...' : 'Änderungen speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

