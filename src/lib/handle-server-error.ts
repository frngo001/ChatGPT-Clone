import { AxiosError } from 'axios'
import { toast } from 'sonner'

interface ErrorContext {
  context?: string
  retryAction?: () => void | Promise<void>
}

/**
 * ✅ Verbesserte Error-Handling-Funktion mit kontextspezifischen Messages
 * 
 * @description
 * Zeigt kontextspezifische Error-Messages basierend auf HTTP-Status-Codes
 * und Error-Typen. Unterstützt Retry-Buttons für wiederholbare Fehler.
 */
export function handleServerError(error: unknown, options?: ErrorContext) {
  const { context, retryAction } = options || {}
  
  let errMsg = 'Etwas ist schiefgelaufen!'
  let errTitle = 'Fehler'
  let isRetryable = false

  // Handle Axios errors with specific status codes
  if (error instanceof AxiosError) {
    const status = error.response?.status
    const serverMessage = error.response?.data?.title || error.response?.data?.message

    switch (status) {
      case 400:
        errTitle = 'Ungültige Anfrage'
        errMsg = serverMessage || 'Die Anfrage enthält ungültige Daten. Bitte überprüfen Sie Ihre Eingaben.'
        break
      
      case 401:
        errTitle = 'Nicht autorisiert'
        errMsg = 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.'
        break
      
      case 403:
        errTitle = 'Zugriff verweigert'
        errMsg = serverMessage || 'Sie haben keine Berechtigung für diese Aktion.'
        break
      
      case 404:
        errTitle = 'Nicht gefunden'
        errMsg = serverMessage || 'Die angeforderte Ressource wurde nicht gefunden.'
        break
      
      case 409:
        errTitle = 'Konflikt'
        errMsg = serverMessage || 'Es gibt einen Konflikt mit dem aktuellen Zustand der Daten.'
        isRetryable = true
        break
      
      case 413:
        errTitle = 'Datei zu groß'
        errMsg = 'Die Datei ist zu groß. Bitte wählen Sie eine kleinere Datei.'
        break
      
      case 422:
        errTitle = 'Ungültige Daten'
        errMsg = serverMessage || 'Die übermittelten Daten konnten nicht verarbeitet werden.'
        break
      
      case 429:
        errTitle = 'Zu viele Anfragen'
        errMsg = 'Zu viele Anfragen. Bitte versuchen Sie es in ein paar Momenten erneut.'
        isRetryable = true
        break
      
      case 500:
        errTitle = 'Server-Fehler'
        errMsg = 'Ein interner Server-Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
        isRetryable = true
        break
      
      case 502:
      case 503:
      case 504:
        errTitle = 'Service nicht verfügbar'
        errMsg = 'Der Service ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.'
        isRetryable = true
        break
      
      default:
        // Network errors (no response)
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          errTitle = 'Verbindungsfehler'
          errMsg = 'Die Verbindung zum Server konnte nicht hergestellt werden. Bitte überprüfen Sie Ihre Internetverbindung.'
          isRetryable = true
        } else if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
          errTitle = 'Zeitüberschreitung'
          errMsg = 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.'
          isRetryable = true
        } else {
          errMsg = serverMessage || error.message || errMsg
        }
    }
  } else if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errTitle = 'Kein Inhalt'
    errMsg = 'Inhalt nicht gefunden.'
  } else if (error instanceof Error) {
    errMsg = error.message || errMsg
    
    // Check for specific error types
    if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      errTitle = 'Netzwerkfehler'
      errMsg = 'Die Verbindung zum Server konnte nicht hergestellt werden.'
      isRetryable = true
    }
  }

  // Add context if provided
  if (context) {
    errTitle = `${errTitle} - ${context}`
  }

  // Show toast with retry button if retryable and retry action provided
  if (isRetryable && retryAction) {
    toast.error(errTitle, {
      description: errMsg,
      duration: 10000,
      action: {
        label: 'Erneut versuchen',
        onClick: () => {
          retryAction()
        },
      },
    })
  } else {
    toast.error(errTitle, {
      description: errMsg,
      duration: 6000,
    })
  }
}
