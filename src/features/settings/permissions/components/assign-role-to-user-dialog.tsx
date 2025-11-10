import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePermissionsStore } from '@/stores/permissions-store'
import { useToast } from '@/hooks/use-sonner-toast'
import { Loader2, X } from 'lucide-react'

interface AssignRoleToUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userEmail: string
}

export function AssignRoleToUserDialog({ open, onOpenChange, userId, userEmail }: AssignRoleToUserDialogProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [removingRoleId, setRemovingRoleId] = useState<string | null>(null)
  const roles = usePermissionsStore((state) => state.roles)
  const assignUserToRole = usePermissionsStore((state) => state.assignUserToRole)
  const removeUserFromRole = usePermissionsStore((state) => state.removeUserFromRole)
  const users = usePermissionsStore((state) => state.users)
  const { toast } = useToast()

  // Hole User-Daten aus dem Store (enthält bereits Rollen)
  const user = useMemo(() => users.find(u => u.id === userId), [users, userId])
  const userRoles = useMemo(() => user?.roles || [], [user])

  // Filtere Rollen, die der User noch nicht hat
  const availableRoles = useMemo(() => {
    return roles.filter(
      (role) => !userRoles.some((userRole) => userRole.id === role.id)
    )
  }, [roles, userRoles])


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

  const handleRemoveRole = async (roleId: string) => {
    setRemovingRoleId(roleId)
    try {
      await removeUserFromRole(userId, roleId)
      const role = roles.find((r) => r.id === roleId)
      toast({ 
        title: 'Rolle entfernt', 
        description: `Die Rolle "${role?.name || 'Rolle'}" wurde von ${userEmail} entfernt`, 
        variant: 'success' 
      })
    } catch (error) {
      toast({ 
        title: 'Fehler', 
        description: error instanceof Error ? error.message : 'Entfernen fehlgeschlagen', 
        variant: 'error' 
      })
    } finally {
      setRemovingRoleId(null)
    }
  }

  if (!open) return null

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
                  <div
                    key={role.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                  >
                    <span>{role.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive"
                      onClick={() => handleRemoveRole(role.id)}
                      disabled={removingRoleId === role.id || isAssigning}
                    >
                      {removingRoleId === role.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
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

