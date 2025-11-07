import { useState, useMemo, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
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
import { DataTablePagination, DataTableColumnHeader } from '@/components/data-table'
import type { UserWithRoles } from '@/types/permissions'

export function UserManagementTable() {
  const { users, toggleUserRole, deleteUser, searchQuery, roleFilter, statusFilter, tenantFilter } = usePermissionsStore()
  const currentUser = useAuthStore((state) => state.auth.user)
  const { toast } = useToast()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  
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

  const columns = useMemo<ColumnDef<UserWithRoles>[]>(
    () => [
      {
        accessorKey: 'email',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="E-Mail" />
        ),
        cell: ({ row }) => {
          const user = row.original
          const isCurrentUser = user.id === currentUser?.id
          return (
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{user.email}</span>
              {isCurrentUser && (
                <Badge variant="outline" className="text-xs shrink-0">Du</Badge>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'is_superuser',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Rolle" />
        ),
        cell: ({ row }) => {
          const user = row.original
          return user.is_superuser ? (
            <Badge variant="default" className="text-xs">
              Admin
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              User
            </Badge>
          )
        },
      },
      {
        accessorKey: 'is_active',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const user = row.original
          return (
            <Badge variant="secondary" className="text-xs">
              {user.is_active ? 'Aktiv' : 'Inaktiv'}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'tenant',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tenant" />
        ),
        cell: ({ row }) => {
          const user = row.original
          return user.tenant ? (
            <Badge variant="outline" className="text-xs">
              <span className="truncate max-w-[100px]">{user.tenant.name}</span>
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Kein Tenant</span>
          )
        },
      },
      {
        accessorKey: 'roles',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Zusätzliche Rollen" />
        ),
        cell: ({ row }) => {
          const user = row.original
          return user.roles && user.roles.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {user.roles.map((role) => (
                <Badge key={role.id} variant="outline" className="text-xs">
                  {role.name}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )
        },
      },
      {
        accessorKey: 'is_verified',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Verifiziert" />
        ),
        cell: ({ row }) => {
          const user = row.original
          return (
            <Badge variant="secondary" className="text-xs">
              {user.is_verified ? 'Ja' : 'Nein'}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Erstellt" />
        ),
        cell: ({ row }) => {
          const user = row.original
          return (
            <span className="text-sm text-muted-foreground">
              {user.created_at ? new Date(user.created_at).toLocaleDateString('de-DE') : 'N/A'}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right font-semibold">Aktionen</div>,
        cell: ({ row }) => {
          const user = row.original
          const isAdmin = user.is_superuser
          const isCurrentUser = user.id === currentUser?.id
          
          return (
            <div className="text-right">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    disabled={actionLoading === user.id}
                  >
                    ⋯
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={2} className="w-56 animate-in fade-in-0 zoom-in-95 duration-50">
                  {!isCurrentUser && (
                    <>
                      <DropdownMenuItem 
                        onClick={() => handleToggleAdmin(user.id, isAdmin)}
                      >
                        {isAdmin ? 'Admin entfernen' : 'Zu Admin machen'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => openAssignTenantDialog(user.id, user.email, user.tenant_id)}
                      >
                        Tenant zuweisen
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => openAssignRoleDialog(user.id, user.email)}
                      >
                        Rolle zuweisen
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleToggleVerify(user.id, user.is_verified)}
                      >
                        {user.is_verified ? 'Entverifizieren' : 'Verifizieren'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => openDeleteDialog(user.id, user.email)}
                      >
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
          )
        },
      },
    ],
    [currentUser, actionLoading, handleToggleAdmin, handleToggleVerify, openAssignTenantDialog, openAssignRoleDialog, openDeleteDialog]
  )

  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
      columnVisibility: {
        roles: false,
        is_verified: false,
        created_at: false,
      },
    },
  })

  if (filteredUsers.length === 0) {
    return (
      <div className="p-12">
        <div className="flex flex-col items-center space-y-2">
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
                        ⋯
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={2} className="w-56 animate-in fade-in-0 zoom-in-95 duration-50">
                      {!isCurrentUser && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => handleToggleAdmin(user.id, isAdmin)}
                          >
                            {isAdmin ? 'Admin entfernen' : 'Zu Admin machen'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openAssignTenantDialog(user.id, user.email, user.tenant_id)}
                          >
                            Tenant zuweisen
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openAssignRoleDialog(user.id, user.email)}
                          >
                            Rolle zuweisen
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleToggleVerify(user.id, user.is_verified)}
                          >
                            {user.is_verified ? 'Entverifizieren' : 'Verifizieren'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => openDeleteDialog(user.id, user.email)}
                          >
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
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        User
                      </Badge>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge 
                      variant="secondary"
                      className="text-xs"
                    >
                      {user.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </div>
                </div>

                {/* Tenant and Roles */}
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tenant</p>
                    {user.tenant ? (
                      <Badge variant="outline" className="text-xs">
                        {user.tenant.name}
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
                    {user.is_verified ? 'Verifiziert' : 'Nicht verifiziert'}
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

      {/* Desktop/Tablet: Data Table Layout */}
      <div className="hidden md:block w-full space-y-4">
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="font-semibold">
                      {header.isPlaceholder
                        ? null
                        : header.column.columnDef.header && typeof header.column.columnDef.header === 'function'
                        ? header.column.columnDef.header(header.getContext())
                        : header.column.columnDef.header}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4">
                        {typeof cell.column.columnDef.cell === 'function'
                          ? cell.column.columnDef.cell(cell.getContext())
                          : cell.column.columnDef.cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Keine Ergebnisse gefunden.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} />
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
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
