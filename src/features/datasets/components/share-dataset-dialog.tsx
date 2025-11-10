import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useDatasetStore } from '@/stores/dataset-store'
import { usePermissionsStore } from '@/stores/permissions-store'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-sonner-toast'
import { Search, X, Users, User } from 'lucide-react'

interface ShareDatasetDialogProps {
  datasetId: string
  datasetName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareDatasetDialog({
  datasetId,
  datasetName,
  open,
  onOpenChange
}: ShareDatasetDialogProps) {
  const { shareDatasetWithUser, shareDatasetWithTenant, fetchDatasetPermissions, revokeDatasetPermission } = useDatasetStore()
  const { tenant, users, fetchAllUsers } = usePermissionsStore()
  const { auth } = useAuthStore()
  const { toast } = useToast()
  const [isSharing, setIsSharing] = useState(false)
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [usersWithPermissions, setUsersWithPermissions] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [shareWithTenant, setShareWithTenant] = useState(false)

  // Lade Nutzer und bestehende Berechtigungen beim Öffnen
  useEffect(() => {
    if (open) {
      // Fetch users if not already loaded
      if (users.length === 0) {
        fetchAllUsers().catch(error => {
          console.error('Failed to fetch users:', error)
        })
      }

      // Fetch existing dataset permissions
      setIsLoadingPermissions(true)
      fetchDatasetPermissions(datasetId)
        .then(userIds => {
          const permissionsSet = new Set(userIds)
          setUsersWithPermissions(permissionsSet)
          setSelectedUserIds(permissionsSet) // Pre-check users with existing permissions
        })
        .catch(error => {
          console.error('Failed to fetch dataset permissions:', error)
        })
        .finally(() => {
          setIsLoadingPermissions(false)
        })

      setSearchQuery('')
      setShareWithTenant(false)
    }
  }, [open, users.length, fetchAllUsers, datasetId, fetchDatasetPermissions])

  // Filtere Nutzer: Entferne den aktuellen Nutzer und filtere nach Suchanfrage
  const filteredUsers = useMemo(() => {
    const currentUserId = auth.user?.id
    let filtered = users.filter((user) => user.id !== currentUserId && user.is_active)
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((user) => 
        user.email.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [users, searchQuery, auth.user?.id])

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

  const handleShare = async () => {
    setIsSharing(true)
    try {
      // Calculate changes
      const usersToGrant = Array.from(selectedUserIds).filter(
        userId => !usersWithPermissions.has(userId)
      )
      const usersToRevoke = Array.from(usersWithPermissions).filter(
        userId => !selectedUserIds.has(userId)
      )

      // Teile mit Tenant, wenn ausgewählt
      if (shareWithTenant && tenant) {
        await shareDatasetWithTenant(datasetId, tenant.id)
      }

      // Grant permissions to newly selected users
      const grantPromises = usersToGrant.map(userId =>
        shareDatasetWithUser(datasetId, userId)
      )

      // Revoke permissions from unchecked users
      const revokePromises = usersToRevoke.map(userId =>
        revokeDatasetPermission(datasetId, userId)
      )

      await Promise.all([...grantPromises, ...revokePromises])

      // Build success message
      const parts = []
      if (shareWithTenant) {
        parts.push('mit allen Nutzern geteilt')
      }
      if (usersToGrant.length > 0) {
        parts.push(`${usersToGrant.length} ${usersToGrant.length === 1 ? 'Nutzer' : 'Nutzern'} hinzugefügt`)
      }
      if (usersToRevoke.length > 0) {
        parts.push(`${usersToRevoke.length} ${usersToRevoke.length === 1 ? 'Nutzer' : 'Nutzern'} entfernt`)
      }

      const description = parts.length > 0
        ? `"${datasetName}": ${parts.join(', ')}`
        : `"${datasetName}" - Keine Änderungen`

      toast({
        title: 'Berechtigungen aktualisiert',
        description,
        variant: 'success'
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Fehler beim Aktualisieren',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'error'
      })
    } finally {
      setIsSharing(false)
    }
  }
  
  // Check if there are any changes to save
  const hasChanges = useMemo(() => {
    // Check if sharing with tenant
    if (shareWithTenant) return true

    // Check if any users were added or removed
    const usersToGrant = Array.from(selectedUserIds).filter(
      userId => !usersWithPermissions.has(userId)
    )
    const usersToRevoke = Array.from(usersWithPermissions).filter(
      userId => !selectedUserIds.has(userId)
    )

    return usersToGrant.length > 0 || usersToRevoke.length > 0
  }, [selectedUserIds, usersWithPermissions, shareWithTenant])
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Dataset teilen</DialogTitle>
          <DialogDescription>
            Wählen Sie Nutzer aus, mit denen Sie das Dataset "{datasetName}" teilen möchten.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Option: Mit allen Nutzern teilen (Tenant) */}
          {tenant && (
            <div className="space-y-2 flex-shrink-0">
              <div className="flex items-center space-x-2 p-3 border rounded-md">
                <Checkbox
                  id="share-with-tenant"
                  checked={shareWithTenant}
                  onCheckedChange={(checked) => setShareWithTenant(checked === true)}
                  disabled={isSharing}
                />
                <Label 
                  htmlFor="share-with-tenant" 
                  className="flex-1 cursor-pointer flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Mit allen Nutzern teilen (gesamter Tenant)</span>
                </Label>
              </div>
            </div>
          )}

          <Separator />

          {/* Nutzer-Auswahl */}
          <div className="space-y-2 flex-1 flex flex-col min-h-0">
            <Label>Mit einzelnen Nutzern teilen</Label>
            
            {/* Suche */}
            <div className="relative flex-shrink-0">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Nutzer suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                disabled={isSharing}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                  onClick={() => setSearchQuery('')}
                  disabled={isSharing}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Nutzer-Liste */}
            <ScrollArea className="flex-1 border rounded-md">
              <div className="p-2 space-y-1">
                {isLoadingPermissions ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Lade Berechtigungen...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    {searchQuery ? 'Keine Nutzer gefunden' : 'Keine Nutzer verfügbar'}
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    return (
                      <div
                        key={user.id}
                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                        onClick={() => !isSharing && !isLoadingPermissions && handleToggleUser(user.id)}
                      >
                        <Checkbox
                          checked={selectedUserIds.has(user.id)}
                          onCheckedChange={() => handleToggleUser(user.id)}
                          disabled={isSharing || isLoadingPermissions}
                        />
                        <div className="flex-1 flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{user.email}</span>
                          {user.is_superuser && (
                            <span className="text-xs text-muted-foreground">(Admin)</span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSharing}>
              Abbrechen
            </Button>
            <Button onClick={handleShare} disabled={isSharing || isLoadingPermissions || !hasChanges}>
              {isSharing ? (
                <>
                  <span className="mr-2">Wird aktualisiert...</span>
                </>
              ) : (
                <>
                  Speichern
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

