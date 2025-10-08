import { createFileRoute } from '@tanstack/react-router'
import { ChatHistory } from '@/components/layout/chat-history'

export const Route = createFileRoute('/_authenticated/chat/history')({
  component: ChatHistoryPage,
})

function ChatHistoryPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Chat-Verlauf</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre Chat-Unterhaltungen
        </p>
      </div>
      
      <div className="bg-card rounded-lg border p-6">
        <ChatHistory />
      </div>
    </div>
  )
}