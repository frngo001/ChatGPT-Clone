import { createFileRoute } from '@tanstack/react-router'
import { DatasetsPage } from '@/features/datasets'

export const Route = createFileRoute('/_authenticated/library/datasets/')({
  component: DatasetsPage,
})
