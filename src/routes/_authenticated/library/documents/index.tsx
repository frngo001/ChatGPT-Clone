import { createFileRoute } from '@tanstack/react-router'
import { DocumentsPage } from '@/features/documents'

export const Route = createFileRoute('/_authenticated/library/documents/')({
  component: DocumentsPage,
})