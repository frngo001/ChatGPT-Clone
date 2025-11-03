import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

// Internal imports
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'
import { DirectionProvider } from './context/direction-provider'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'

// Generated routes
import { routeTree } from './routeTree.gen'

// Global styles
import './styles/index.css'

// Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {

        // Development: no retries
        if (failureCount >= 0 && import.meta.env.DEV) return false
        
        // Production: max 3 retries
        if (failureCount > 3 && import.meta.env.PROD) return false

        // Don't retry on auth errors
        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10 seconds
    },
    mutations: {
      onError: (error) => {
        handleServerError(error)

        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            toast.error('Inhalt nicht geändert!')
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AxiosError) {
        // Handle authentication errors
        if (error.response?.status === 401) {
          toast.error('Sitzung abgelaufen!')
          useAuthStore.getState().auth.reset()
          const redirect = `${router.history.location.href}`
          router.navigate({ to: '/login', search: { redirect } })
        }
        
        // Handle server errors
        if (error.response?.status === 500) {
          toast.error('Interner Server-Fehler!')
          router.navigate({ to: '/500' })
        }
        
        // Handle forbidden errors
        if (error.response?.status === 403) {
          // router.navigate("/forbidden", { replace: true });
        }
      }
    },
  }),
})

// Router configuration
// ✅ Optimized: Route Preloading auf 'viewport' reduziert initiale Requests
// 'viewport' lädt nur Routes im sichtbaren Bereich, statt alle beim Hovern
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'viewport', // Changed from 'intent' to reduce initial requests
  defaultPreloadStaleTime: 5 * 60 * 1000, // 5 minutes - Cached routes stay cached longer
})

// Type safety declaration for router
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Application rendering
const rootElement = document.getElementById('root')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FontProvider>
            <DirectionProvider>
              <RouterProvider router={router} />
            </DirectionProvider>
          </FontProvider>
        </ThemeProvider>
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </QueryClientProvider>
    </StrictMode>
  )
}
