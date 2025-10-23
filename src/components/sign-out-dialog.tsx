import { useNavigate, useLocation } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { auth } = useAuthStore()

  const handleSignOut = () => {
    auth.reset()
    // Preserve current location for redirect after sign-in
    const currentPath = location.href
    navigate({
      to: '/login',
      search: { redirect: currentPath },
      replace: true,
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Abmelden'
      desc='Sind Sie sicher, dass Sie sich abmelden möchten? Sie müssen sich erneut anmelden, um auf Ihr Konto zugreifen zu können.'
      confirmText='Abmelden'
      cancelBtnText='Abbrechen'
      handleConfirm={handleSignOut}
      className='sm:max-w-sm'
    />
  )
}
