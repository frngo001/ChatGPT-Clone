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
import { useChatStore } from '@/stores/chat-store'
import { useSidebar } from '@/components/ui/sidebar'

interface ChatHistoryProps {
  className?: string
}

export function ChatHistory({ className }: ChatHistoryProps) {
  const navigate = useNavigate()
  const { chats, currentChatId, selectChat, deleteChat, updateChatTitle } = useChatStore()
  const { setOpenMobile } = useSidebar()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleEditStart = (chatId: string, currentTitle: string) => {
    setEditingId(chatId)
    setEditingTitle(currentTitle)
  }

  const handleEditSave = (chatId: string) => {
    if (editingTitle.trim()) {
      updateChatTitle(chatId, editingTitle.trim())
    }
    setEditingId(null)
    setEditingTitle('')
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditingTitle('')
  }

  const handleDeleteClick = (chatId: string) => {
    setChatToDelete(chatId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (chatToDelete) {
      deleteChat(chatToDelete)
      setDeleteDialogOpen(false)
      setChatToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setChatToDelete(null)
  }


  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) {
      return chats
    }

    const query = searchQuery.toLowerCase().trim()
    
    return chats.filter(chat => {
      // Search in chat title
      if (chat.title.toLowerCase().includes(query)) {
        return true
      }
      
      // Search in message content
      return chat.messages.some(message => 
        message.content.toLowerCase().includes(query)
      )
    })
  }, [chats, searchQuery])

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

  if (chats.length === 0) {
    return (
      <div className={cn('p-4 text-center text-muted-foreground', className)}>
        <p className="text-sm">Keine Chats vorhanden</p>
        <p className="text-xs">Starten Sie eine neue Unterhaltung</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Search Input */}
      <div className="px-2">
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

      {/* Search Results Info */}
      {searchQuery && (
        <div className="px-2 text-xs text-muted-foreground">
          {filteredChats.length === 0 ? (
            <span>Keine Treffer für "{searchQuery}"</span>
          ) : (
            <span>{filteredChats.length} Treffer für "{searchQuery}"</span>
          )}
        </div>
      )}

      {/* Chat List */}
      <div className="space-y-1">
        {filteredChats.map((chat) => (
        <div
          key={chat.id}
          className={cn(
            'group flex items-center gap-2 rounded-lg p-2 text-sm transition-colors hover:bg-accent',
            currentChatId === chat.id && 'bg-accent'
          )}
        >
          <div className="flex-1 min-w-0">
            {editingId === chat.id ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSave(chat.id)
                    if (e.key === 'Escape') handleEditCancel()
                  }}
                  className="h-6 text-xs"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => handleEditSave(chat.id)}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={handleEditCancel}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => {
                  selectChat(chat.id)
                  navigate({ to: '/chat/$id', params: { id: chat.id } })
                  setOpenMobile(false) // Close mobile sidebar after selection
                }}
                className="flex-1 text-left min-w-0"
              >
                <div className="truncate font-normal text-sm">
                  {highlightMatches(chat.title, searchQuery)}
                </div>
              </button>
            )}
          </div>

          {editingId !== chat.id && (
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
                  onClick={() => handleEditStart(chat.id, chat.title)}
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Umbenennen
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(chat.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Chat löschen
            </AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diesen Chat wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              {chatToDelete && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <span className="font-medium">
                    {chats.find(chat => chat.id === chatToDelete)?.title}
                  </span>
                </div>
              )}
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
