import { createFileRoute } from '@tanstack/react-router'
import OllamaChatPage from '@/features/chat/ollama-chat-page'

export const Route = createFileRoute('/_authenticated/chat')({
  component: OllamaChatPage,
})