import { create } from 'zustand'
import { cogneeApi } from '@/lib/api/cognee-api-client'
import type { Tenant, Role, UserWithRoles, UpdateUserPayload, PermissionType, PrincipalType } from '@/types/permissions'

interface PermissionsStore {
  tenant: Tenant | null
  tenants: Tenant[]
  roles: Role[]
  users: UserWithRoles[]
  isLoading: boolean
  error: string | null
  pendingFetchAllUsers: Promise<void> | null // Request-Deduplizierung
  pendingFetchRoles: Promise<void> | null // Request-Deduplizierung für Rollen
  
  // New: User Management
  searchQuery: string
  roleFilter: string | null
  statusFilter: 'all' | 'active' | 'inactive'
  tenantFilter: string | null
  
  // Actions
  initializeTenant: (name: string) => Promise<void>
  fetchTenant: () => Promise<void>
  fetchUsers: () => Promise<void>
  fetchRoles: () => Promise<void>
  createRole: (name: string, description?: string) => Promise<void>
  assignRoleToUser: (userId: string, roleId: string) => Promise<void>
  addUserToTenant: (userId: string) => Promise<void>
  clearError: () => void
  
  // New: User Management Actions
  fetchAllUsers: () => Promise<void>
  updateUser: (userId: string, payload: UpdateUserPayload) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  removeUserFromRole: (userId: string, roleId: string) => Promise<void>
  removeUserFromTenant: (userId: string, tenantId: string) => Promise<void>
  toggleUserRole: (userId: string, roleName: 'admin' | 'user') => Promise<void>
  assignTenantToUser: (userId: string, tenantId: string) => Promise<void>
  assignUserToRole: (userId: string, roleId: string) => Promise<void>
  assignUsersToRole: (userIds: string[], roleId: string) => Promise<void>
  giveDatasetPermission: (payload: {
    dataset_ids: string[]
    principal_id: string
    principal_type: PrincipalType
    permission_type: PermissionType
  }) => Promise<void>
  setSearchQuery: (query: string) => void
  setRoleFilter: (role: string | null) => void
  setStatusFilter: (status: 'all' | 'active' | 'inactive') => void
  setTenantFilter: (tenantId: string | null) => void
}

export const usePermissionsStore = create<PermissionsStore>()((set, get) => ({
  tenant: null,
  tenants: [],
  roles: [],
  users: [],
  isLoading: false,
  error: null,
  pendingFetchAllUsers: null, // Request-Deduplizierung
  pendingFetchRoles: null, // Request-Deduplizierung für Rollen
  
  // New: User Management State
  searchQuery: '',
  roleFilter: null,
  statusFilter: 'all',
  tenantFilter: null,
  
  initializeTenant: async (name: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await cogneeApi.permissions.createTenant(name, `Firma: ${name}`)
      set({ tenant: response.data, isLoading: false })
      
      // Create admin and user roles
      await get().createRole('admin', 'Administrator mit vollen Rechten')
      await get().createRole('user', 'Standard-User mit eingeschränkten Rechten')
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to initialize tenant',
        isLoading: false 
      })
      throw error
    }
  },
  
  fetchTenant: async () => {
    set({ isLoading: true, error: null })
    try {
      // TODO: Implement fetch tenant from Cognee API
      // For now, get from localStorage
      const tenantId = localStorage.getItem('cognee_tenant_id')
      if (tenantId) {
        // Placeholder - would fetch from API
        set({ isLoading: false })
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch tenant',
        isLoading: false 
      })
    }
  },
  
  fetchUsers: async () => {
    set({ isLoading: true, error: null })
    try {
      // TODO: Implement fetch users from Cognee API
      set({ users: [], isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch users',
        isLoading: false 
      })
    }
  },
  
  createRole: async (name: string, description?: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await cogneeApi.permissions.createRole(name, description)
      
      // Add the new role to the store
      set((state) => ({
        roles: [...state.roles, response.data],
        isLoading: false
      }))
      
      // Refresh users to update roles
      await get().fetchAllUsers()
    } catch (error: any) {
      console.error('Failed to create role:', error)
      console.error('Error response:', error.response?.data)
      set({
        error: error.response?.data?.detail || error.response?.data?.message || error instanceof Error ? error.message : 'Failed to create role',
        isLoading: false
      })
      throw error
    }
  },
  
  fetchRoles: async () => {
    const state = get()
    
    // Request-Deduplizierung: Wenn bereits ein Fetch läuft, warte darauf
    if (state.pendingFetchRoles) {
      return state.pendingFetchRoles
    }
    
    // Wenn Rollen bereits vorhanden und nicht im Loading-State, skip Fetch
    if (state.roles.length > 0 && !state.isLoading) {
      return Promise.resolve()
    }
    
    set({ isLoading: true, error: null })
    
    const fetchPromise = (async () => {
      try {
        const response = await cogneeApi.permissions.getRoles()
        const roles = response.data
        set({ roles, isLoading: false })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch roles',
          isLoading: false,
          pendingFetchRoles: null // Clear pending promise on error
        })
        throw error
      } finally {
        // Clear pending promise after completion
        set({ pendingFetchRoles: null })
      }
    })()
    
    // Speichere Promise für Deduplizierung
    set({ pendingFetchRoles: fetchPromise })
    
    return fetchPromise
  },
  
  assignRoleToUser: async (userId: string, roleId: string) => {
    set({ isLoading: true, error: null })
    try {
      await cogneeApi.permissions.addUserToRole(userId, roleId)
      
      // Refresh users to update role assignments
      await get().fetchAllUsers()
      set({ isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to assign role',
        isLoading: false 
      })
      throw error
    }
  },
  
  assignUserToRole: async (userId: string, roleId: string) => {
    // Alias for assignRoleToUser
    return get().assignRoleToUser(userId, roleId)
  },

  assignUsersToRole: async (userIds: string[], roleId: string) => {
    set({ isLoading: true, error: null })
    try {
      // Batch-Zuweisung: Weise alle Benutzer gleichzeitig zu
      const assignments = userIds.map((userId) => 
        cogneeApi.permissions.addUserToRole(userId, roleId)
      )
      await Promise.all(assignments)
      
      // Refresh users to update role assignments
      await get().fetchAllUsers()
      set({ isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to assign users to role',
        isLoading: false 
      })
      throw error
    }
  },
  
  addUserToTenant: async (userId: string) => {
    const { tenant } = get()
    if (!tenant) {
      throw new Error('No tenant available')
    }
    
    set({ isLoading: true, error: null })
    try {
      await cogneeApi.permissions.addUserToTenant(userId, tenant.id)
      set({ isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add user to tenant',
        isLoading: false 
      })
      throw error
    }
  },
  
  clearError: () => {
    set({ error: null })
  },

  // New: User Management Actions
  fetchAllUsers: async () => {
    const state = get()
    
    // Request-Deduplizierung: Wenn bereits ein Fetch läuft, warte darauf
    if (state.pendingFetchAllUsers) {
      return state.pendingFetchAllUsers
    }
    
    // Wenn Users bereits vorhanden und nicht im Loading-State, skip Fetch
    if (state.users.length > 0 && !state.isLoading) {
      return Promise.resolve()
    }
    
    set({ isLoading: true, error: null })
    
    const fetchPromise = (async () => {
      try {
        const response = await cogneeApi.users.getAllUsersV2()
        const users = response.data
      
      // Extract unique tenants from users
      const tenantsMap = new Map<string, Tenant>()
      users.forEach((user: any) => {
        if (user.tenant && !tenantsMap.has(user.tenant.id)) {
          tenantsMap.set(user.tenant.id, user.tenant)
        }
      })
      const tenants = Array.from(tenantsMap.values())
      
      // Extract unique roles from users
      const rolesMap = new Map<string, Role>()
      users.forEach((user: any) => {
        user.roles.forEach((role: any) => {
          if (!rolesMap.has(role.id)) {
            rolesMap.set(role.id, role)
          }
        })
      })
        const roles = Array.from(rolesMap.values())
        
        set({ users, tenants, roles, isLoading: false })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch users',
          isLoading: false,
          pendingFetchAllUsers: null // Clear pending promise on error
        })
        throw error
      } finally {
        // Clear pending promise after completion
        set({ pendingFetchAllUsers: null })
      }
    })()
    
    // Speichere Promise für Deduplizierung
    set({ pendingFetchAllUsers: fetchPromise })
    
    return fetchPromise
  },

  updateUser: async (userId: string, payload: UpdateUserPayload) => {
    set({ isLoading: true, error: null })
    try {
      await cogneeApi.users.updateUser(userId, payload)
      await get().fetchAllUsers()
      set({ isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update user',
        isLoading: false 
      })
      throw error
    }
  },

  deleteUser: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      await cogneeApi.users.deleteUser(userId)
      set((state) => ({
        users: state.users.filter(u => u.id !== userId)
      }))
      set({ isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete user',
        isLoading: false 
      })
      throw error
    }
  },

  removeUserFromRole: async (userId: string, roleId: string) => {
    set({ isLoading: true, error: null })
    try {
      await cogneeApi.permissions.removeUserFromRole(userId, roleId)
      await get().fetchAllUsers()
      set({ isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to remove role',
        isLoading: false 
      })
      throw error
    }
  },

  removeUserFromTenant: async (userId: string, tenantId: string) => {
    set({ isLoading: true, error: null })
    try {
      await cogneeApi.permissions.removeUserFromTenant(userId, tenantId)
      await get().fetchAllUsers()
      set({ isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to remove tenant',
        isLoading: false 
      })
      throw error
    }
  },

  toggleUserRole: async (userId: string, roleName: 'admin' | 'user') => {
    set({ isLoading: true, error: null })
    try {
      // Set is_superuser based on role
      const isSuperuser = roleName === 'admin'
      
      // Update user via PATCH /v1/users/{id}
      await cogneeApi.users.updateUser(userId, { is_superuser: isSuperuser })
      
      // Refresh users list to get updated data
      await get().fetchAllUsers()
      set({ isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to toggle role',
        isLoading: false 
      })
      throw error
    }
  },

  assignTenantToUser: async (userId: string, tenantId: string) => {
    set({ isLoading: true, error: null })
    try {
      // Add user to tenant via POST /v1/permissions/users/{user_id}/tenants?tenant_id={tenant_id}
      await cogneeApi.permissions.addUserToTenant(userId, tenantId)
      
      // Refresh users list to get updated tenant assignment
      await get().fetchAllUsers()
      set({ isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to assign tenant',
        isLoading: false 
      })
      throw error
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  setRoleFilter: (role: string | null) => {
    set({ roleFilter: role })
  },

  setStatusFilter: (status: 'all' | 'active' | 'inactive') => {
    set({ statusFilter: status })
  },

  setTenantFilter: (tenantId: string | null) => {
    set({ tenantFilter: tenantId })
  },
  
  giveDatasetPermission: async (payload: {
    dataset_ids: string[]
    principal_id: string
    principal_type: PrincipalType
    permission_type: PermissionType
  }) => {
    set({ isLoading: true, error: null })
    try {
      await cogneeApi.permissions.giveDatasetPermission(payload)
      set({ isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to give dataset permission',
        isLoading: false 
      })
      throw error
    }
  },
}))

