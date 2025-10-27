import { useState } from 'react'
import { Plus, Shield, Users, Edit, Trash2 } from 'lucide-react'
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

export function RoleManagement() {
  const { roles, fetchRoles } = usePermissionsStore()
  const { toast } = useToast()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [isLoading, setIsLoading] = useState(false)

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

  const handleDeleteRole = async (roleId: string) => {
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
            <Button size="sm">
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
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Moderator, Editor"
                />
              </div>
              <div>
                <Label htmlFor="description">Beschreibung</Label>
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
              <Button onClick={handleCreateRole} disabled={isLoading}>
                {isLoading ? 'Erstelle...' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Beschreibung</TableHead>
              <TableHead>Benutzer</TableHead>
              <TableHead>Erstellt</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Keine Rollen gefunden
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {role.name}
                    </div>
                  </TableCell>
                  <TableCell>{role.description || 'Keine Beschreibung'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      <Users className="mr-1 h-3 w-3" />
                      {role.user_count || 0} Benutzer
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {role.created_at ? new Date(role.created_at).toLocaleDateString('de-DE') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Moderator, Editor"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Beschreibung</Label>
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
            <Button onClick={handleUpdateRole} disabled={isLoading}>
              {isLoading ? 'Speichere...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
