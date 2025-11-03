import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { usePermissionsStore } from '@/stores/permissions-store'
import { useToast } from '@/hooks/use-sonner-toast'
import { Loader2 } from 'lucide-react'

interface CreateRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRoleDialog({ open, onOpenChange }: CreateRoleDialogProps) {
  const [roleName, setRoleName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const createRole = usePermissionsStore((state) => state.createRole)
  const { toast } = useToast()

  const handleCreate = async () => {
    if (!roleName.trim()) {
      toast({ title: 'Fehler', description: 'Bitte geben Sie einen Rollennamen ein', variant: 'error' })
      return
    }

    setIsCreating(true)
    try {
      await createRole(roleName.trim(), description.trim() || undefined)
      toast({ 
        title: 'Rolle erstellt', 
        description: `Die Rolle "${roleName}" wurde erfolgreich erstellt`, 
        variant: 'success' 
      })
      
      // Reset form
      setRoleName('')
      setDescription('')
      onOpenChange(false)
    } catch (error) {
      toast({ 
        title: 'Fehler', 
        description: error instanceof Error ? error.message : 'Rolle konnte nicht erstellt werden', 
        variant: 'error' 
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Rolle erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie eine neue Rolle, um Berechtigungen zu gruppieren und Benutzern zuzuweisen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="roleName">Rollenname *</Label>
            <Input
              id="roleName"
              placeholder="z.B. Editor, Viewer, Manager"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Beschreiben Sie die Rolle und ihre Berechtigungen..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isCreating}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Abbrechen
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !roleName.trim()}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Rolle erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

