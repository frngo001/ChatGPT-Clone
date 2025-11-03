import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { usePermissionsStore } from '@/stores/permissions-store'
import { useToast } from '@/hooks/use-sonner-toast'
import { Loader2 } from 'lucide-react'
import { cogneeApi } from '@/lib/api/cognee-api-client'

interface CreateTenantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTenantDialog({ open, onOpenChange }: CreateTenantDialogProps) {
  const [tenantName, setTenantName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const fetchAllUsers = usePermissionsStore((state) => state.fetchAllUsers)
  const { toast } = useToast()

  const handleCreate = async () => {
    if (!tenantName.trim()) {
      toast({ title: 'Fehler', description: 'Bitte geben Sie einen Tenant-Namen ein', variant: 'error' })
      return
    }

    setIsCreating(true)
    try {
      await cogneeApi.permissions.createTenant(tenantName.trim(), description.trim() || undefined)
      
      // Refresh users to update tenant list
      await fetchAllUsers()
      
      toast({ 
        title: 'Tenant erstellt', 
        description: `Der Tenant "${tenantName}" wurde erfolgreich erstellt`, 
        variant: 'success' 
      })
      
      // Reset form
      setTenantName('')
      setDescription('')
      onOpenChange(false)
    } catch (error) {
      toast({ 
        title: 'Fehler', 
        description: error instanceof Error ? error.message : 'Tenant konnte nicht erstellt werden', 
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
          <DialogTitle>Neuen Tenant erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie einen neuen Tenant für Benutzergruppen und Organisationen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tenantName">Tenant-Name *</Label>
            <Input
              id="tenantName"
              placeholder="z.B. Abteilung Marketing, Firma XYZ"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Beschreiben Sie den Tenant..."
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
          <Button onClick={handleCreate} disabled={isCreating || !tenantName.trim()}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tenant erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

