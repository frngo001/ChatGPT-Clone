import { Outlet } from '@tanstack/react-router'
import { Palette, UserCog, Bot, Users } from 'lucide-react'
import { Main } from '@/components/layout/main'
import { SidebarNav } from './components/sidebar-nav'
import { useAuthStore } from '@/stores/auth-store'

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
    <Main fixed>
      <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <aside className='top-0 lg:sticky lg:w-1/5'>
          <SidebarNav items={navItems} />
        </aside>
        <div className='flex w-full overflow-y-hidden p-1'>
          <Outlet />
        </div>
      </div>
    </Main>
  )
}
