import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { usePermissionsStore } from '@/stores/permissions-store'
import { Shield, Users, UserPlus } from 'lucide-react'
import { AssignUserToRoleDialog } from './assign-user-to-role-dialog'
import { useToast } from '@/hooks/use-sonner-toast'
import type { Role } from '@/types/permissions'

export function RolesList() {
  const { roles, users } = usePermissionsStore()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const { toast } = useToast()

  // Zähle User pro Rolle
  const getUsersForRole = (roleId: string) => {
    return users.filter((user) => user.roles.some((r) => r.id === roleId))
  }

  const handleAssignClick = (role: Role) => {
    setSelectedRole(role)
    setAssignDialogOpen(true)
  }

  if (roles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Shield className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Keine Rollen vorhanden</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          Erstellen Sie Ihre erste Rolle, um Berechtigungen zu gruppieren und Benutzern zuzuweisen.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role, index) => {
          const roleUsers = getUsersForRole(role.id)

          return (
            <div 
              key={role.id || `role-${index}`} 
              className="border rounded-lg p-4 hover:border-primary/50 transition-colors flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{role.name}</h4>
                  <Badge variant="outline" className="mt-1.5 text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {roleUsers.length}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              {role.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {role.description}
                </p>
              )}

              {/* User List */}
              {roleUsers.length > 0 && (
                <div className="space-y-2 mb-3">
                  <Separator />
                  <p className="text-xs font-medium text-muted-foreground">
                    Zugewiesene Benutzer:
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {roleUsers.map((user, userIndex) => (
                      <div
                        key={user.id || `user-${role.id}-${userIndex}`}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-muted/50"
                      >
                        <span className="truncate">{user.email}</span>
                        {user.is_superuser && (
                          <Badge variant="secondary" className="ml-2 text-xs shrink-0">
                            Admin
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-auto pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleAssignClick(role)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  User zuweisen
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Assign User Dialog */}
      {selectedRole && (
        <AssignUserToRoleDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          role={selectedRole}
        />
      )}
    </>
  )
}

