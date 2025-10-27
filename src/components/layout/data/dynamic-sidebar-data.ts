import {
  Library,
  FolderPlus,
  FolderSearch2,
  FolderOpen,
} from 'lucide-react'
import { type SidebarData } from '../types'
import { useDatasetStore } from '@/stores/dataset-store'
import { FoldersIcon } from '@/components/ui/folders-icon'
import { SquarePenIcon } from '@/components/ui/square-pen-icon'

export function useDynamicSidebarData(): SidebarData {
  const { datasets } = useDatasetStore()

  // Generate dynamic dataset items
  const datasetItems = datasets.map((dataset) => ({
    title: dataset.name,
    url: `/library/datasets/${dataset.id}` as const,
    icon: FolderOpen,
    badge: dataset.files.length > 0 ? dataset.files.length.toString() : '...',
  }))


  return {
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
            icon: SquarePenIcon,
          },
          {
            title: 'Bibliothek',
            icon: Library,
            items: [
              {
                title: 'Datasets',
                icon: FoldersIcon,
                items: [
                  {
                    title: 'Verwalten',
                    url: '/library/datasets',
                    icon: FolderSearch2
                  },
                  // Add dynamic datasets as sub-items
                  ...datasetItems,
                ],
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
}
