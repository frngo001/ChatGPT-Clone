import { createFileRoute } from '@tanstack/react-router'
import { PermissionsSettings } from '@/features/settings/permissions'

export const Route = createFileRoute('/_authenticated/settings/permissions')({
  component: PermissionsSettings,
})
