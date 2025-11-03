"use client"

import { AlertCircle, RefreshCw, MessageSquare, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from '@tanstack/react-router'

/**
 * Error Fallback für Chat-Features
 * 
 * @description
 * Spezifische Fehler-UI für Chat-bezogene Fehler.
 * Bietet Optionen zum Zurückgehen oder erneuten Versuchen.
 */
export function ChatErrorFallback({
  error,
  onReset,
}: {
  error?: Error | null
  onReset?: () => void
}) {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate({ to: '/chat' })
  }

  const handleGoHome = () => {
    navigate({ to: '/' })
  }

  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <MessageSquare className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle>Fehler beim Laden des Chats</CardTitle>
              <CardDescription>
                Der Chat konnte nicht geladen werden. Bitte versuchen Sie es erneut.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && import.meta.env.DEV && (
            <div className="rounded-md bg-muted p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">
                    {error.message}
                  </p>
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-muted-foreground">
                        Technische Details
                      </summary>
                      <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            {onReset && (
              <Button onClick={onReset} variant="default" className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Erneut versuchen
              </Button>
            )}
            <Button onClick={handleGoBack} variant="outline" className="flex-1">
              <MessageSquare className="mr-2 h-4 w-4" />
              Neuer Chat
            </Button>
            <Button onClick={handleGoHome} variant="outline" className="flex-1">
              <Home className="mr-2 h-4 w-4" />
              Zur Startseite
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Wenn das Problem weiterhin besteht, versuchen Sie die Seite zu aktualisieren.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

