import { Outlet, useLocation } from '@tanstack/react-router'
import { Palette, UserCog, Bot, Users } from 'lucide-react'
import { Main } from '@/components/layout/main'
import { SidebarNav } from './components/sidebar-nav'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

// All titles translated to German
const sidebarNavItems = [
  {
    title: 'Profil',
    href: '/settings',
    icon: <UserCog size={18} />,
  },
  {
    title: 'Chat',
    href: '/settings/chat',
    icon: <Bot size={18} />,
  },
  {
    title: 'Anzeige',
    href: '/settings/appearance',
    icon: <Palette size={18} />,
  },
]

export function Settings() {
  const { isAdmin } = useAuthStore().auth
  const { pathname } = useLocation()
  
  // Check if we're on the permissions page
  const isPermissionsPage = pathname === '/settings/permissions'
  
  // Add permissions menu item for admins
  const navItems = isAdmin() 
    ? [
        ...sidebarNavItems,
        {
          title: 'Berechtigungen',
          href: '/settings/permissions',
          icon: <Users size={18} />,
        }
      ]
    : sidebarNavItems
    
  return (
    <Main fixed fluid>
      <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <aside className='lg:sticky lg:top-0 lg:self-start lg:h-fit md:w-1/2 lg:w-1/9  max-w-[1/9]'>
            <SidebarNav items={navItems} />
          </aside>
          <div className={cn(
            'flex w-full overflow-y-auto p-1 md:p-1',
            isPermissionsPage 
              ? 'lg:max-w-[90%] md:max-w-[90%]' 
              : 'lg:max-w-[50%] md:max-w-[50%]'
          )}>
            <Outlet />
          </div>
        </div>
      </Main>
    )
  }
