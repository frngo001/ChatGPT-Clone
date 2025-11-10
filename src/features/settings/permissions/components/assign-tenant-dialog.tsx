import { useState, useEffect, useMemo } from 'react'
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
  const tenants = usePermissionsStore((state) => state.tenants)
  const assignTenantToUser = usePermissionsStore((state) => state.assignTenantToUser)
  const removeUserFromTenant = usePermissionsStore((state) => state.removeUserFromTenant)
  const REMOVE_TENANT_VALUE = '__remove__'
  const [selectedTenantId, setSelectedTenantId] = useState<string>(currentTenantId || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Reset selectedTenantId when dialog opens or currentTenantId changes
  useEffect(() => {
    if (open) {
      setSelectedTenantId(currentTenantId || '')
    }
  }, [open, currentTenantId])

  // Check if there are changes
  const hasChanges = useMemo(() => {
    if (selectedTenantId === REMOVE_TENANT_VALUE) {
      return !!currentTenantId
    }
    return selectedTenantId !== (currentTenantId || '')
  }, [selectedTenantId, currentTenantId])

  const handleAssign = async () => {
    // If remove tenant selected, remove current tenant
    if (selectedTenantId === REMOVE_TENANT_VALUE) {
      if (currentTenantId) {
        setIsSubmitting(true)
        try {
          await removeUserFromTenant(userId, currentTenantId)
          const tenant = tenants.find(t => t.id === currentTenantId)
          toast({
            title: 'Tenant entfernt',
            description: `Der Tenant "${tenant?.name || 'Tenant'}" wurde von ${userEmail} entfernt`,
            variant: 'success',
          })
          onOpenChange(false)
        } catch (error) {
          toast({
            title: 'Fehler',
            description: error instanceof Error ? error.message : 'Entfernen fehlgeschlagen',
            variant: 'error',
          })
        } finally {
          setIsSubmitting(false)
        }
      }
      return
    }

    // If no tenant selected, do nothing
    if (!selectedTenantId) {
      return
    }

    // If same tenant selected, do nothing
    if (selectedTenantId === currentTenantId) {
      onOpenChange(false)
      return
    }

    setIsSubmitting(true)
    try {
      await assignTenantToUser(userId, selectedTenantId)
      const tenant = tenants.find(t => t.id === selectedTenantId)
      const action = currentTenantId ? 'geändert' : 'zugewiesen'
      toast({
        title: 'Tenant ' + action,
        description: `${userEmail} wurde ${action === 'geändert' ? 'zu' : ''} dem Tenant "${tenant?.name || 'Tenant'}" ${action === 'geändert' ? 'geändert' : 'zugewiesen'}`,
        variant: 'success',
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Tenant konnte nicht zugewiesen werden',
        variant: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {currentTenantId ? 'Tenant ändern' : 'Tenant zuweisen'}
          </DialogTitle>
          <DialogDescription>
            {currentTenantId 
              ? `Ändern Sie den Tenant für den Benutzer ${userEmail}.`
              : `Weisen Sie dem Benutzer ${userEmail} einen Tenant zu.`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Tenant Selection */}
          <div className="space-y-2">
            <Label htmlFor="tenant">
              {currentTenantId ? 'Neuen Tenant auswählen' : 'Tenant auswählen'}
            </Label>
            {tenants.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground rounded-md border border-dashed">
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
                  {currentTenantId && (
                    <SelectItem value={REMOVE_TENANT_VALUE}>
                      Kein Tenant
                    </SelectItem>
                  )}
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
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
            disabled={isSubmitting || !hasChanges || tenants.length === 0}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selectedTenantId === REMOVE_TENANT_VALUE ? 'Entfernen' : currentTenantId ? 'Ändern' : 'Zuweisen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

