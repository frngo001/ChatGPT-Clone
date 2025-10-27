import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePermissionsStore } from '@/stores/permissions-store'
import { useToast } from '@/hooks/use-sonner-toast'
import { Loader2 } from 'lucide-react'
import type { Role } from '@/types/permissions'

interface AssignRoleToUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userEmail: string
}

export function AssignRoleToUserDialog({ open, onOpenChange, userId, userEmail }: AssignRoleToUserDialogProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)
  const { roles, assignUserToRole, users } = usePermissionsStore()
  const { toast } = useToast()

  // Hole User-Daten aus dem Store (enthält bereits Rollen)
  const user = users.find(u => u.id === userId)
  const userRoles = user?.roles || []


  // Filtere Rollen, die der User noch nicht hat
  const availableRoles = roles.filter(
    (role) => !userRoles.some((userRole) => userRole.id === role.id)
  )


  const handleAssign = async () => {
    if (!selectedRoleId) {
      toast({ title: 'Fehler', description: 'Bitte wählen Sie eine Rolle aus', variant: 'error' })
      return
    }

    setIsAssigning(true)
    try {
      await assignUserToRole(userId, selectedRoleId)
      const role = roles.find((r) => r.id === selectedRoleId)
      toast({ 
        title: 'Rolle zugewiesen', 
        description: `${userEmail} wurde der Rolle "${role?.name || 'Rolle'}" zugewiesen`, 
        variant: 'success' 
      })
      
      setSelectedRoleId('')
      onOpenChange(false)
    } catch (error) {
      toast({ 
        title: 'Fehler', 
        description: error instanceof Error ? error.message : 'Zuweisung fehlgeschlagen', 
        variant: 'error' 
      })
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rolle zuweisen</DialogTitle>
          <DialogDescription>
            Weisen Sie dem Benutzer "{userEmail}" eine Rolle zu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Aktuelle Rollen anzeigen */}
          {userRoles.length > 0 && (
            <div className="space-y-2">
              <Label>Aktuelle Rollen</Label>
              <div className="flex flex-wrap gap-2">
                {userRoles.map((role) => (
                  <span
                    key={role.id}
                    className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                  >
                    {role.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Verfügbare Rollen */}
          {availableRoles.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground space-y-2">
              <p>Dieser Benutzer hat bereits alle verfügbaren Rollen.</p>
              <div className="text-xs">
                <p>Verfügbare Rollen: {roles.length}</p>
                <p>Benutzer-Rollen: {userRoles.length}</p>
                {userRoles.length > 0 && (
                  <p>Aktuelle Rollen: {userRoles.map(r => r.name).join(', ')}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="role">Rolle auswählen *</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId} disabled={isAssigning}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Rolle wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAssigning}
          >
            Abbrechen
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={isAssigning || !selectedRoleId || availableRoles.length === 0}
          >
            {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zuweisen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

