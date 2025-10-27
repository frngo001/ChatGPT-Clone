import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePermissionsStore } from '@/stores/permissions-store'
import { useToast } from '@/hooks/use-sonner-toast'
import { Loader2, UserPlus } from 'lucide-react'
import type { Role } from '@/types/permissions'

interface AssignUserToRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role
}

export function AssignUserToRoleDialog({ open, onOpenChange, role }: AssignUserToRoleDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)
  const { users, assignUserToRole } = usePermissionsStore()
  const { toast } = useToast()

  // Filtere User, die diese Rolle noch nicht haben
  const availableUsers = users.filter(
    (user) => !user.roles.some((r) => r.id === role.id)
  )

  const handleAssign = async () => {
    if (!selectedUserId) {
      toast({ title: 'Fehler', description: 'Bitte wählen Sie einen Benutzer aus', variant: 'error' })
      return
    }

    setIsAssigning(true)
    try {
      await assignUserToRole(selectedUserId, role.id)
      const user = users.find((u) => u.id === selectedUserId)
      toast({ 
        title: 'Benutzer zugewiesen', 
        description: `${user?.email || 'Benutzer'} wurde der Rolle "${role.name}" zugewiesen`, 
        variant: 'success' 
      })
      
      setSelectedUserId('')
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
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Benutzer zu Rolle hinzufügen
          </DialogTitle>
          <DialogDescription>
            Weisen Sie einen Benutzer der Rolle "{role.name}" zu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {availableUsers.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              Alle Benutzer haben bereits diese Rolle oder es gibt keine verfügbaren Benutzer.
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="user">Benutzer auswählen *</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={isAssigning}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Benutzer wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <span>{user.email}</span>
                        {user.is_superuser && (
                          <span className="text-xs text-muted-foreground">(Admin)</span>
                        )}
                      </div>
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
            disabled={isAssigning || !selectedUserId || availableUsers.length === 0}
          >
            {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zuweisen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

