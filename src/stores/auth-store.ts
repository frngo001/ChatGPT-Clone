import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'
import type { Role } from '@/types/permissions'

const ACCESS_TOKEN = 'thisisjustarandomstring'
const LAST_VERIFIED = 'lastVerified'

interface AuthUser {
  accountNo: string
  email: string
  role: string[]
  exp: number
  // Cognee-specific fields
  id?: string
  tenant_id?: string
  is_active?: boolean
  is_superuser?: boolean
  is_verified?: boolean
  roles?: Role[]  // Neu: Cognee-Rollen
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
    // Cognee authentication methods
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
    register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>
    logout: () => Promise<void>
    verifyToken: () => Promise<boolean>
    shouldVerifyToken: () => boolean
    lastVerified: number
    // Permission helpers
    isAdmin: () => boolean
    hasRole: (roleName: string) => boolean
  }
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const cookieState = getCookie(ACCESS_TOKEN)
  const initToken = cookieState ? JSON.parse(cookieState) : ''
  
  const lastVerifiedCookie = getCookie(LAST_VERIFIED)
  const initLastVerified = lastVerifiedCookie ? parseInt(lastVerifiedCookie) : 0
  
  return {
    auth: {
      user: null,
      lastVerified: initLastVerified,
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),
      accessToken: initToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          setCookie(ACCESS_TOKEN, JSON.stringify(accessToken))
          return { ...state, auth: { ...state.auth, accessToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          removeCookie(LAST_VERIFIED)
          return {
            ...state,
            auth: { ...state.auth, user: null, accessToken: '', lastVerified: 0 },
          }
        }),
      
      // Cognee authentication methods
      login: async (email: string, password: string) => {
        try {
          const response = await fetch('/api/cognee/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            return { success: false, error: errorData.error || 'Login failed' }
          }

          const data = await response.json()
          
          // Create user object with Cognee data
          const user: AuthUser = {
            accountNo: data.user.id || 'cognee-user',
            email: data.user.email,
            role: data.user.is_superuser ? ['admin'] : ['user'],
            exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            id: data.user.id,
            tenant_id: data.user.tenant_id,
            is_active: data.user.is_active,
            is_superuser: data.user.is_superuser,
            is_verified: data.user.is_verified,
          }

          // Update store
          set((state) => ({
            ...state,
            auth: {
              ...state.auth,
              user,
              accessToken: data.token,
            },
          }))

          // Save token to cookie
          setCookie(ACCESS_TOKEN, JSON.stringify(data.token))

          return { success: true }
        } catch (error) {
          console.error('Login error:', error)
          return { success: false, error: 'Network error during login' }
        }
      },

      register: async (email: string, password: string, name?: string) => {
        try {
          const response = await fetch('/api/cognee/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            return { success: false, error: errorData.error || 'Registration failed' }
          }

          const data = await response.json()
          
          // Create user object with Cognee data
          const user: AuthUser = {
            accountNo: data.user.id || 'cognee-user',
            email: data.user.email,
            role: ['user'],
            exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            id: data.user.id,
            tenant_id: data.user.tenant_id,
            is_active: data.user.is_active,
            is_verified: data.user.is_verified,
          }

          // Update store
          set((state) => ({
            ...state,
            auth: {
              ...state.auth,
              user,
            },
          }))

          return { success: true }
        } catch (error) {
          console.error('Registration error:', error)
          return { success: false, error: 'Network error during registration' }
        }
      },

      logout: async () => {
        try {
          const { accessToken } = get().auth
          
          if (accessToken) {
            await fetch('/api/cognee/auth/logout', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            })
          }
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          // Always reset local state, even if API call fails
          set((state) => {
            removeCookie(ACCESS_TOKEN)
            return {
              ...state,
              auth: { ...state.auth, user: null, accessToken: '' },
            }
          })
        }
      },

      shouldVerifyToken: () => {
        const { lastVerified, accessToken, user } = get().auth
        
        // Don't verify if no token
        if (!accessToken) {
          return false
        }
        
        // Only verify if:
        // 1. Never verified before (lastVerified === 0)
        // 2. No user data loaded yet
        // No time-based verification - cache forever after first verification
        return lastVerified === 0 || !user
      },

      verifyToken: async () => {
        try {
          const { accessToken } = get().auth
          
          if (!accessToken) {
            return false
          }

          const response = await fetch('/api/cognee/auth/verify', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          })

          if (!response.ok) {
            return false
          }

          const data = await response.json()
          
          if (data.valid && data.user) {
            // Update user data
            const user: AuthUser = {
              accountNo: data.user.id || 'cognee-user',
              email: data.user.email,
              role: data.user.is_superuser ? ['admin'] : ['user'],
              exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
              id: data.user.id,
              tenant_id: data.user.tenant_id,
              is_active: data.user.is_active,
              is_superuser: data.user.is_superuser,
              is_verified: data.user.is_verified,
            }

            set((state) => ({
              ...state,
              auth: { 
                ...state.auth, 
                user,
                lastVerified: Date.now()
              },
            }))

            // Save lastVerified to cookie for persistence
            setCookie(LAST_VERIFIED, Date.now().toString())

            return true
          }

          return false
        } catch (error) {
          console.error('Token verification error:', error)
          return false
        }
      },

      // Permission helpers
      isAdmin: () => {
        const user = get().auth.user
        return user?.is_superuser || false
      },

      hasRole: (roleName: string) => {
        const user = get().auth.user
        return user?.roles?.some(r => r.name === roleName) || false
      },
    },
  }
})
