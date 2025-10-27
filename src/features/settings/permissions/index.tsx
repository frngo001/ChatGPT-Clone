import { useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Shield } from 'lucide-react'
import { usePermissionsStore } from '@/stores/permissions-store'
import { useAuthStore } from '@/stores/auth-store'
import { UserManagementTable } from './components/user-management-table'
import { UserFilters } from './components/user-filters'
import { CreateRoleDialog } from './components/create-role-dialog'
import { DatasetPermissionsDialog } from './components/dataset-permissions-dialog'

export function PermissionsSettings() {
  // Optimize: Only subscribe to isAdmin function, not the entire auth object
  const isAdmin = useAuthStore((state) => state.auth.isAdmin)
  const { fetchAllUsers, fetchRoles } = usePermissionsStore()
  
  const [createRoleDialogOpen, setCreateRoleDialogOpen] = useState(false)
  const [datasetPermissionsDialogOpen, setDatasetPermissionsDialogOpen] = useState(false)
  
  useEffect(() => {
    if (isAdmin()) {
      fetchAllUsers()
      fetchRoles()
    }
  }, [isAdmin, fetchAllUsers, fetchRoles])
  
  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 rounded-full bg-muted">
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Zugriff verweigert</h3>
                <p className="text-sm text-muted-foreground">
                  Nur Administratoren haben Zugriff auf diese Seite.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Berechtigungen</h3>
          <p className="text-sm text-muted-foreground">
            Verwalten Sie Benutzer, Rollen und Zugriffsrechte
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCreateRoleDialogOpen(true)}>
            Rollen verwalten
          </Button>
          <Button size="sm" onClick={() => setDatasetPermissionsDialogOpen(true)}>
            Berechtigung vergeben
          </Button>
        </div>
      </div>

      {/* User Management */}
      <div className="space-y-4">
        <UserFilters />
        <ScrollArea className="h-[600px]">
          <UserManagementTable />
        </ScrollArea>
      </div>

      {/* Dialogs */}
      <CreateRoleDialog open={createRoleDialogOpen} onOpenChange={setCreateRoleDialogOpen} />
      <DatasetPermissionsDialog open={datasetPermissionsDialogOpen} onOpenChange={setDatasetPermissionsDialogOpen} />
    </div>
  )
}

