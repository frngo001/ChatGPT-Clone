import { useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Shield } from 'lucide-react'
import { usePermissionsStore } from '@/stores/permissions-store'
import { useAuthStore } from '@/stores/auth-store'
import { UserManagementTable } from './components/user-management-table'
import { UserFilters } from './components/user-filters'
import { RoleManagement } from './components/role-management'
import { DatasetPermissionsDialog } from './components/dataset-permissions-dialog'
import { CreateTenantDialog } from './components/create-tenant-dialog'

export function PermissionsSettings() {
  // Optimize: Only subscribe to isAdmin function, not the entire auth object
  const isAdmin = useAuthStore((state) => state.auth.isAdmin)
  // Selektive Store-Selektoren: Nur benötigte Properties abonnieren
  const users = usePermissionsStore((state) => state.users)
  const isLoading = usePermissionsStore((state) => state.isLoading)
  const fetchAllUsers = usePermissionsStore((state) => state.fetchAllUsers)
  const fetchRoles = usePermissionsStore((state) => state.fetchRoles)
  
  const [roleManagementDialogOpen, setRoleManagementDialogOpen] = useState(false)
  const [datasetPermissionsDialogOpen, setDatasetPermissionsDialogOpen] = useState(false)
  const [createTenantDialogOpen, setCreateTenantDialogOpen] = useState(false)
  
  // Request-Deduplizierung: Nur fetchen wenn noch keine Users vorhanden sind
  useEffect(() => {
    if (isAdmin()) {
      // Skip Fetch wenn bereits Users vorhanden (verhindert duplizierte Calls)
      if (users.length === 0 && !isLoading) {
        fetchAllUsers().catch(error => {
          console.error('Failed to fetch users:', error)
        })
      }
      fetchRoles().catch(error => {
        console.error('Failed to fetch roles:', error)
      })
    }
  }, [isAdmin, users.length, isLoading, fetchAllUsers, fetchRoles])
  
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
    <div className="space-y-6 md:space-y-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between md:items-start w-full">
        <div>
          <h3 className="text-lg md:text-base font-medium">Berechtigungen</h3>
          <p className="text-sm md:text-xs text-muted-foreground">
            Verwalten Sie Benutzer, Rollen und Zugriffsrechte
          </p>
        </div>
        <div className="flex gap-2 md:gap-1.5">
          <Button variant="outline" size="sm" onClick={() => setRoleManagementDialogOpen(true)} className="md:h-8 md:px-3 md:text-xs">
            Rollen verwalten
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCreateTenantDialogOpen(true)} className="md:h-8 md:px-3 md:text-xs">
            Tenant erstellen
          </Button>
          <Button size="sm" onClick={() => setDatasetPermissionsDialogOpen(true)} className="md:h-8 md:px-3 md:text-xs">
            Berechtigung vergeben
          </Button>
        </div>
      </div>

      {/* User Management */}
      <div className="space-y-4 md:space-y-3 w-full">
        <UserFilters />
        <ScrollArea className="w-full h-[600px] md:h-[calc(100svh-220px)]">
          <div className="w-full">
            <UserManagementTable />
          </div>
        </ScrollArea>
      </div>

      {/* Dialogs */}
      <Dialog open={roleManagementDialogOpen} onOpenChange={setRoleManagementDialogOpen}>
        <DialogContent className="!max-w-[100vw] !w-[30vw] sm:!max-w-[30vw] sm:!w-[30vw] md:!max-w-[28vw] md:!w-[28vw] lg:!max-w-[50vw] lg:!w-[28vw] xl:!max-w-[28vw] xl:!w-[28vw] max-h-[98vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Rollen verwalten</DialogTitle>
            <DialogDescription className="text-sm">
              Erstellen, bearbeiten und verwalten Sie Rollen und weisen Sie Mitarbeiter zu.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 flex-1 overflow-y-auto">
            <RoleManagement />
          </div>
        </DialogContent>
      </Dialog>
      <CreateTenantDialog open={createTenantDialogOpen} onOpenChange={setCreateTenantDialogOpen} />
      <DatasetPermissionsDialog open={datasetPermissionsDialogOpen} onOpenChange={setDatasetPermissionsDialogOpen} />
    </div>
  )
}

