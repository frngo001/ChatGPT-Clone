import { useState, useRef, useEffect, useCallback } from "react";

interface SpeechRecognitionOptions {
  interimResults?: boolean;
  lang?: string;
  continuous?: boolean;
}

const useSpeechToText = (options: SpeechRecognitionOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Nur einmal initialisieren
    if (isInitializedRef.current) return;

    if (!("webkitSpeechRecognition" in window)) {
      const errorMsg = "Web Speech API wird nicht unterstützt. Bitte verwenden Sie Chrome, Edge oder Safari.";
      setError(errorMsg);
      return;
    }

    try {
      const recognition = new window.webkitSpeechRecognition();
      recognitionRef.current = recognition;
      isInitializedRef.current = true;

      recognition.interimResults = options.interimResults ?? true;
      recognition.lang = options.lang || "de-DE"; // Standardmäßig Deutsch
      recognition.continuous = options.continuous ?? false;
      recognition.maxAlternatives = 1;

      if ("webkitSpeechGrammarList" in window) {
        const grammar =
          "#JSGF V1.0; grammar punctuation; public <punc> = . | , | ! | ; | : ;";
        const speechRecognitionList = new window.webkitSpeechGrammarList();
        speechRecognitionList.addFromString(grammar, 1);
        recognition.grammars = speechRecognitionList;
      }

      recognition.onstart = () => {
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let text = "";

        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }

        // Always capitalize the first letter
        if (text.length > 0) {
          setTranscript(text.charAt(0).toUpperCase() + text.slice(1));
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        
        let errorMessage = "Ein Fehler ist aufgetreten";
        
        switch (event.error) {
          case "network":
            errorMessage = "Netzwerkfehler: Bitte überprüfen Sie Ihre Internetverbindung. Die Spracherkennung benötigt eine aktive Internetverbindung.";
            break;
          case "not-allowed":
          case "service-not-allowed":
            errorMessage = "Mikrofonzugriff wurde verweigert. Bitte erlauben Sie den Zugriff auf das Mikrofon in den Browser-Einstellungen.";
            break;
          case "aborted":
            errorMessage = "Spracherkennung wurde abgebrochen";
            break;
          case "no-speech":
            errorMessage = "Keine Sprache erkannt. Bitte versuchen Sie es erneut.";
            break;
          case "audio-capture":
            errorMessage = "Kein Mikrofon gefunden oder Mikrofonzugriff fehlgeschlagen.";
            break;
          default:
            errorMessage = `Spracherkennungsfehler: ${event.error}`;
        }
        
        setError(errorMessage);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } catch (err) {
      setError("Spracherkennung konnte nicht initialisiert werden");
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
        }
      }
    };
  }, [options.interimResults, options.lang, options.continuous]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError("Spracherkennung ist nicht verfügbar");
      return;
    }

    if (isListening) {
      return;
    }

    try {
      setError(null);
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      setError("Spracherkennung konnte nicht gestartet werden");
      setIsListening(false);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (!isListening) {
      return;
    }

    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (err) {
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
  };
};

export default useSpeechToText;
