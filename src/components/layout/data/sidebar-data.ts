import {
  Bot,
  Library,
  FolderPlus,
  SquarePen,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'ChatGPT User',
    email: 'user@chtgpt.com',
    avatar: '/avatars/user.jpg',
  },
  teams: [
    {
      name: 'CHTGPT Clone',
      logo: Bot,
      plan: 'AI Chat Assistant',
    },
  ],
  navGroups: [
    {
      title: 'Chat',
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
