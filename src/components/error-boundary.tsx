"use client"

import React, { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetKeys?: Array<string | number>
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary Component
 * 
 * @description
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<CustomError />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In production, you might want to log to an error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error boundary when resetKeys change
    if (
      this.state.hasError &&
      prevProps.resetKeys &&
      this.props.resetKeys &&
      prevProps.resetKeys.some((key, index) => key !== this.props.resetKeys?.[index])
    ) {
      this.resetErrorBoundary()
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
    })

    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        // ✅ Pass error and onReset props to fallback component
        if (React.isValidElement(this.props.fallback)) {
          return React.cloneElement(this.props.fallback as React.ReactElement<any>, {
            error: this.state.error,
            onReset: this.resetErrorBoundary,
          })
        }
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.resetErrorBoundary}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  onReset: () => void
}

function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const navigate = useNavigate()

  // ✅ Kontextspezifische Error-Messages basierend auf Error-Typ
  const getErrorContext = () => {
    if (!error) return { title: 'Etwas ist schiefgelaufen', description: 'Die Anwendung ist auf einen Fehler gestoßen.' }
    
    const errorMsg = error.message.toLowerCase()
    
    // Render-Fehler
    if (errorMsg.includes('render') || errorMsg.includes('component')) {
      return {
        title: 'Anzeigefehler',
        description: 'Ein Problem beim Rendern der Komponente ist aufgetreten. Bitte laden Sie die Seite neu.',
      }
    }
    
    // Netzwerk-Fehler
    if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('connection')) {
      return {
        title: 'Verbindungsfehler',
        description: 'Die Verbindung zum Server konnte nicht hergestellt werden. Bitte überprüfen Sie Ihre Internetverbindung.',
      }
    }
    
    // API-Fehler
    if (errorMsg.includes('api') || errorMsg.includes('server') || errorMsg.includes('500')) {
      return {
        title: 'Server-Fehler',
        description: 'Der Server hat einen Fehler zurückgegeben. Bitte versuchen Sie es später erneut.',
      }
    }
    
    // Chunk-Loading-Fehler (Code-Splitting)
    if (errorMsg.includes('chunk') || errorMsg.includes('loading')) {
      return {
        title: 'Ladefehler',
        description: 'Eine Komponente konnte nicht geladen werden. Bitte aktualisieren Sie die Seite.',
      }
    }
    
    // Standard
    return {
      title: 'Unerwarteter Fehler',
      description: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.',
    }
  }

  const { title, description } = getErrorContext()

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && import.meta.env.DEV && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-mono text-muted-foreground">
                {error.message}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    Stack Trace
                  </summary>
                  <pre className="mt-2 overflow-auto text-xs">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={onReset} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Erneut versuchen
            </Button>
            <Button
              onClick={() => navigate({ to: '/' })}
              variant="outline"
            >
              <Home className="mr-2 h-4 w-4" />
              Zur Startseite
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Hook version of ErrorBoundary for functional components
 * 
 * @example
 * ```tsx
 * const ErrorBoundaryWrapper = withErrorBoundary(MyComponent, {
 *   fallback: <CustomError />
 * })
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

