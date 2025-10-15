import { createFileRoute } from '@tanstack/react-router'
import { FileDetailPage } from '@/features/datasets/components/file-detail-page'

export const Route = createFileRoute('/_authenticated/library/datasets/$datasetId/files/$fileId')({
  component: FileDetailPage,
})