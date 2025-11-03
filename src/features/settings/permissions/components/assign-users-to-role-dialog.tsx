import { useState, useMemo, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { usePermissionsStore } from '@/stores/permissions-store'
import { useToast } from '@/hooks/use-sonner-toast'
import { Loader2, UserPlus, Search, X } from 'lucide-react'
import type { Role } from '@/types/permissions'

interface AssignUsersToRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role
}

export function AssignUsersToRoleDialog({ open, onOpenChange, role }: AssignUsersToRoleDialogProps) {
  const { users, assignUsersToRole, removeUserFromRole, fetchAllUsers } = usePermissionsStore()
  const { toast } = useToast()
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  // Initialisiere selectedUserIds mit bereits zugewiesenen Benutzern beim Öffnen
  useEffect(() => {
    if (open && role) {
      const assignedUserIds = users
        .filter((user) => user.roles.some((r) => r.id === role.id))
        .map((user) => user.id)
      setSelectedUserIds(new Set(assignedUserIds))
      setSearchQuery('')
    }
  }, [open, role, users])

  // Filtere Benutzer basierend auf Suchanfrage
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users
    }
    const query = searchQuery.toLowerCase().trim()
    return users.filter((user) => user.email.toLowerCase().includes(query))
  }, [users, searchQuery])

  // Zähle bereits zugewiesene Benutzer
  const assignedCount = useMemo(() => {
    return users.filter((user) => user.roles.some((r) => r.id === role.id)).length
  }, [users, role.id])

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    setSelectedUserIds(new Set(filteredUsers.map((user) => user.id)))
  }

  const handleDeselectAll = () => {
    setSelectedUserIds(new Set())
  }

  const handleSave = async () => {
    setIsAssigning(true)
    try {
      // Hole aktuell zugewiesene Benutzer
      const currentlyAssigned = users
        .filter((user) => user.roles.some((r) => r.id === role.id))
        .map((user) => user.id)
      const currentlyAssignedSet = new Set(currentlyAssigned)

      // Benutzer hinzufügen
      const toAdd = Array.from(selectedUserIds).filter((id) => !currentlyAssignedSet.has(id))
      
      // Benutzer entfernen
      const toRemove = currentlyAssigned.filter((id) => !selectedUserIds.has(id))

      // Batch-Zuweisungen durchführen
      const assignments = []
      
      // Neue Zuweisungen
      for (const userId of toAdd) {
        assignments.push(assignUsersToRole([userId], role.id))
      }
      
      // Entfernen von Zuweisungen
      for (const userId of toRemove) {
        assignments.push(removeUserFromRole(userId, role.id))
      }

      await Promise.all(assignments)
      
      // Aktualisiere die Benutzerliste
      await fetchAllUsers()

      const addedCount = toAdd.length
      const removedCount = toRemove.length
      
      let message = ''
      if (addedCount > 0 && removedCount > 0) {
        message = `${addedCount} Benutzer hinzugefügt, ${removedCount} Benutzer entfernt`
      } else if (addedCount > 0) {
        message = `${addedCount} Benutzer erfolgreich zugewiesen`
      } else if (removedCount > 0) {
        message = `${removedCount} Benutzer erfolgreich entfernt`
      } else {
        message = 'Keine Änderungen'
      }

      toast({
        title: 'Zuweisungen aktualisiert',
        description: message,
        variant: 'success',
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Zuweisungen konnten nicht aktualisiert werden',
        variant: 'error',
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const selectedCount = selectedUserIds.size
  const hasChanges = useMemo(() => {
    const currentlyAssigned = users
      .filter((user) => user.roles.some((r) => r.id === role.id))
      .map((user) => user.id)
    const currentlyAssignedSet = new Set(currentlyAssigned)
    
    if (selectedUserIds.size !== currentlyAssignedSet.size) return true
    
    for (const id of selectedUserIds) {
      if (!currentlyAssignedSet.has(id)) return true
    }
    for (const id of currentlyAssignedSet) {
      if (!selectedUserIds.has(id)) return true
    }
    return false
  }, [selectedUserIds, users, role.id])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Mitarbeiter zu Rolle zuweisen
          </DialogTitle>
          <DialogDescription>
            Weisen Sie Mitarbeiter der Rolle "{role.name}" zu. {assignedCount > 0 && `Aktuell ${assignedCount} zugewiesen.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 flex flex-col min-h-0">
          {/* Suche und Select All Controls */}
          <div className="space-y-2 flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Mitarbeiter suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isAssigning || filteredUsers.length === 0}
                >
                  Alle auswählen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  disabled={isAssigning || selectedUserIds.size === 0}
                >
                  Auswahl aufheben
                </Button>
              </div>
            </div>
            {searchQuery && (
              <div className="text-xs text-muted-foreground">
                {filteredUsers.length} Treffer
              </div>
            )}
          </div>

          {/* Mitarbeiter Checkliste */}
          <ScrollArea className="flex-1 border rounded-md">
            <div className="p-4 space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {searchQuery ? 'Keine Mitarbeiter gefunden' : 'Keine Mitarbeiter vorhanden'}
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isChecked = selectedUserIds.has(user.id)
                  return (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={isChecked}
                        onCheckedChange={() => handleToggleUser(user.id)}
                        disabled={isAssigning}
                      />
                      <Label
                        htmlFor={`user-${user.id}`}
                        className="flex-1 cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-medium">{user.email}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {user.is_superuser && (
                            <span className="px-2 py-0.5 rounded bg-muted">Admin</span>
                          )}
                          {!user.is_active && (
                            <span className="px-2 py-0.5 rounded bg-muted">Inaktiv</span>
                          )}
                        </div>
                      </Label>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>

          {/* Auswahl Info */}
          <div className="flex-shrink-0 text-sm text-muted-foreground pt-2 border-t">
            {selectedCount === 0 ? (
              'Keine Mitarbeiter ausgewählt'
            ) : (
              <span>
                {selectedCount} {selectedCount === 1 ? 'Mitarbeiter' : 'Mitarbeiter'} ausgewählt
              </span>
            )}
          </div>
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
            onClick={handleSave}
            disabled={isAssigning || !hasChanges}
          >
            {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Änderungen speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

