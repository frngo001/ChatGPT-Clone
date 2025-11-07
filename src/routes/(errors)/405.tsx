import { createFileRoute } from '@tanstack/react-router'
import { MethodNotAllowedError } from '@/features/errors/method-not-allowed-error'

export const Route = createFileRoute('/(errors)/405')({
  component: MethodNotAllowedError,
})
