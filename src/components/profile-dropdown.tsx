import { useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import useDialogState from '@/hooks/use-dialog-state'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOutDialog } from '@/components/sign-out-dialog'
import { useProfileStore } from '@/stores/profile-store'

export function ProfileDropdown() {
  const [open, setOpen] = useDialogState()
  const { profileData } = useProfileStore()
  const navigate = useNavigate()

  // Generate initials from username or email
  const getInitials = (username: string, email: string) => {
    if (username && username.length >= 2) {
      return username.substring(0, 2).toUpperCase()
    }
    if (email && email.includes('@')) {
      const name = email.split('@')[0]
      return name.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  const initials = getInitials(profileData.username, profileData.email)
  const displayName = profileData.username || 'Benutzer'
  const displayEmail = profileData.email || 'email@example.com'

  // Keyboard shortcuts implementation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
      const isModifierPressed = event.metaKey || event.ctrlKey
      
      if (!isModifierPressed) return

      switch (event.key.toLowerCase()) {
        case 'n':
          if (event.shiftKey) {
            event.preventDefault()
            navigate({ to: '/ollama-chat' })
          }
          break
        case 'p':
          if (event.shiftKey) {
            event.preventDefault()
            navigate({ to: '/settings' })
          }
          break
        case 'k':
          if (event.shiftKey) {
            event.preventDefault()
            navigate({ to: '/settings/account' })
          }
          break
        case 'c':
          if (event.shiftKey) {
            event.preventDefault()
            navigate({ to: '/settings/chat' })
          }
          break
        case 's':
          if (!event.shiftKey) {
            event.preventDefault()
            navigate({ to: '/settings' })
          }
          break
        case 'q':
          if (event.shiftKey) {
            event.preventDefault()
            setOpen(true)
          }
          break
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [navigate, setOpen])

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <Avatar className='h-8 w-8'>
              <AvatarImage src='/avatars/01.png' alt='@shadcn' />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56' align='end' forceMount>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col gap-1.5'>
              <p className='text-sm leading-none font-medium'>{displayName}</p>
              <p className='text-muted-foreground text-xs leading-none'>
                {displayEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to='/settings'>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to='/settings/account'>
                Konto
                <DropdownMenuShortcut>⇧⌘K</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link to='/settings/chat'>
                Chat
                <DropdownMenuShortcut>⇧⌘C</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to='/settings'>
                Settings
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>
            Sign out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
