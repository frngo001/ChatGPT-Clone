import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useChatStore } from '@/stores/chat-store'
import Chat from '@/components/chat/chat'
import { Message } from '@/components/chat/chat-message'

export const Route = createFileRoute('/_authenticated/chat/$id')({
  component: ChatPage,
})

function ChatPage() {
  const { id } = Route.useParams()
  const { getChatById } = useChatStore()
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4')
  const [models] = useState<string[]>(['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'llama-2'])

  console.log('Route ChatPage - ID from params:', id)
  const chat = getChatById(id)
  console.log('Route ChatPage - Chat found:', chat)
  const initialMessages: Message[] = chat?.messages || []

  return (
    <div className="h-screen w-full flex justify-center">
      <Chat 
        id={id} 
        initialMessages={initialMessages} 
        isMobile={false}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        models={models}
      />
    </div>
  )
}
