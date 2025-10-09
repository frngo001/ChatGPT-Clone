import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  MoreVertical,
  Trash2,
  Edit3,
  Check,
  X,
  AlertTriangle,
  Search,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import useOllamaChatStore from '@/stores/ollama-chat-store'
import { useSidebar } from '@/components/ui/sidebar'

interface OllamaChatHistoryProps {
  className?: string
}

export function OllamaChatHistory({ className }: OllamaChatHistoryProps) {
  const navigate = useNavigate()
  const chats = useOllamaChatStore((state) => state.chats)
  const handleDelete = useOllamaChatStore((state) => state.handleDelete)
  const setCurrentChatId = useOllamaChatStore((state) => state.setCurrentChatId)
  const currentChatId = useOllamaChatStore((state) => state.currentChatId)
  const { setOpenMobile } = useSidebar()
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleDeleteClick = (chatId: string) => {
    setChatToDelete(chatId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (chatToDelete) {
      handleDelete(chatToDelete)
      setDeleteDialogOpen(false)
      setChatToDelete(null)
      navigate({ to: '/ollama-chat' })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setChatToDelete(null)
  }

  // Convert chats object to array and filter based on search query
  const filteredChats = useMemo(() => {
    const chatsArray = chats ? Object.entries(chats).map(([id, chat]) => ({
      id,
      ...chat,
    })) : []

    if (!searchQuery.trim()) {
      return chatsArray
    }

    const query = searchQuery.toLowerCase().trim()
    
    return chatsArray.filter(chat => {
      // Search in message content
      return chat.messages.some((message: any) => 
        message.content.toLowerCase().includes(query)
      )
    })
  }, [chats, searchQuery])

  // Sort by creation date (newest first)
  const sortedChats = useMemo(() => {
    return filteredChats.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [filteredChats])

  // Highlight search matches in text
  const highlightMatches = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Fixed Search Input */}
      <div className="flex-shrink-0 px-2 pb-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Chats durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-8 text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
              onClick={() => setSearchQuery('')}
            >
              <XCircle className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Fixed Search Results Info */}
      {searchQuery && (
        <div className="flex-shrink-0 px-2 pb-2 text-xs text-muted-foreground">
          {sortedChats.length === 0 ? (
            <span>Keine Treffer für "{searchQuery}"</span>
          ) : (
            <span>{sortedChats.length} Treffer für "{searchQuery}"</span>
          )}
        </div>
      )}

      {/* Scrollable Chat List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {sortedChats.length === 0 && !searchQuery ? (
          <div className="px-2 py-4 text-center text-muted-foreground">
            <p className="text-sm">Keine Chats vorhanden</p>
            <p className="text-xs">Starten Sie eine neue Unterhaltung</p>
          </div>
        ) : (
          <div className="space-y-1 px-2">
            {sortedChats.map((chat) => {
              const firstMessage = chat.messages.length > 0 
                ? chat.messages[0].content 
                : 'Leerer Chat'
              
              return (
                <div
                  key={chat.id}
                  className={cn(
                    'group flex items-center gap-2 rounded-lg p-2 text-sm transition-colors hover:bg-accent',
                    currentChatId === chat.id && 'bg-accent'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => {
                        setCurrentChatId(chat.id)
                        navigate({ to: '/ollama-chat/$chatId', params: { chatId: chat.id } })
                        setOpenMobile(false)
                      }}
                      className="flex-1 text-left min-w-0 w-full"
                    >
                      <div className="truncate font-normal text-xs">
                        {highlightMatches(firstMessage.slice(0, 50), searchQuery)}
                        {firstMessage.length > 50 && '...'}
                      </div>
                    </button>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(chat.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Chat löschen
            </AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diesen Chat wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

