import { createFileRoute } from '@tanstack/react-router'
import { DatasetDetailPage } from '@/features/datasets/dataset-detail'
import { ErrorBoundary } from '@/components/error-boundary'
import { DatasetErrorFallback } from '@/features/datasets/components/dataset-error-fallback'

function DatasetDetailPageWithErrorBoundary() {
  return (
    <ErrorBoundary
      fallback={<DatasetErrorFallback />}
      onError={(error, errorInfo) => {
        // Log error in production (e.g., to Sentry)
        if (import.meta.env.PROD) {
          console.error('Dataset Error:', error, errorInfo)
          // TODO: Send to error tracking service
          // Sentry.captureException(error, { contexts: { react: errorInfo } })
        }
      }}
    >
      <DatasetDetailPage />
    </ErrorBoundary>
  )
}

export const Route = createFileRoute('/_authenticated/library/datasets/$datasetId')({
  component: DatasetDetailPageWithErrorBoundary,
})