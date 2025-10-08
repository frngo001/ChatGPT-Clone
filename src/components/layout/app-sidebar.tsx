import { useLayout } from '@/context/layout-provider'
import { useLocation } from '@tanstack/react-router'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from '@/components/ui/sidebar'
// import { AppTitle } from './app-title'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { TeamSwitcher } from './team-switcher'
import { ChatHistory } from './chat-history'
import { OllamaChatHistory } from './ollama-chat-history'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { state, isMobile } = useSidebar()
  const location = useLocation()
  
  // Check if we're on the ollama-chat page
  const isOllamaChatPage = location.pathname.startsWith('/ollama-chat')
  
  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />

        {/* Replace <TeamSwitch /> with the following <AppTitle />
         /* if you want to use the normal app title instead of TeamSwitch dropdown */}
        {/* <AppTitle /> */}
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
        
        {/* Only show Chat-Verlauf when sidebar is expanded (not collapsed) */}
        {/* On mobile, always show when sidebar is open */}
        {(state !== 'collapsed' || isMobile) && (
          <SidebarGroup>
            <SidebarGroupLabel>
              {isOllamaChatPage ? 'Ollama Chat-Verlauf' : 'Chat-Verlauf'}
            </SidebarGroupLabel>
            {isOllamaChatPage ? <OllamaChatHistory /> : <ChatHistory />}
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
