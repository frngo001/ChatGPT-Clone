import * as React from 'react'
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

type TeamSwitcherProps = {
  teams: {
    name: string
    logo: string
    plan: string
  }[]
}

export function TeamSwitcher({ teams }: TeamSwitcherProps) {
  const [activeTeam] = React.useState(teams[0])
  const { state, isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className={`flex items-center px-2 py-2 ${
          state === 'collapsed' && !isMobile 
            ? 'justify-center' 
            : 'gap-3'
        }`}>
          <div className='bg-gray-200 dark:bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
            <img src={activeTeam.logo} alt={activeTeam.name} className='size-4' />
          </div>
          {/* Show text only when sidebar is expanded or on mobile */}
          {(state !== 'collapsed' || isMobile) && (
            <span className='font-semibold text-sm'>
              {activeTeam.name}
            </span>
          )}
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
