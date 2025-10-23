import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'thisisjustarandomstring'

interface AuthUser {
  accountNo: string
  email: string
  role: string[]
  exp: number
  // Cognee-specific fields
  id?: string
  tenant_id?: string
  is_active?: boolean
  is_verified?: boolean
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
  }
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const cookieState = getCookie(ACCESS_TOKEN)
  const initToken = cookieState ? JSON.parse(cookieState) : ''
  
  return {
    auth: {
      user: null,
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
          return {
            ...state,
            auth: { ...state.auth, user: null, accessToken: '' },
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
              role: ['user'],
              exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
              id: data.user.id,
              tenant_id: data.user.tenant_id,
              is_active: data.user.is_active,
              is_verified: data.user.is_verified,
            }

            set((state) => ({
              ...state,
              auth: { ...state.auth, user },
            }))

            return true
          }

          return false
        } catch (error) {
          console.error('Token verification error:', error)
          return false
        }
      },
    },
  }
})
