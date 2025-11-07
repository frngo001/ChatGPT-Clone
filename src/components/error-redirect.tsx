import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

/**
 * Komponente, die sofort zur 405-Seite navigiert, wenn sie gerendert wird
 * Wird als Fallback für ErrorBoundary verwendet
 */
export function ErrorRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate({ to: '/405', replace: true })
  }, [navigate])

  // Zeige nichts während der Navigation
  return null
}

