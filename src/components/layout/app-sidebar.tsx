import { useLayout } from '@/context/layout-provider'
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

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { state, isMobile } = useSidebar()
  
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
            <SidebarGroupLabel>Chat-Verlauf</SidebarGroupLabel>
            <ChatHistory />
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
