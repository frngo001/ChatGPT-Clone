import { useState, useMemo, useCallback } from 'react'
import { MoreHorizontal, Shield, ShieldOff, Trash2, CheckCircle, XCircle, Users, Crown, UserCheck, UserX, Building2, UserCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { usePermissionsStore } from '@/stores/permissions-store'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-sonner-toast'
import { cogneeApi } from '@/lib/api/cognee-api-client'
import { AssignTenantDialog } from './assign-tenant-dialog'
import { AssignRoleToUserDialog } from './assign-role-to-user-dialog'

export function UserManagementTable() {
  const { users, toggleUserRole, deleteUser, searchQuery, roleFilter, statusFilter, tenantFilter } = usePermissionsStore()
  // Optimize: Only subscribe to user data, not the entire auth object
  const currentUser = useAuthStore((state) => state.auth.user)
  const { toast } = useToast()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [assignTenantDialog, setAssignTenantDialog] = useState<{
    open: boolean
    userId: string
    userEmail: string
    currentTenantId?: string | null
  }>({
    open: false,
    userId: '',
    userEmail: '',
    currentTenantId: null,
  })
  const [assignRoleDialog, setAssignRoleDialog] = useState<{
    open: boolean
    userId: string
    userEmail: string
  }>({
    open: false,
    userId: '',
    userEmail: '',
  })
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    userId: string
    userEmail: string
  }>({
    open: false,
    userId: '',
    userEmail: '',
  })
  
  // Apply filters with memoization
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      if (searchQuery && !user.email.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      // Role filter
      if (roleFilter) {
        const hasRole = roleFilter === 'admin' ? user.is_superuser : !user.is_superuser
        if (!hasRole) return false
      }
      
      // Status filter
      if (statusFilter === 'active' && !user.is_active) return false
      if (statusFilter === 'inactive' && user.is_active) return false
      
      // Tenant filter
      if (tenantFilter) {
        if (tenantFilter === 'none' && user.tenant_id) return false
        if (tenantFilter !== 'none' && user.tenant_id !== tenantFilter) return false
      }
      
      return true
    })
  }, [users, searchQuery, roleFilter, statusFilter, tenantFilter])
  
  const handleToggleAdmin = useCallback(async (userId: string, isCurrentlyAdmin: boolean) => {
    setActionLoading(userId)
    try {
      // Toggle admin role via PATCH /v1/users/{id} with is_superuser
      await toggleUserRole(userId, isCurrentlyAdmin ? 'user' : 'admin')
      toast({
        title: 'Rolle geändert',
        description: isCurrentlyAdmin 
          ? 'User wurde Admin-Rechte entzogen' 
          : 'User wurde zu Admin gemacht',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Rolle konnte nicht geändert werden',
        variant: 'error',
      })
    } finally {
      setActionLoading(null)
    }
  }, [toggleUserRole, toast])
  
  const handleToggleVerify = useCallback(async (userId: string, isCurrentlyVerified: boolean) => {
    setActionLoading(userId)
    try {
      // Update user verification via PATCH /v1/users/{id}
      await cogneeApi.users.updateUser(userId, { is_verified: !isCurrentlyVerified })
      await usePermissionsStore.getState().fetchAllUsers()
      toast({
        title: 'Verifizierung geändert',
        description: isCurrentlyVerified 
          ? 'User wurde entverifiziert' 
          : 'User wurde verifiziert',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Verifizierung konnte nicht geändert werden',
        variant: 'error',
      })
    } finally {
      setActionLoading(null)
    }
  }, [toast])
  
  const openDeleteDialog = useCallback((userId: string, userEmail: string) => {
    setDeleteDialog({
      open: true,
      userId,
      userEmail,
    })
  }, [])

  const handleDeleteUser = useCallback(async () => {
    const { userId } = deleteDialog
    setActionLoading(userId)
    setDeleteDialog({ ...deleteDialog, open: false })
    
    try {
      // Delete user via DELETE /v1/users/{id}
      await deleteUser(userId)
      toast({
        title: 'User gelöscht',
        description: 'User wurde erfolgreich gelöscht',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'User konnte nicht gelöscht werden',
        variant: 'error',
      })
    } finally {
      setActionLoading(null)
    }
  }, [deleteDialog, deleteUser, toast])
  
  const openAssignTenantDialog = useCallback((userId: string, userEmail: string, currentTenantId?: string | null) => {
    setAssignTenantDialog({
      open: true,
      userId,
      userEmail,
      currentTenantId,
    })
  }, [])

  const openAssignRoleDialog = useCallback((userId: string, userEmail: string) => {
    setAssignRoleDialog({
      open: true,
      userId,
      userEmail,
    })
  }, [])

  if (filteredUsers.length === 0) {
    return (
      <div className="p-12">
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 rounded-full bg-muted">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Keine User gefunden</p>
          <p className="text-sm text-muted-foreground">
            Versuchen Sie andere Suchkriterien oder Filter
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <>
      {/* Mobile: Card Layout */}
      <div className="block md:hidden space-y-3">
        {filteredUsers.map((user) => {
            const isAdmin = user.is_superuser
            const isCurrentUser = user.id === currentUser?.id
            
            return (
            <Card key={user.id}>
              <CardContent className="p-4 space-y-3">
                {/* Email and Current User Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-medium truncate">{user.email}</span>
                    {isCurrentUser && (
                      <Badge variant="outline" className="text-xs shrink-0">Du</Badge>
                    )}
                  </div>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={actionLoading === user.id}
                        className="shrink-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={2} className="w-56 animate-in fade-in-0 zoom-in-95 duration-100">
                      {!isCurrentUser && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => handleToggleAdmin(user.id, isAdmin)}
                          >
                            {isAdmin ? (
                              <>
                                <ShieldOff className="mr-2 h-4 w-4" />
                                Admin entfernen
                              </>
                            ) : (
                              <>
                                <Shield className="mr-2 h-4 w-4" />
                                Zu Admin machen
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openAssignTenantDialog(user.id, user.email, user.tenant_id)}
                          >
                            <Building2 className="mr-2 h-4 w-4" />
                            Tenant zuweisen
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openAssignRoleDialog(user.id, user.email)}
                          >
                            <UserCog className="mr-2 h-4 w-4" />
                            Rolle zuweisen
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleToggleVerify(user.id, user.is_verified)}
                          >
                            {user.is_verified ? (
                              <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Entverifizieren
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Verifizieren
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => openDeleteDialog(user.id, user.email)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            User löschen
                          </DropdownMenuItem>
                        </>
                      )}
                      {isCurrentUser && (
                        <DropdownMenuItem disabled>
                          Keine Aktionen für eigenen Account
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Badges Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Rolle</p>
                    {user.is_superuser ? (
                      <Badge variant="default" className="text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        User
                      </Badge>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge 
                      variant={user.is_active ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {user.is_active ? (
                        <>
                          <UserCheck className="h-3 w-3 mr-1" />
                          Aktiv
                        </>
                      ) : (
                        <>
                          <UserX className="h-3 w-3 mr-1" />
                          Inaktiv
                        </>
                      )}
                    </Badge>
                  </div>
                </div>

                {/* Tenant and Roles */}
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tenant</p>
                    {user.tenant ? (
                      <Badge variant="outline" className="text-xs">
                        <Building2 className="h-3 w-3 mr-1" />
                        {user.tenant.name}
                        {user.tenant.owner_id === user.id && (
                          <Crown className="h-3 w-3 ml-1" />
                        )}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Kein Tenant</span>
                    )}
                  </div>

                  {user.roles && user.roles.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Zusätzliche Rollen</p>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role.id} variant="outline" className="text-xs">
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    {user.is_verified ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Verifiziert
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        Nicht verifiziert
                      </>
                    )}
                  </div>
                  <span>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('de-DE') : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Desktop/Tablet: Table Layout */}
      <div className="hidden md:block w-full border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="font-semibold">E-Mail</TableHead>
              <TableHead className="font-semibold">Rolle</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Tenant</TableHead>
              <TableHead className="font-semibold hidden lg:table-cell">Zusätzliche Rollen</TableHead>
              <TableHead className="font-semibold hidden lg:table-cell">Verifiziert</TableHead>
              <TableHead className="font-semibold hidden lg:table-cell">Erstellt</TableHead>
              <TableHead className="text-right font-semibold">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const isAdmin = user.is_superuser
                const isCurrentUser = user.id === currentUser?.id
                
                return (
                  <TableRow key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium py-4">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{user.email}</span>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs shrink-0">Du</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {user.is_superuser ? (
                        <Badge variant="default" className="text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          User
                        </Badge>
                      )}
                </TableCell>
                    <TableCell className="py-4">
                  <Badge 
                    variant={user.is_active ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {user.is_active ? (
                      <>
                        <UserCheck className="h-3 w-3 mr-1" />
                        Aktiv
                      </>
                    ) : (
                      <>
                        <UserX className="h-3 w-3 mr-1" />
                        Inaktiv
                      </>
                    )}
                  </Badge>
                </TableCell>
                    <TableCell className="py-4">
                      {user.tenant ? (
                        <Badge variant="outline" className="text-xs">
                          <Building2 className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-[100px]">{user.tenant.name}</span>
                          {user.tenant.owner_id === user.id && (
                            <Crown className="h-3 w-3 ml-1" aria-label="Tenant Owner" />
                          )}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Kein Tenant</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 hidden lg:table-cell">
                      {user.roles && user.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <Badge key={role.id} variant="outline" className="text-xs">
                              {role.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 hidden lg:table-cell">
                  <Badge 
                    variant={user.is_verified ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {user.is_verified ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                            Ja
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                            Nein
                      </>
                    )}
                  </Badge>
                </TableCell>
                    <TableCell className="py-4 text-sm text-muted-foreground hidden lg:table-cell">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('de-DE') : 'N/A'}
                </TableCell>
                    <TableCell className="py-4 text-right">
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={actionLoading === user.id}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={2} className="w-56 animate-in fade-in-0 zoom-in-95 duration-100">
                    {!isCurrentUser && (
                      <>
                        <DropdownMenuItem 
                          onClick={() => handleToggleAdmin(user.id, isAdmin)}
                        >
                          {isAdmin ? (
                            <>
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Admin entfernen
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" />
                              Zu Admin machen
                            </>
                          )}
                        </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openAssignTenantDialog(user.id, user.email, user.tenant_id)}
                              >
                                <Building2 className="mr-2 h-4 w-4" />
                                Tenant zuweisen
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openAssignRoleDialog(user.id, user.email)}
                              >
                                <UserCog className="mr-2 h-4 w-4" />
                                Rolle zuweisen
                              </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleToggleVerify(user.id, user.is_verified)}
                        >
                          {user.is_verified ? (
                            <>
                              <XCircle className="mr-2 h-4 w-4" />
                              Entverifizieren
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Verifizieren
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => openDeleteDialog(user.id, user.email)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          User löschen
                        </DropdownMenuItem>
                      </>
                    )}
                    {isCurrentUser && (
                      <DropdownMenuItem disabled>
                        Keine Aktionen für eigenen Account
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
              })}
      </TableBody>
    </Table>
    </div>

      {/* Assign Tenant Dialog */}
      <AssignTenantDialog
        userId={assignTenantDialog.userId}
        userEmail={assignTenantDialog.userEmail}
        currentTenantId={assignTenantDialog.currentTenantId}
        open={assignTenantDialog.open}
        onOpenChange={(open) => setAssignTenantDialog({ ...assignTenantDialog, open })}
      />

      {/* Assign Role Dialog */}
      <AssignRoleToUserDialog
        userId={assignRoleDialog.userId}
        userEmail={assignRoleDialog.userEmail}
        open={assignRoleDialog.open}
        onOpenChange={(open) => setAssignRoleDialog({ ...assignRoleDialog, open })}
      />

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>User löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Benutzer <strong className="text-foreground">{deleteDialog.userEmail}</strong> wirklich löschen?
              <br />
              <br />
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten des Benutzers werden permanent gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
