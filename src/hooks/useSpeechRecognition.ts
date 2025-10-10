import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * Configuration options for speech recognition
 * @interface SpeechRecognitionOptions
 */
interface SpeechRecognitionOptions {
  /** Whether to return interim results */
  interimResults?: boolean
  /** Language code for recognition (defaults to 'de-DE') */
  lang?: string
  /** Whether to continue listening after speech ends */
  continuous?: boolean
}

/**
 * Hook for speech-to-text functionality with browser compatibility
 * 
 * @description Provides speech recognition capabilities with cross-browser support,
 * error handling, and German language support by default.
 * 
 * @param options - Configuration options for speech recognition
 * @returns Object containing speech recognition state and controls
 */
const useSpeechToText = (options: SpeechRecognitionOptions = {}) => {
  // State management
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // Refs for recognition instance and initialization tracking
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isInitializedRef = useRef(false)

  // Initialize speech recognition
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) return

    // Check browser support
    if (!('webkitSpeechRecognition' in window)) {
      const errorMsg = 'Web Speech API wird nicht unterstützt. Bitte verwenden Sie Chrome, Edge oder Safari.'
      setError(errorMsg)
      return
    }

    try {
      // Create recognition instance
      const recognition = new window.webkitSpeechRecognition()
      recognitionRef.current = recognition
      isInitializedRef.current = true

      // Configure recognition settings
      recognition.interimResults = options.interimResults ?? true
      recognition.lang = options.lang || 'de-DE' // Default to German
      recognition.continuous = options.continuous ?? false
      recognition.maxAlternatives = 1

      // Add grammar support if available
      if ('webkitSpeechGrammarList' in window) {
        const grammar = '#JSGF V1.0; grammar punctuation; public <punc> = . | , | ! | ; | : ;'
        const speechRecognitionList = new window.webkitSpeechGrammarList()
        speechRecognitionList.addFromString(grammar, 1)
        recognition.grammars = speechRecognitionList
      }

      // Event handlers
      recognition.onstart = () => {
        setError(null)
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let text = ''

        // Combine all results
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript
        }

        // Capitalize first letter
        if (text.length > 0) {
          setTranscript(text.charAt(0).toUpperCase() + text.slice(1))
        }
      }

      recognition.onerror = (event) => {
        setIsListening(false)
        
        // Handle different error types
        let errorMessage = 'Ein Fehler ist aufgetreten'
        
        switch (event.error) {
          case 'network':
            errorMessage = 'Netzwerkfehler: Bitte überprüfen Sie Ihre Internetverbindung. Die Spracherkennung benötigt eine aktive Internetverbindung.'
            break
          case 'not-allowed':
          case 'service-not-allowed':
            errorMessage = 'Mikrofonzugriff wurde verweigert. Bitte erlauben Sie den Zugriff auf das Mikrofon in den Browser-Einstellungen.'
            break
          case 'aborted':
            errorMessage = 'Spracherkennung wurde abgebrochen'
            break
          case 'no-speech':
            errorMessage = 'Keine Sprache erkannt. Bitte versuchen Sie es erneut.'
            break
          case 'audio-capture':
            errorMessage = 'Kein Mikrofon gefunden oder Mikrofonzugriff fehlgeschlagen.'
            break
          default:
            errorMessage = `Spracherkennungsfehler: ${event.error}`
        }
        
        setError(errorMessage)
      }

      recognition.onend = () => {
        setIsListening(false)
      }
    } catch (err) {
      setError('Spracherkennung konnte nicht initialisiert werden')
    }

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (err) {
          // Silent cleanup error
        }
      }
    }
  }, [options.interimResults, options.lang, options.continuous])

  // Start listening function
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Spracherkennung ist nicht verfügbar')
      return
    }

    if (isListening) {
      return
    }

    try {
      setError(null)
      setTranscript('')
      recognitionRef.current.start()
      setIsListening(true)
    } catch (err) {
      setError('Spracherkennung konnte nicht gestartet werden')
      setIsListening(false)
    }
  }, [isListening])

  // Stop listening function
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return

    if (!isListening) {
      return
    }

    try {
      recognitionRef.current.stop()
      setIsListening(false)
    } catch (err) {
      setIsListening(false)
    }
  }, [isListening])

  // Return hook interface
  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
  }
}

export default useSpeechToText
