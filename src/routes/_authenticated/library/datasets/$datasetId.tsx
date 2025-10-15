import { createFileRoute } from '@tanstack/react-router'
import { DatasetDetailPage } from '@/features/datasets/dataset-detail'

export const Route = createFileRoute('/_authenticated/library/datasets/$datasetId')({
  component: DatasetDetailPage,
})