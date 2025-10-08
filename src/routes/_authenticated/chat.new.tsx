import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/_authenticated/chat/new')({
  component: NewChatPage,
})

function NewChatPage() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate({ to: '/chat' })
  }, [navigate])

  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Neuer Chat wird vorbereitet...</p>
      </div>
    </div>
  )
}
