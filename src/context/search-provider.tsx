import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { CommandMenu } from '@/components/command-menu'
import { useAuthStore } from '@/stores/auth-store'

type SearchContextType = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SearchContext = createContext<SearchContextType | null>(null)

type SearchProviderProps = {
  children: React.ReactNode
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Check if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
      const isModifierPressed = e.metaKey || e.ctrlKey
      
      if (!isModifierPressed) return

      switch (e.key.toLowerCase()) {
        case 'k':
          // Cmd+K: Open command menu
          e.preventDefault()
          setOpen((open) => !open)
          break
        case 'n':
          if (e.shiftKey) {
            // Shift+Cmd+N: New chat
            e.preventDefault()
            navigate({ to: '/chat' })
          }
          break
        case 'p':
          if (e.shiftKey) {
            // Shift+Cmd+P: Profile settings
            e.preventDefault()
            navigate({ to: '/settings' })
          }
          break
        case 'c':
          if (e.shiftKey) {
            // Shift+Cmd+C: Chat settings
            e.preventDefault()
            navigate({ to: '/settings/chat' })
          }
          break
        case 's':
          if (!e.shiftKey) {
            // Cmd+S: Settings
            e.preventDefault()
            navigate({ to: '/settings' })
          }
          break
        case 'q':
          if (e.shiftKey) {
            // Shift+Cmd+Q: Logout
            e.preventDefault()
            auth.reset()
            navigate({ to: '/login', replace: true })
          }
          break
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [navigate, auth])

  return (
    <SearchContext value={{ open, setOpen }}>
      {children}
      <CommandMenu />
    </SearchContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSearch = () => {
  const searchContext = useContext(SearchContext)

  if (!searchContext) {
    throw new Error('useSearch has to be used within SearchProvider')
  }

  return searchContext
}
