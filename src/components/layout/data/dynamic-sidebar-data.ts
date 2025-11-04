import {
  FolderPlus,
  FolderSearch2,
  Folder,
} from 'lucide-react'
import { type SidebarData } from '../types'
import { useDatasetStore } from '@/stores/dataset-store'
import { FoldersIcon } from '@/components/ui/folders-icon'
import { SquarePenIcon } from '@/components/ui/square-pen-icon'

export function useDynamicSidebarData(): SidebarData {
  // Selektiver Store-Selektor: Nur datasets abonnieren
  // Verhindert, dass Sidebar-Daten bei jedem Store-Update neu berechnet werden
  const datasets = useDatasetStore((state) => state.datasets)

  // Generate dynamic dataset items
  const datasetItems = datasets.map((dataset) => ({
    title: dataset.name,
    url: `/library/datasets/${dataset.id}` as const,
    icon: Folder,
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
