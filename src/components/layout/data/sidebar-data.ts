import {
  Library,
  FolderPlus,
  SquarePen,
  Database,
  FileText,
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
          icon: Library,
          items: [
            {
              title: 'Datasets',
              url: '/library/datasets',
              icon: Database,
            },
            {
              title: 'Dokumente',
              url: '/library/documents',
              icon: FileText,
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
