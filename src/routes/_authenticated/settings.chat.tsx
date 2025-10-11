import { createFileRoute } from '@tanstack/react-router'
import { SettingsChat } from '@/features/settings/chat'

export const Route = createFileRoute('/_authenticated/settings/chat')({
  component: SettingsChat,
})
