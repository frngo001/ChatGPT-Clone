import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'
import { useDatasetStore } from '@/stores/dataset-store'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
  beforeLoad: async ({ location }) => {
    const { auth } = useAuthStore.getState()
    const { fetchDatasets } = useDatasetStore.getState()
    
    // Check if user has a token
    if (!auth.accessToken) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
    
    // Verify token with Cognee API
    const isValid = await auth.verifyToken()
    
    if (!isValid) {
      // Clear invalid token and redirect to login
      auth.reset()
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
    
    // Load datasets after successful token verification
    try {
      await fetchDatasets()
    } catch (error) {
      console.error('Failed to load datasets after token verification:', error)
      // Don't redirect to login as this is not critical for authentication
    }
    
    // Return user data for the route context
    return {
      user: auth.user,
    }
  },
})
