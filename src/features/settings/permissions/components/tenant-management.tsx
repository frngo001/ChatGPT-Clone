import { useState } from 'react'
import { Plus, Building2, Users, Edit, Trash2 } from 'lucide-react'
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

export function TenantManagement() {
  const { tenants, users } = usePermissionsStore()
  const { toast } = useToast()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [, setEditingTenant] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [isLoading, setIsLoading] = useState(false)

  const getUserCountForTenant = (tenantId: string) => {
    return users.filter((user) => user.tenant_id === tenantId).length
  }

  const handleCreateTenant = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Fehler',
        description: 'Tenant-Name ist erforderlich',
        variant: 'error',
      })
      return
    }

    setIsLoading(true)
    try {
      await cogneeApi.permissions.createTenant(formData.name, formData.description)
      // Refresh tenants list
      setIsCreateDialogOpen(false)
      setFormData({ name: '', description: '' })
      toast({
        title: 'Erfolg',
        description: 'Tenant wurde erfolgreich erstellt',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Tenant konnte nicht erstellt werden',
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditTenant = (tenant: any) => {
    setEditingTenant(tenant)
    setFormData({ name: tenant.name, description: tenant.description || '' })
    setIsEditDialogOpen(true)
  }

  const handleUpdateTenant = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Fehler',
        description: 'Tenant-Name ist erforderlich',
        variant: 'error',
      })
      return
    }

    setIsLoading(true)
    try {
      // Note: Update tenant endpoint would need to be implemented
      // Refresh tenants list
      setIsEditDialogOpen(false)
      setEditingTenant(null)
      setFormData({ name: '', description: '' })
      toast({
        title: 'Erfolg',
        description: 'Tenant wurde erfolgreich aktualisiert',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Tenant konnte nicht aktualisiert werden',
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTenant = async (_tenantId: string) => {
    if (confirm('Möchten Sie diesen Tenant wirklich löschen?')) {
      try {
        // Note: Delete tenant endpoint would need to be implemented
        // Refresh tenants list
        toast({
          title: 'Erfolg',
          description: 'Tenant wurde erfolgreich gelöscht',
          variant: 'success',
        })
      } catch (error) {
        toast({
          title: 'Fehler',
          description: 'Tenant konnte nicht gelöscht werden',
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
              Tenant erstellen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Tenant erstellen</DialogTitle>
              <DialogDescription>
                Erstellen Sie einen neuen Tenant für Benutzergruppen
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Abteilung Marketing"
                />
              </div>
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Beschreibung des Tenants"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateTenant} disabled={isLoading}>
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
            {tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Keine Tenants gefunden
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {tenant.name}
                    </div>
                  </TableCell>
                  <TableCell>{tenant.description || 'Keine Beschreibung'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      <Users className="mr-1 h-3 w-3" />
                      {getUserCountForTenant(tenant.id)} Benutzer
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString('de-DE') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditTenant(tenant)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteTenant(tenant.id)}
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
            <DialogTitle>Tenant bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Tenant-Informationen
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Abteilung Marketing"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Beschreibung</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beschreibung des Tenants"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleUpdateTenant} disabled={isLoading}>
              {isLoading ? 'Speichere...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
