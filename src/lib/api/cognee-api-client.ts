/**
 * ============================================================================
 * COGNEE API CLIENT
 * ============================================================================
 * 
 * @file cognee-api-client.ts
 * @description 
 * Configured Axios Client für Cognee Backend API.
 * Bietet automatische Authentifizierung und Error-Handling.
 * 
 * Features:
 * - Automatisches Hinzufügen von Bearer Tokens
 * - Interceptors für Error-Handling (401, 403, 409)
 * - Typisierte API-Helper-Funktionen
 * 
 * @author ChatGPT-Clone Team
 * @since 1.0.0
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/auth-store'
import type { PermissionType, PrincipalType, UpdateUserPayload } from '@/types/permissions'

/**
 * Axios Instance für Cognee API Calls
 * 
 * @description
 * Konfiguriert mit:
 * - baseURL: '/api'
 * - timeout: 30000ms
 * - Standard Headers: JSON Content-Type
 * 
 * Automatisches Token-Management via Interceptors
 */
const cogneeApiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * ============================================================================
 * INTERCEPTORS
 * ============================================================================
 */

/**
 * Request Interceptor: Fügt Bearer Token zu allen Requests hinzu
 * 
 * @description
 * Liest automatisch den Auth-Token aus dem Zustand Store und
 * fügt ihn als 'Authorization: Bearer <token>' Header hinzu.
 */
cogneeApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().auth.accessToken
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      console.warn('No token available for request')
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Response Interceptor: Error-Handling für Authentication
 * 
 * @description
 * Behandelt HTTP Status Codes:
 * - 401: Token abgelaufen -> Clear Auth & Redirect zu Login
 * - 403: Zugriff verweigert -> Log Error
 * - 409: Keine Daten (NoDataError) -> Wird vom Caller behandelt
 */
cogneeApiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Clear auth state and redirect to login
      useAuthStore.getState().auth.reset()
      
      // Redirect to login page
      const currentPath = window.location.pathname
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
      
      return Promise.reject(error)
    }

    // Handle 403 Forbidden errors
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data)
      // Could redirect to a forbidden page or show error message
    }

    // Handle 409 Conflict errors (No data found)
    if (error.response?.status === 409) {
      console.error('Cognee NoDataError:', error.response.data)
      // This will be handled by the calling component
    }

    return Promise.reject(error)
  }
)

/**
 * Exportiert konfigurierten Axios Client
 */
export default cogneeApiClient

/**
 * ============================================================================
 * API HELPER FUNCTIONS
 * ============================================================================
 * 
 * Collection von typisierten Helper-Funktionen für Cognee API Operations
 */
export const cogneeApi = {
  /**
   * Semantische Suche in Datasets
   * 
   * @param payload - Search Configuration
   * @returns Promise mit Suchergebnissen
   */
  search: (payload: {
    searchType?: string
    datasets?: string[]
    datasetIds?: string[]
    query: string
    systemPrompt?: string
    nodeName?: string[]
    topK?: number
    onlyContext?: boolean
    useCombinedContext?: boolean
  }) => {
    return cogneeApiClient.post('/v1/search', payload)
  },

  // Dataset operations
  getDatasets: () => {
    return cogneeApiClient.get('/v1/datasets')
  },

  createDataset: (name: string) => {
    return cogneeApiClient.post('/v1/datasets', { name })
  },

  deleteDataset: (datasetId: string) => {
    return cogneeApiClient.delete(`/v1/datasets/${datasetId}`)
  },

  getDatasetData: (datasetId: string) => {
    return cogneeApiClient.get(`/v1/datasets/${datasetId}/data`)
  },

  getDatasetGraph: (datasetId: string) => {
    return cogneeApiClient.get(`/v1/datasets/${datasetId}/graph`)
  },

  // Check if dataset has processed data
  checkDatasetHasData: async (datasetId: string): Promise<boolean> => {
    try {
      const response = await cogneeApiClient.get(`/v1/datasets/${datasetId}/data`)
      const data = response.data
      
      // Check if dataset has any processed data
      if (Array.isArray(data) && data.length > 0) {
        return true
      }
      
      // Check for different data structures
      if (data && typeof data === 'object') {
        // Check for common data properties
        if (data.nodes && Array.isArray(data.nodes) && data.nodes.length > 0) {
          return true
        }
        if (data.chunks && Array.isArray(data.chunks) && data.chunks.length > 0) {
          return true
        }
        if (data.documents && Array.isArray(data.documents) && data.documents.length > 0) {
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error('Error checking dataset data:', error)
      return false
    }
  },

  // Add data operations
  addData: (formData: FormData) => {
    return cogneeApiClient.post('/v1/add', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // Cognify operations
  cognify: (payload: {
    datasets?: string[]
    datasetIds?: string[]
    runInBackground?: boolean
    customPrompt?: string
  }) => {
    return cogneeApiClient.post('/v1/cognify', payload)
  },

  // Settings operations
  getSettings: () => {
    return cogneeApiClient.get('/v1/settings')
  },

  saveSettings: (settings: {
    llm?: {
      provider: string
      model: string
      apiKey: string
    }
    vectorDb?: {
      provider: string
      url: string
      apiKey: string
    }
  }) => {
    return cogneeApiClient.post('/v1/settings', settings)
  },

  // User operations
  getCurrentUser: () => {
    return cogneeApiClient.get('/v1/users/me')
  },

  updateCurrentUser: (userData: {
    email?: string
    password?: string
    is_active?: boolean
    is_verified?: boolean
  }) => {
    return cogneeApiClient.patch('/v1/users/me', userData)
  },

  // Permissions API
  permissions: {
    // Tenant operations
    // Note: getAllTenants is not needed anymore as tenants are included in /v1/users/all response
    // getAllTenants: () => {
    //   return cogneeApiClient.get('/v1/tenants')
    // },

    createTenant: (name: string, description?: string) => {
      const params = new URLSearchParams();
      params.append('tenant_name', name);
      if (description) {
        params.append('description', description);
      }
      // baseURL ist bereits /api
      return cogneeApiClient.post(`/v1/permissions/tenants?${params.toString()}`)
    },

    addUserToTenant: (userId: string, tenantId: string) => {
      const params = new URLSearchParams();
      params.append('tenant_id', tenantId);
      // baseURL ist bereits /api
      return cogneeApiClient.post(`/v1/permissions/users/${userId}/tenants?${params.toString()}`)
    },

    // Role operations
    getRoles: () => {
      return cogneeApiClient.get('/v1/permissions/roles')
    },

    createRole: (name: string, description?: string) => {
      const params = new URLSearchParams();
      params.append('role_name', name);
      if (description) {
        params.append('description', description);
      }
      // baseURL ist bereits /api, daher nur v1/permissions/roles
      return cogneeApiClient.post(`/v1/permissions/roles?${params.toString()}`)
    },

    addUserToRole: (userId: string, roleId: string) => {
      const params = new URLSearchParams();
      params.append('role_id', roleId);
      // baseURL ist bereits /api, daher nur v1/...
      return cogneeApiClient.post(`/v1/permissions/users/${userId}/roles?${params.toString()}`)
    },

    // Dataset permissions
    // Basierend auf echter Cognee API: POST /api/v1/permissions/datasets/{principal_id}
    // Body: array of dataset UUIDs
    // Query: permission_name
    giveDatasetPermission: (payload: {
      dataset_ids: string[]
      principal_id: string
      principal_type: PrincipalType
      permission_type: PermissionType
    }) => {
      const params = new URLSearchParams();
      params.append('permission_name', payload.permission_type);
      
      // Body ist ein Array von Dataset-UUIDs
      return cogneeApiClient.post(
        `/v1/permissions/datasets/${payload.principal_id}?${params.toString()}`,
        payload.dataset_ids
      )
    },

    // Helper: Share dataset with tenant (all users get read access)
    shareDatasetWithTenant: async (datasetId: string, tenantId: string) => {
      // Cognee API: POST /v1/permissions/datasets/{principal_id}?permission_name=read
      // Body: [dataset_id]
      return cogneeApi.permissions.giveDatasetPermission({
        dataset_ids: [datasetId],
        principal_id: tenantId,
        principal_type: 'tenant',
        permission_type: 'read'
      })
    },

    // Helper: Share dataset with a specific user
    shareDatasetWithUser: async (datasetId: string, userId: string) => {
      // Cognee API: POST /v1/permissions/datasets/{principal_id}?permission_name=read
      // Body: [dataset_id]
      return cogneeApi.permissions.giveDatasetPermission({
        dataset_ids: [datasetId],
        principal_id: userId,
        principal_type: 'user',
        permission_type: 'read'
      })
    },

    // Get users with permissions on a specific dataset
    getDatasetPermissions: (datasetId: string) => {
      // Cognee API: GET /v1/datasets/{dataset_id}/permissions
      // Returns: { permissions: [{ userId, email, permissions: [] }] }
      return cogneeApiClient.get(`/v1/datasets/${datasetId}/permissions`)
    },

    // Revoke dataset permission from a user or role
    revokeDatasetPermission: (datasetId: string, principalId: string, permissionType: PermissionType = 'read') => {
      // Cognee API: DELETE /v1/permissions/datasets/{dataset_id}/permissions/{principal_id}?permission_name={permission_name}
      const params = new URLSearchParams();
      params.append('permission_name', permissionType);
      return cogneeApiClient.delete(
        `/v1/permissions/datasets/${datasetId}/permissions/${principalId}?${params.toString()}`
      )
    },

    removeUserFromRole: (userId: string, roleId: string) => {
      // Cognee API: DELETE /v1/permissions/users/{user_id}/roles/{role_id}
      return cogneeApiClient.delete(`/v1/permissions/users/${userId}/roles/${roleId}`)
    },

    removeUserFromTenant: (userId: string, tenantId: string) => {
      // Cognee API: DELETE /v1/permissions/users/{user_id}/tenants/{tenant_id}
      return cogneeApiClient.delete(`/v1/permissions/users/${userId}/tenants/${tenantId}`)
    }
  },

  // User Management API
  users: {
    getUser: (userId: string) => {
      return cogneeApiClient.get(`/cognee/users/${userId}`)
    },

    getAllUsers: () => {
      return cogneeApiClient.get('/cognee/users')
    },

    // New endpoint with full user information including tenant and roles
    getAllUsersV2: () => {
      return cogneeApiClient.get('/v1/users/all')
    },

    // Update user (is_verified, is_superuser, is_active, email, password)
    updateUser: (userId: string, payload: UpdateUserPayload) => {
      return cogneeApiClient.patch(`/v1/users/${userId}`, payload)
    },

    deleteUser: (userId: string) => {
      return cogneeApiClient.delete(`/v1/users/${userId}`)
    },
  }
}
