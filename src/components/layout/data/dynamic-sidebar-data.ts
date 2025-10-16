import {
  Library,
  SquarePen,
  Folder,
  FolderPlus,
  SquareChartGantt ,
} from 'lucide-react'
import { type SidebarData } from '../types'
import { useDatasetStore } from '@/stores/dataset-store'

export function useDynamicSidebarData(): SidebarData {
  const { datasets } = useDatasetStore()

  // Generate dynamic dataset items
  const datasetItems = datasets.map((dataset) => ({
    title: dataset.name,
    url: `/library/datasets/${dataset.id}` as const,
    icon: Folder,
    badge: dataset.files.length.toString(),
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
            icon: SquarePen,
          },
          {
            title: 'Bibliothek',
            icon: Library,
            items: [
              {
                title: 'Datasets',
                icon: Folder,
                items: [
                  {
                    title: 'Verwalten',
                    url: '/library/datasets',
                    icon: SquareChartGantt
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
