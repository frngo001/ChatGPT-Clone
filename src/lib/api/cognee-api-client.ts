import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/auth-store'

// Create Axios instance for Cognee API calls
const cogneeApiClient: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add authentication token
cogneeApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().auth.accessToken
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle authentication errors
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

// Export the configured client
export default cogneeApiClient

// Helper functions for common Cognee API operations
export const cogneeApi = {
  // Search operations
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
    return cogneeApiClient.post('/search', payload)
  },

  // Dataset operations
  getDatasets: () => {
    return cogneeApiClient.get('/datasets')
  },

  createDataset: (name: string) => {
    return cogneeApiClient.post('/datasets', { name })
  },

  deleteDataset: (datasetId: string) => {
    return cogneeApiClient.delete(`/datasets/${datasetId}`)
  },

  getDatasetData: (datasetId: string) => {
    return cogneeApiClient.get(`/datasets/${datasetId}/data`)
  },

  getDatasetGraph: (datasetId: string) => {
    return cogneeApiClient.get(`/datasets/${datasetId}/graph`)
  },

  // Check if dataset has processed data
  checkDatasetHasData: async (datasetId: string): Promise<boolean> => {
    try {
      const response = await cogneeApiClient.get(`/datasets/${datasetId}/data`)
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
    return cogneeApiClient.post('/add', formData, {
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
    return cogneeApiClient.post('/cognify', payload)
  },

  // Settings operations
  getSettings: () => {
    return cogneeApiClient.get('/settings')
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
    return cogneeApiClient.post('/settings', settings)
  },

  // User operations
  getCurrentUser: () => {
    return cogneeApiClient.get('/users/me')
  },

  updateCurrentUser: (userData: {
    email?: string
    password?: string
    is_active?: boolean
    is_verified?: boolean
  }) => {
    return cogneeApiClient.patch('/users/me', userData)
  },
}
