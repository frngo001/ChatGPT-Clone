import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
  beforeLoad: async ({ location }) => {
    const { auth } = useAuthStore.getState()
    
    // Check if user has a token
    if (!auth.accessToken) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
    
    // Only verify token if needed (cached forever after first verification)
    if (auth.shouldVerifyToken()) {
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
    }
    
    // Return user data for the route context
    return {
      user: auth.user,
    }
  },
})
