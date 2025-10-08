import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { Message } from '@/components/chat/chat-message'

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  model?: string
}

interface ChatStore {
  chats: ChatSession[]
  currentChatId: string | null
  addMessage: (chatId: string, message: Message) => void
  removeLastMessage: (chatId: string) => void
  createNewChat: (model?: string) => string
  createChatIfNotExists: (chatId: string, model?: string) => string
  selectChat: (chatId: string) => void
  deleteChat: (chatId: string) => void
  updateChatTitle: (chatId: string, title: string) => void
  getCurrentChat: () => ChatSession | null
  getChatById: (chatId: string) => ChatSession | null
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: [],
      currentChatId: null,

      addMessage: (chatId: string, message: Message) => {
        set((state) => {
          // Stelle sicher, dass der Chat existiert
          const chatExists = state.chats.some(chat => chat.id === chatId)
          if (!chatExists) {
            // Erstelle den Chat automatisch, falls er nicht existiert
            // Für neue Chats, generiere eine echte UUID
            const actualChatId = chatId.startsWith('new-chat-') ? uuidv4() : chatId
            const newChat: ChatSession = {
              id: actualChatId,
              title: 'Neuer Chat',
              messages: [message],
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            
            // Auto-generate title from first user message
            if (message.role === 'user') {
              newChat.title = message.content.length > 50 
                ? message.content.substring(0, 50) + '...'
                : message.content
            }
            
            return {
              chats: [newChat, ...state.chats],
              currentChatId: actualChatId,
            }
          }

          // Chat existiert bereits, füge Nachricht hinzu
          const updatedChats = state.chats.map((chat) => {
            if (chat.id === chatId) {
              const updatedMessages = [...chat.messages, message]
              // Auto-generate title from first user message if title is still default
              let newTitle = chat.title
              if (chat.title === 'Neuer Chat' && message.role === 'user') {
                newTitle = message.content.length > 50 
                  ? message.content.substring(0, 50) + '...'
                  : message.content
              }
              
              return {
                ...chat,
                messages: updatedMessages,
                title: newTitle,
                updatedAt: new Date(),
              }
            }
            return chat
          })

          return { chats: updatedChats }
        })
      },

      removeLastMessage: (chatId: string) => {
        set((state) => {
          const updatedChats = state.chats.map((chat) => {
            if (chat.id === chatId && chat.messages.length > 0) {
              const updatedMessages = chat.messages.slice(0, -1)
              return {
                ...chat,
                messages: updatedMessages,
                updatedAt: new Date(),
              }
            }
            return chat
          })

          return { chats: updatedChats }
        })
      },

      createNewChat: (model?: string) => {
        const newChat: ChatSession = {
          id: uuidv4(), // Verwende UUID für eindeutige IDs
          title: 'Neuer Chat',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          model,
        }

        set((state) => ({
          chats: [newChat, ...state.chats],
          currentChatId: newChat.id,
        }))

        return newChat.id
      },

      createChatIfNotExists: (chatId: string, model?: string) => {
        const { chats } = get()
        const existingChat = chats.find(chat => chat.id === chatId)
        
        if (existingChat) {
          return chatId
        }

        // Für neue Chats, generiere eine echte UUID
        const actualChatId = chatId.startsWith('new-chat-') ? uuidv4() : chatId
        
        // Erstelle neuen Chat mit der echten ID
        const newChat: ChatSession = {
          id: actualChatId,
          title: 'Neuer Chat',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          model,
        }

        set((state) => ({
          chats: [newChat, ...state.chats],
          currentChatId: newChat.id,
        }))

        return newChat.id
      },

      selectChat: (chatId: string) => {
        set({ currentChatId: chatId })
      },

      deleteChat: (chatId: string) => {
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== chatId),
          currentChatId: state.currentChatId === chatId ? null : state.currentChatId,
        }))
      },

      updateChatTitle: (chatId: string, title: string) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId ? { ...chat, title, updatedAt: new Date() } : chat
          ),
        }))
      },

      getCurrentChat: () => {
        const { chats, currentChatId } = get()
        return chats.find((chat) => chat.id === currentChatId) || null
      },

      getChatById: (chatId: string) => {
        const { chats } = get()
        return chats.find((chat) => chat.id === chatId) || null
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ 
        chats: state.chats.map(chat => ({
          ...chat,
          createdAt: chat.createdAt.toISOString(),
          updatedAt: chat.updatedAt.toISOString(),
          messages: chat.messages.map(message => ({
            ...message,
            timestamp: message.timestamp ? message.timestamp.toISOString() : undefined,
          })),
        })), 
        currentChatId: state.currentChatId 
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert ISO strings back to Date objects
          state.chats = state.chats.map((chat: any) => ({
            ...chat,
            createdAt: new Date(chat.createdAt),
            updatedAt: new Date(chat.updatedAt),
            messages: chat.messages.map((message: any) => ({
              ...message,
              timestamp: message.timestamp ? new Date(message.timestamp) : undefined,
            })),
          }))
        }
      },
    }
  )
)
