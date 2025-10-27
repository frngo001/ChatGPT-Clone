export interface Tenant {
  id: string
  name: string
  owner_id?: string
  description?: string
  created_at: string
  updated_at?: string | null
}

export interface Role {
  id: string
  name: string
  tenant_id: string
  description?: string
  created_at: string
}

export interface User {
  id: string
  email: string
  tenant_id?: string | null
  is_active: boolean
  is_superuser: boolean
  is_verified: boolean
  created_at?: string
  updated_at?: string | null
}

export interface UserWithRoles {
  id: string
  email: string
  tenant_id?: string | null
  tenant?: Tenant | null
  roles: Role[]
  is_active: boolean
  is_superuser: boolean
  is_verified: boolean
  created_at?: string
  updated_at?: string | null
}

export interface DatasetPermission {
  dataset_id: string
  principal_id: string
  principal_type: 'user' | 'role' | 'tenant'
  permission: 'read' | 'write' | 'delete' | 'share'
  granted_at: string
}

export type PermissionType = 'read' | 'write' | 'delete' | 'share'
export type PrincipalType = 'user' | 'role' | 'tenant'

export interface UpdateUserPayload {
  email?: string
  is_active?: boolean
  is_superuser?: boolean
  is_verified?: boolean
}

