import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from '@/components/ui/sidebar'
// import { AppTitle } from './app-title'
import { useDynamicSidebarData } from './data/dynamic-sidebar-data'
import { NavGroupExtended } from './nav-group-extended'
import { TeamSwitcher } from './team-switcher'
import { OllamaChatHistory } from './ollama-chat-history'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { state, isMobile } = useSidebar()
  const sidebarData = useDynamicSidebarData()
  
  // Show chat history on all pages
  const shouldShowChatHistory = true
  
  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarContent className="flex flex-col">
        {/* Team Switcher */}
        <div className="flex-shrink-0">
          <TeamSwitcher teams={sidebarData.teams} />
        </div>
        
        {/* Fixed navigation groups */}
        <div className="flex-shrink-0">
          {sidebarData.navGroups.map((props, index) => (
            <NavGroupExtended key={index} {...props} />
          ))}
        </div>

        
        {/* Only show Chat-Verlauf when sidebar is expanded (not collapsed) */}
        {/* On mobile, always show when sidebar is open */}
        {(state !== 'collapsed' || isMobile) && shouldShowChatHistory && (
          <SidebarGroup className="flex-1 flex flex-col min-h-0">
            <SidebarGroupLabel className="flex-shrink-0">Chat-Verlauf</SidebarGroupLabel>
            <div className="flex-1 overflow-hidden">
              <OllamaChatHistory />
            </div>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
