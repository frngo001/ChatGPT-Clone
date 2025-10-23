import { Link } from '@tanstack/react-router'
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
import { useAuthStore } from '@/stores/auth-store'

export function ProfileDropdown() {
  const [open, setOpen] = useDialogState()
  const { auth } = useAuthStore()

  // Generate initials from email (since we don't have username in auth)
  const getInitials = (email: string) => {
    if (email && email.includes('@')) {
      const name = email.split('@')[0]
      return name.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  const initials = getInitials(auth.user?.email || '')
  const displayName = auth.user?.email?.split('@')[0] || 'Benutzer'
  const displayEmail = auth.user?.email || 'email@example.com'

  // Keyboard shortcuts are now handled centrally in SearchProvider

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
            <DropdownMenuItem disabled className='text-muted-foreground'>
              ⌘K - Suchfunktion
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to='/settings'>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
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
            Abmelden
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
