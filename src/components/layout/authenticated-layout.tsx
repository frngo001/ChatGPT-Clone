import { Outlet, useLocation } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Header } from '@/components/layout/header'
import { SkipToMain } from '@/components/skip-to-main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ModelSelector } from '@/components/ollama-chat/model-selector'
import { DatasetSelector } from '@/components/ollama-chat/dataset-selector'
import useOllamaChatStore from '@/stores/ollama-chat-store'
import { useInitialLoading } from '@/hooks/use-initial-loading'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  const location = useLocation()
  
  // Initialize app data (token verification + dataset loading)
  useInitialLoading()
  
  // Check if we're on a chat page to show chat-specific components
  const isChatPage = location.pathname.startsWith('/chat')
  
  // Get chat mode from store for conditional rendering
  const chatMode = useOllamaChatStore((state) => state.chatMode)
  
  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <SkipToMain />
          <AppSidebar />
          <SidebarInset
            className={cn(
              // Set content container, so we can use container queries
              '@container/content',

              // If layout is fixed, set the height
              // to 100svh to prevent overflow
              'has-[[data-layout=fixed]]:h-svh',

              // If layout is fixed and sidebar is inset,
              // set the height to 100svh - spacing (total margins) to prevent overflow
              'peer-data-[variant=inset]:has-[[data-layout=fixed]]:h-[calc(100svh-(var(--spacing)*4))]'
            )}
          >
            <Header fixed>
              {isChatPage && (
                <div className='absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center'>
                  {chatMode === 'general' ? (
                    <ModelSelector />
                  ) : (
                    <DatasetSelector />
                  )}
                </div>
              )}
              <div className='ms-auto flex items-center space-x-4'>
                <ThemeSwitch />
                <ConfigDrawer />
                <ProfileDropdown />
              </div>
            </Header>
            <div className="flex flex-1 flex-col">
              {children ?? <Outlet />}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
