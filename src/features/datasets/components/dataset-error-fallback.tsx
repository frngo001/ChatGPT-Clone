"use client"

import { AlertCircle, RefreshCw, ArrowLeft, FileX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate, useParams } from '@tanstack/react-router'

/**
 * Error Fallback für Dataset-Features
 * 
 * @description
 * Spezifische Fehler-UI für Dataset-bezogene Fehler.
 * Bietet Optionen zum Zurückgehen oder erneuten Versuchen.
 */
export function DatasetErrorFallback({
  error,
  onReset,
}: {
  error?: Error | null
  onReset?: () => void
}) {
  const navigate = useNavigate()
  const params = useParams({ from: '/_authenticated/library/datasets/$datasetId' })

  const handleGoBack = () => {
    navigate({ to: '/library/datasets' })
  }

  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <FileX className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle>Fehler beim Laden des Datasets</CardTitle>
              <CardDescription>
                Das Dataset konnte nicht geladen werden. Bitte versuchen Sie es erneut.
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
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zur Dataset-Übersicht
            </Button>
          </div>

          {params.datasetId && (
            <p className="text-center text-xs text-muted-foreground">
              Dataset ID: {params.datasetId}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

