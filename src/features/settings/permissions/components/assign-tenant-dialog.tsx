import { useState } from 'react'
import { Building2, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { usePermissionsStore } from '@/stores/permissions-store'
import { useToast } from '@/hooks/use-sonner-toast'

interface AssignTenantDialogProps {
  userId: string
  userEmail: string
  currentTenantId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignTenantDialog({
  userId,
  userEmail,
  currentTenantId,
  open,
  onOpenChange,
}: AssignTenantDialogProps) {
  const { tenants, assignTenantToUser } = usePermissionsStore()
  const [selectedTenantId, setSelectedTenantId] = useState<string>(currentTenantId || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleAssign = async () => {
    if (!selectedTenantId) {
      toast({
        title: 'Fehler',
        description: 'Bitte wählen Sie einen Tenant aus',
        variant: 'error',
      })
      return
    }

    setIsSubmitting(true)
    try {
      await assignTenantToUser(userId, selectedTenantId)
      toast({
        title: 'Tenant zugewiesen',
        description: `${userEmail} wurde erfolgreich einem Tenant zugewiesen`,
        variant: 'success',
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Tenant konnte nicht zugewiesen werden',
        variant: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tenant zuweisen</DialogTitle>
          <DialogDescription>
            Weisen Sie dem Benutzer <strong>{userEmail}</strong> einen Tenant zu.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tenant">Tenant auswählen</Label>
            {tenants.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 mr-2" />
                Keine Tenants verfügbar
              </div>
            ) : (
              <Select
                value={selectedTenantId}
                onValueChange={setSelectedTenantId}
                disabled={isSubmitting}
              >
                <SelectTrigger id="tenant">
                  <SelectValue placeholder="Tenant auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2" />
                        {tenant.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {currentTenantId && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="text-muted-foreground">
                Aktueller Tenant: <strong>
                  {tenants.find(t => t.id === currentTenantId)?.name || 'Unbekannt'}
                </strong>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={isSubmitting || !selectedTenantId || tenants.length === 0}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zuweisen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

