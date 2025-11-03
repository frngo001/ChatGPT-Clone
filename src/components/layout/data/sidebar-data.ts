import {
  FolderPlus,
  SquarePen,
  FolderSearch2,
} from 'lucide-react'
import { type SidebarData } from '../types'
import { FoldersIcon } from '@/components/ui/folders-icon'

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
          url: '/chat',
          icon: SquarePen,
        },
        {
          title: 'Datasets',
          icon: FoldersIcon,
          items: [
            {
              title: 'Verwalten',
              url: '/library/datasets',
              icon: FolderSearch2,
            },
          ],
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
