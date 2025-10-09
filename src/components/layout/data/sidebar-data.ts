import {
  Library,
  FolderPlus,
  SquarePen,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  teams: [
    {
      name: 'Agent AI',
      logo: '/images/logo.png',
      plan: 'AI Chat Assistant',
    },
  ],
  navGroups: [
    {
      items: [
        {
          title: 'Neuer Chat',
          url: '/ollama-chat',
          icon: SquarePen,
        },
        {
          title: 'Bibliothek',
          url: '/library',
          icon: Library,
        },
        {
          title: 'Projekte',
          url: '/projects',
          icon: FolderPlus,
        },
      ],
    },
  ],
}
