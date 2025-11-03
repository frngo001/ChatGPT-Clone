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
  const { shareDatasetWithUser, shareDatasetWithTenant } = useDatasetStore()
  const { tenant, users, fetchAllUsers } = usePermissionsStore()
  const { auth } = useAuthStore()
  const { toast } = useToast()
  const [isSharing, setIsSharing] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [shareWithTenant, setShareWithTenant] = useState(false)
  
  // Lade Nutzer beim Öffnen
  useEffect(() => {
    if (open) {
      if (users.length === 0) {
        fetchAllUsers().catch(error => {
          console.error('Failed to fetch users:', error)
        })
      }
      setSelectedUserIds(new Set())
      setSearchQuery('')
      setShareWithTenant(false)
    }
  }, [open, users.length, fetchAllUsers])

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
      // Teile mit Tenant, wenn ausgewählt
      if (shareWithTenant && tenant) {
        await shareDatasetWithTenant(datasetId, tenant.id)
      }
      
      // Teile mit ausgewählten Nutzern
      const sharePromises = Array.from(selectedUserIds).map(userId =>
        shareDatasetWithUser(datasetId, userId)
      )
      
      await Promise.all(sharePromises)
      
      const userCount = selectedUserIds.size
      const tenantText = shareWithTenant ? ' mit allen Nutzern' : ''
      const usersText = userCount > 0 ? ` mit ${userCount} ${userCount === 1 ? 'Nutzer' : 'Nutzern'}` : ''
      
      toast({ 
        title: 'Dataset geteilt', 
        description: `"${datasetName}" wurde${tenantText}${usersText} geteilt (Read-Only)`,
        variant: 'success' 
      })
      onOpenChange(false)
    } catch (error) {
      toast({ 
        title: 'Fehler beim Teilen', 
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'error' 
      })
    } finally {
      setIsSharing(false)
    }
  }
  
  const hasSelection = selectedUserIds.size > 0 || shareWithTenant
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Dataset teilen</DialogTitle>
          <DialogDescription>
            Wählen Sie Nutzer aus, mit denen Sie das Dataset "{datasetName}" teilen möchten.
            Alle geteilten Nutzer erhalten Read-Only-Zugriff.
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
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    {searchQuery ? 'Keine Nutzer gefunden' : 'Keine Nutzer verfügbar'}
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                      onClick={() => !isSharing && handleToggleUser(user.id)}
                    >
                      <Checkbox
                        checked={selectedUserIds.has(user.id)}
                        onCheckedChange={() => handleToggleUser(user.id)}
                        disabled={isSharing}
                      />
                      <div className="flex-1 flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user.email}</span>
                        {user.is_superuser && (
                          <span className="text-xs text-muted-foreground">(Admin)</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSharing}>
              Abbrechen
            </Button>
            <Button onClick={handleShare} disabled={isSharing || !hasSelection}>
              {isSharing ? (
                <>
                  <span className="mr-2">Wird geteilt...</span>
                </>
              ) : (
                <>
                  {selectedUserIds.size > 0 && (
                    <span className="mr-2">({selectedUserIds.size})</span>
                  )}
                  Teilen
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

