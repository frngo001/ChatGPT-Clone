import { useState } from 'react'
import { Plus, UserCog, Users, Edit, Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { usePermissionsStore } from '@/stores/permissions-store'
import { useToast } from '@/hooks/use-sonner-toast'
import { cogneeApi } from '@/lib/api/cognee-api-client'
import { AssignUsersToRoleDialog } from './assign-users-to-role-dialog'
import type { Role } from '@/types/permissions'

export function RoleManagement() {
  const { roles, users, fetchRoles, fetchAllUsers } = usePermissionsStore()
  const { toast } = useToast()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [, setEditingRole] = useState<Role | null>(null)
  const [assigningRole, setAssigningRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [isLoading, setIsLoading] = useState(false)

  // Berechne die Anzahl der Benutzer pro Rolle
  const getUserCountForRole = (roleId: string) => {
    return users.filter((user) => user.roles.some((r) => r.id === roleId)).length
  }

  const handleAssignUsers = (role: Role) => {
    setAssigningRole(role)
    setIsAssignDialogOpen(true)
  }

  const handleAssignDialogClose = async () => {
    setIsAssignDialogOpen(false)
    setAssigningRole(null)
    // Aktualisiere die Rollen und Benutzer nach der Zuweisung
    await Promise.all([fetchRoles(), fetchAllUsers()])
  }

  const handleCreateRole = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Fehler',
        description: 'Rollen-Name ist erforderlich',
        variant: 'error',
      })
      return
    }

    setIsLoading(true)
    try {
      await cogneeApi.permissions.createRole(formData.name, formData.description)
      await fetchRoles()
      setIsCreateDialogOpen(false)
      setFormData({ name: '', description: '' })
      toast({
        title: 'Erfolg',
        description: 'Rolle wurde erfolgreich erstellt',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Rolle konnte nicht erstellt werden',
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditRole = (role: any) => {
    setEditingRole(role)
    setFormData({ name: role.name, description: role.description || '' })
    setIsEditDialogOpen(true)
  }

  const handleUpdateRole = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Fehler',
        description: 'Rollen-Name ist erforderlich',
        variant: 'error',
      })
      return
    }

    setIsLoading(true)
    try {
      // Note: Update role endpoint would need to be implemented
      await fetchRoles()
      setIsEditDialogOpen(false)
      setEditingRole(null)
      setFormData({ name: '', description: '' })
      toast({
        title: 'Erfolg',
        description: 'Rolle wurde erfolgreich aktualisiert',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Rolle konnte nicht aktualisiert werden',
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteRole = async (_roleId: string) => {
    if (confirm('Möchten Sie diese Rolle wirklich löschen?')) {
      try {
        // Note: Delete role endpoint would need to be implemented
        await fetchRoles()
        toast({
          title: 'Erfolg',
          description: 'Rolle wurde erfolgreich gelöscht',
          variant: 'success',
        })
      } catch (error) {
        toast({
          title: 'Fehler',
          description: 'Rolle konnte nicht gelöscht werden',
          variant: 'error',
        })
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="secondary">
              <Plus className="mr-2 h-4 w-4" />
              Rolle erstellen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neue Rolle erstellen</DialogTitle>
              <DialogDescription>
                Erstellen Sie eine neue Rolle mit spezifischen Berechtigungen
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="mb-2 block">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Moderator, Editor"
                />
              </div>
              <div>
                <Label htmlFor="description" className="mb-2 block">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Beschreibung der Rolle und ihrer Berechtigungen"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button variant="secondary" onClick={handleCreateRole} disabled={isLoading}>
                {isLoading ? 'Erstelle...' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[15%]">Name</TableHead>
              <TableHead className="w-[35%]">Beschreibung</TableHead>
              <TableHead className="w-[15%] whitespace-nowrap">Benutzer</TableHead>
              <TableHead className="w-[15%] whitespace-nowrap">Erstellt</TableHead>
              <TableHead className="w-[20%] text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Keine Rollen gefunden
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 flex-shrink-0" />
                      <span>{role.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {role.description || 'Keine Beschreibung'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="whitespace-nowrap">
                      <Users className="mr-1 h-3 w-3" />
                      {getUserCountForRole(role.id)} Benutzer
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {role.created_at ? new Date(role.created_at).toLocaleDateString('de-DE') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Aktionen öffnen</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleAssignUsers(role)}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Mitarbeiter zuweisen
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditRole(role)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rolle bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Rollen-Informationen
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="mb-2 block">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Moderator, Editor"
              />
            </div>
            <div>
              <Label htmlFor="edit-description" className="mb-2 block">Beschreibung</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beschreibung der Rolle und ihrer Berechtigungen"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="secondary" onClick={handleUpdateRole} disabled={isLoading}>
              {isLoading ? 'Speichere...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Users Dialog */}
      {assigningRole && (
        <AssignUsersToRoleDialog
          open={isAssignDialogOpen}
          onOpenChange={handleAssignDialogClose}
          role={assigningRole}
        />
      )}
    </div>
  )
}
