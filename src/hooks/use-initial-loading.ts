import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useDatasetStore } from '@/stores/dataset-store'

/**
 * Hook for initial app loading
 * 
 * @description Handles initial token verification and dataset loading
 * when the app starts. Only runs once per session, even in React Strict Mode.
 */
export function useInitialLoading() {
  // Optimize: Only subscribe to the methods we need, not the entire auth object
  const accessToken = useAuthStore((state) => state.auth.accessToken)
  const shouldVerifyToken = useAuthStore((state) => state.auth.shouldVerifyToken)
  const verifyToken = useAuthStore((state) => state.auth.verifyToken)
  const { fetchDatasets } = useDatasetStore()
  const hasInitialized = useRef(false)

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (hasInitialized.current) return
    
    const initializeApp = async () => {
      hasInitialized.current = true

      // Only verify token if we have one and it needs verification
      if (accessToken && shouldVerifyToken()) {
        try {
          await verifyToken()
        } catch (error) {
          console.error('Initial token verification failed:', error)
          // Don't redirect here, let the route guards handle it
        }
      }

      // Load datasets summary (without details) for sidebar
      if (accessToken) {
        try {
          await fetchDatasets()
          // Note: Only basic dataset info is loaded, details are loaded on demand
        } catch (error) {
          console.error('Initial dataset loading failed:', error)
          // Non-critical, don't show error to user
        }
      }
    }

    initializeApp()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only run once on mount
}
