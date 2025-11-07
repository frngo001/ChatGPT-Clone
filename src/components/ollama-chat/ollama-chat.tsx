import OllamaChatTopbar from "./ollama-chat-topbar";
import OllamaChatList from "./ollama-chat-list";
import OllamaChatBottombar from "./ollama-chat-bottombar";
import type { Message, ChatRequestOptions } from "ai";
import { useChat } from "ai/react";
import React, { useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import useOllamaChatStore from "@/stores/ollama-chat-store";
import { useAuthStore } from "@/stores/auth-store";
import { useNavigate } from "@tanstack/react-router";
import { WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cogneeApi } from "@/lib/api/cognee-api-client";

/**
 * Typ-Definition für Anhänge
 */
type Attachment = {
  contentType?: string;
  url: string;
};

/**
 * Erweiterte Message-Type, die Anhänge für Persistenz enthält
 */
interface ExtendedMessage extends Message {
  experimental_attachments?: Array<{
    contentType?: string;
    url: string;
  }>;
  contextText?: string;
}

/**
 * Props für die OllamaChat-Komponente
 */
export interface ChatProps {
  id: string;
  initialMessages: ExtendedMessage[] | [];
}

/**
 * Hilfs-Funktion zum Formatieren der Nachrichtenhistorie für Cognee
 * 
 * @param {Message[]} messages - Array von Nachrichten
 * @returns {string} Formatierte Nachrichtenhistorie
 */
const formatMessageHistoryForCognee = (messages: Message[]): string => {
  return messages
    .map((message) => {
      const role = message.role === "user" ? "User" : "AI";
      return `${role}: ${message.content}`;
    })
    .join("\n\n");
};

/**
 * OllamaChat - Haupt-Komponente für den Chat mit Ollama, DeepSeek und Cognee
 * 
 * Diese Komponente ist das Herzstück des Chat-Systems und verwaltet:
 * - Zwei Chat-Modi: General (Ollama/DeepSeek) und Cognee (RAG mit Datasets)
 * - Nachrichtenpersistenz über den Store
 * - Fehlerbehandlung für verschiedene API-Fehler
 * - Streaming-Antworten für LLM-Chats
 * - Bild-Upload für visuelle Eingaben
 * - Web-Suche (optional für DeepSeek)
 * 
 * @param {ChatProps} props - Props für den Chat
 * @param {string} props.id - Eindeutige Chat-ID
 * @param {ExtendedMessage[]} props.initialMessages - Initiale Nachrichten
 * 
 * @returns {JSX.Element} Vollständige Chat-Interface mit Topbar, Liste und Bottom Bar
 */
export default function OllamaChat({ initialMessages, id }: ChatProps) {
  // Navigation and error state
  const navigate = useNavigate();
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [contextText, setContextText] = React.useState<string | null>(null);

  // Get state from store for images and model
  const base64Images = useOllamaChatStore((state) => state.base64Images);
  const setBase64Images = useOllamaChatStore((state) => state.setBase64Images);
  const selectedModel = useOllamaChatStore((state) => state.selectedModel);
  const selectedProvider = useOllamaChatStore((state) => state.selectedProvider);
  const saveMessages = useOllamaChatStore((state) => state.saveMessages);
  const getMessagesById = useOllamaChatStore((state) => state.getMessagesById);
  const setSelectedDataset = useOllamaChatStore(
    (state) => state.setSelectedDataset
  );

  // Chat settings from store
  const temperature = useOllamaChatStore((state) => state.temperature);
  const topP = useOllamaChatStore((state) => state.topP);
  const maxTokens = useOllamaChatStore((state) => state.maxTokens);
  const batchSize = useOllamaChatStore((state) => state.batchSize);
  const throttleDelay = useOllamaChatStore((state) => state.throttleDelay);
  const systemPrompt = useOllamaChatStore((state) => state.systemPrompt);

  // Cognee settings from store
  const chatMode = useOllamaChatStore((state) => state.chatMode);
  const selectedDataset = useOllamaChatStore((state) => state.selectedDataset);

  // Web search settings from store
  const webSearchEnabled = useOllamaChatStore(
    (state) => state.webSearchEnabled
  );
  
  /**
   * useChat Hook für AI SDK Integration
   * Verwaltet alle Chat-Operationen (Streaming, Senden, Stop, etc.)
   */
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    setMessages,
    setInput,
    reload,
    append,
  } = useChat({
    id,
    initialMessages,
    // Wähle API-Endpunkt basierend auf Chat-Modus und Provider
    api:
      chatMode === "cognee"
        ? "/api/cognee/search"
        : selectedProvider === "ollama"
          ? "/api/ollama/chat"
          : "/api/deepseek/chat",
    fetch: async (url, options) => {
      // Füge Authorization-Header für Cognee-Anfragen hinzu
      if (chatMode === "cognee") {
        const token = useAuthStore.getState().auth.accessToken;
        if (token) {
          options = {
            ...options,
            headers: {
              ...options?.headers,
              Authorization: `Bearer ${token}`,
            },
          };
        }
      }

      return fetch(url, options);
    },
    onResponse: (response) => {
      if (response) {
        setLoadingSubmit(false);
        setApiError(null); // Clear error on successful response
      }
    },
    onFinish: (message) => {
      /**
       * ============================================================================
       * ON FINISH - Speichere AI-Antwort im Store
       * ============================================================================
       *
       * Die User-Nachricht wurde bereits in onSubmit gespeichert.
       * Hier fügen wir nur die AI-Antwort hinzu.
       *
       * WICHTIG: handleSubmit hat die AI-Nachricht bereits zum messages-Array hinzugefügt,
       * daher müssen wir sie NUR noch im Store persistieren.
       */
      const currentMessages = getMessagesById(id);

      // Prüfe, ob die letzte Nachricht im Store eine User-Nachricht ist
      const lastMessage = currentMessages[currentMessages.length - 1];

      if (lastMessage && lastMessage.role === "user") {
        // ✅ Normal case: User-Nachricht ist im Store, füge AI-Antwort hinzu
        saveMessages(id, [...currentMessages, message as ExtendedMessage]);
      } else {
        // ⚠️ Fallback: Wenn die User-Nachricht fehlt (sollte nicht passieren)
        console.warn('onFinish: User message missing from store, attempting recovery');

        // Finde die fehlende User-Nachricht im messages-Array
        const userMessage = messages.find(msg =>
          msg.role === "user" && !currentMessages.some(cm => cm.id === msg.id)
        );

        if (userMessage) {
          // Füge beide Nachrichten hinzu (User + AI)
          saveMessages(id, [...currentMessages, userMessage as ExtendedMessage, message as ExtendedMessage]);
        } else {
          // Letzter Fallback: Nur AI-Antwort hinzufügen
          saveMessages(id, [...currentMessages, message as ExtendedMessage]);
        }
      }

      setLoadingSubmit(false);
      setApiError(null);

      // Navigate to chat page
      navigate({ to: `/chat/${id}` });
    },
    onError: (error) => {
      setLoadingSubmit(false);
      console.error(error.message);
      console.error(error);

      // Determine error type and show appropriate message
      let errorMessage = "An unknown error occurred.";

      // Handle Cognee-specific errors
      if (
        error.message.includes("Cognee API Error: 409") ||
        error.message.includes("NoDataError") ||
        error.message.includes("No data found in the system")
      ) {
        errorMessage =
          "Dataset-Fehler: Das ausgewählte Dataset enthält keine verarbeiteten Daten. Bitte fügen Sie Dokumente hinzu und verarbeiten Sie diese zuerst.";
      } else if (
        error.message.includes("Web Search Error") ||
        error.message.includes("DuckDuckGo")
      ) {
        errorMessage =
          "Web-Suche fehlgeschlagen: Die Web-Suche konnte nicht ausgeführt werden. Versuchen Sie es später erneut oder deaktivieren Sie die Web-Suche.";
        toast.warning("Web-Suche Fehler", {
          description:
            "Die Web-Suche konnte nicht durchgeführt werden. Der Chat wurde ohne Web-Suchergebnisse fortgesetzt.",
          duration: 6000,
        });
      } else if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("Connection refused") ||
        error.message.includes("ECONNREFUSED")
      ) {
        errorMessage =
          "Verbindungsproblem: Der Ollama-Server ist nicht erreichbar. Bitte überprüfen Sie, ob der Server läuft.";
      } else if (
        error.message.includes("Internal Server Error") ||
        error.message.includes("500") ||
        error.message.includes("llama runner process has terminated")
      ) {
        errorMessage =
          "Server-Fehler: Der Ollama-Server hat ein Problem. Bitte starten Sie den Server neu oder überprüfen Sie die Modell-Konfiguration.";
      } else if (
        error.message.includes("timeout") ||
        error.message.includes("TIMEOUT")
      ) {
        errorMessage =
          "Zeitüberschreitung: Die Anfrage dauert zu lange. Bitte versuchen Sie es erneut.";
      } else if (
        error.message.includes("model") &&
        error.message.includes("not supported")
      ) {
        errorMessage =
          "Modell-Fehler: Das gewählte Modell wird nicht unterstützt. Bitte wählen Sie ein anderes Modell.";
      }

      setApiError(errorMessage);
      
      // ✅ Verbesserte Error-Toast mit Retry-Button für wiederholbare Fehler
      const isRetryable = 
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("Connection refused") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("Internal Server Error") ||
        error.message.includes("500") ||
        error.message.includes("timeout") ||
        error.message.includes("TIMEOUT") ||
        error.message.includes("llama runner process has terminated");

      if (isRetryable) {
        toast.error("Chat-Fehler", {
          description: errorMessage,
          duration: 10000,
          action: {
            label: "Erneut versuchen",
            onClick: () => {
              // Retry last message if available
              if (messages.length > 0) {
                reload();
              }
            },
          },
        });
      } else {
        toast.error("Chat-Fehler", {
          description: errorMessage,
          duration: 8000,
        });
      }
    },
  });

  // Loading state for submission
  const [loadingSubmit, setLoadingSubmit] = React.useState(false);

  // Stelle sicher, dass initialMessages geladen werden
  useEffect(() => {
    setMessages(initialMessages as ExtendedMessage[]);
  }, [id, initialMessages, setMessages]);


  // Track previous chatMode to detect mode changes
  const prevChatModeRef = useRef(chatMode);
  
  // Reset selected dataset when switching FROM cognee TO general mode
  useEffect(() => {
    const prevMode = prevChatModeRef.current;
    
    // Only reset if we're switching from 'cognee' to 'general'
    if (prevMode === 'cognee' && chatMode === 'general' && selectedDataset) {
      setSelectedDataset(null);
    }
    
    // Update ref for next render
    prevChatModeRef.current = chatMode;
  }, [chatMode]);

  /**
   * ============================================================================
   * SUBMIT HANDLER - Haupt-Logik für das Senden von Nachrichten
   * ============================================================================
   *
   * Diese Funktion orchestriert den gesamten Nachrichtenversand:
   * 1. Validierung (Modell/Dataset ausgewählt)
   * 2. Erstellen der User-Nachricht mit Context und Attachments
   * 3. Sofortiges Speichern im Store (für Persistence)
   * 4. Sofortiges Anzeigen im UI (mit Context)
   * 5. Senden des API Requests
   */
  const onSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.history.replaceState({}, "", `/chat/${id}`);

    // ============================================================================
    // VALIDIERUNG
    // ============================================================================
    if (chatMode === 'general' && !selectedModel) {
      toast.error("Bitte wählen Sie ein Modell aus");
      return;
    }

    if (chatMode === 'cognee' && !selectedDataset) {
      toast.error("Bitte wählen Sie ein Dataset aus");
      return;
    }

    // Preventive check für Cognee mode - prüfe ob Dataset Daten hat
    if (chatMode === 'cognee' && selectedDataset) {
      try {
        const hasData = await cogneeApi.checkDatasetHasData(selectedDataset);
        if (!hasData) {
          toast.error("Dataset-Fehler", {
            description: "Das ausgewählte Dataset enthält keine verarbeiteten Daten. Bitte fügen Sie Dokumente hinzu und verarbeiten Sie diese zuerst.",
            duration: 8000,
          });
          return;
        }
      } catch (error) {
        console.error('Error checking dataset data:', error);
      }
    }

    setLoadingSubmit(true);

    // ============================================================================
    // MESSAGE CREATION - Erstelle User-Nachricht mit allen Daten
    // ============================================================================

    // Kombiniere Context mit Input für die API (aber behalte contextText separat für UI)
    const messageContent = contextText
      ? `Kontext: ${contextText}\n\n${input}`
      : input;

    // Erstelle Attachments Array
    const attachments: Attachment[] = base64Images
      ? base64Images.map((image) => ({
          contentType: "image/base64",
          url: image,
        }))
      : [];

    // ✅ Erstelle vollständige User-Nachricht mit ALLEN custom fields
    const userMessage: ExtendedMessage = {
      id: uuidv4(),
      role: "user",
      content: messageContent, // Kombinierter Content für API
      ...(contextText && { contextText }), // ✅ WICHTIG: Separates contextText für UI-Anzeige
      ...(base64Images && {
        experimental_attachments: attachments,
      }),
    };

    // ============================================================================
    // STORE PERSISTENCE - Speichere SOFORT für Refresh-Sicherheit
    // ============================================================================
    const currentStoreMessages = getMessagesById(id);
    saveMessages(id, [...currentStoreMessages, userMessage]);

    // ============================================================================
    // CLEANUP - Leere Input, Context und Images
    // ============================================================================
    setInput('');
    setContextText(null);
    setBase64Images(null);

    // ============================================================================
    // REQUEST OPTIONS - Baue Request basierend auf Chat-Modus
    // ============================================================================
    const requestOptions: ChatRequestOptions = chatMode === 'cognee' ? {
      body: {
        searchType: "CHUNKS",
        query: formatMessageHistoryForCognee([...messages, userMessage]),
        datasetIds: [selectedDataset],
        systemPrompt: systemPrompt,
      },
    } : {
      body: {
        // Sende messages MIT userMessage für korrekten Context
        messages: [...messages, userMessage],
        selectedModel: selectedModel,
        systemPrompt: systemPrompt,
        streamingConfig: {
          temperature: temperature,
          topP: topP,
          maxTokens: maxTokens,
          batchSize: batchSize,
          throttleDelay: throttleDelay,
        },
        ...(chatMode === 'general' && selectedProvider === 'deepseek' && { webSearchEnabled }),
      },
      ...(base64Images && {
        data: {
          images: base64Images,
        },
        experimental_attachments: attachments,
      }),
    };

    // ============================================================================
    // API REQUEST - Verwende append() mit der vollständigen userMessage
    // ============================================================================
    // append() fügt die Message zum UI hinzu UND startet die API-Anfrage
    // Übergebe die userMessage als vollständiges Message-Objekt mit allen custom fields
    append(
      userMessage as any,
      requestOptions
    );
  }, [
    id,
    chatMode,
    selectedModel,
    selectedDataset,
    input,
    base64Images,
    messages,
    systemPrompt,
    selectedProvider,
    webSearchEnabled,
    temperature,
    topP,
    maxTokens,
    batchSize,
    throttleDelay,
    append,
    saveMessages,
    getMessagesById,
    setInput,
    setBase64Images,
    setContextText,
    contextText,
  ]);

  // useCallback für removeLatestMessage um Referenz-Stabilität zu gewährleisten
  const removeLatestMessage = useCallback(() => {
    const updatedMessages = messages.slice(0, -1);
    setMessages(updatedMessages);
    saveMessages(id, updatedMessages as ExtendedMessage[]);
    return updatedMessages;
  }, [messages, setMessages, saveMessages, id]);

  // useCallback für handleStop um Referenz-Stabilität zu gewährleisten
  const handleStop = useCallback(() => {
    stop();
    saveMessages(id, [...messages as ExtendedMessage[]]);
    setLoadingSubmit(false);
  }, [stop, saveMessages, id, messages]);

  // Callback zum Hinzufügen des selektierten Textes als Kontext
    const handleAddSelectedTextToInput = useCallback((selectedText: string) => {
      const formattedText = selectedText.trim()
      setContextText(formattedText)
    }, [])

    // useCallback für reload callback um Referenz-Stabilität zu gewährleisten
    const reloadCallback = useCallback(async (chatRequestOptions?: ChatRequestOptions) => {
    removeLatestMessage();

    // Preventive check for Cognee mode - check if dataset has data
    if (chatMode === 'cognee' && selectedDataset) {
      try {
        const hasData = await cogneeApi.checkDatasetHasData(selectedDataset);
        if (!hasData) {
          toast.error("Dataset-Fehler", {
            description: "Das ausgewählte Dataset enthält keine verarbeiteten Daten. Bitte fügen Sie Dokumente hinzu und verarbeiten Sie diese zuerst.",
            duration: 8000,
          });
          return;
        }
      } catch (error) {
        console.error('Error checking dataset data:', error);
        // Continue with the request - the error will be handled by the onError callback
      }
    }

    const requestOptions: ChatRequestOptions = chatRequestOptions || (chatMode === 'cognee' ? {
      body: {
        query: messages[messages.length - 1]?.content || '',
        datasetIds: [selectedDataset],
        systemPrompt: systemPrompt,
      },
    } : {
      body: {
        selectedModel: selectedModel,
        streamingConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxTokens: 1000000,
          batchSize: 400,
          throttleDelay: 17,
        },
        ...(chatMode === 'general' && { webSearchEnabled }),
      },
    });

    setLoadingSubmit(true);
    return reload(requestOptions);
  }, [
    removeLatestMessage,
    chatMode,
    selectedDataset,
    messages,
    systemPrompt,
    selectedModel,
    webSearchEnabled,
    reload,
  ]);

  return (
    <div className="flex flex-col w-full max-w-5xl h-full chat-container">
      <OllamaChatTopbar
        isLoading={isLoading}
        chatId={id}
        messages={messages}
        setMessages={setMessages}
      />

      {apiError && (
        <div className="p-4">
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              {apiError}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="flex flex-col h-full w-full items-center gap-4 justify-center">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-semibold text-foreground mb-2 tracking-tight">
              Was darf ich dir erleichtern?
            </h1>
            <p className="text-muted-foreground text-sm mt-4">
              Wähle zwischen General für allgemeine Fragen oder Cognee für Fragen zu deinen Dokumenten.
            </p>
          </div>
          <OllamaChatBottombar
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={onSubmit}
            isLoading={isLoading}
            stop={handleStop}
            setInput={setInput}
          />
        </div>
      ) : (
        <>
          <OllamaChatList
            messages={messages}
            isLoading={isLoading}
            loadingSubmit={loadingSubmit}
            isCogneeMode={chatMode === 'cognee'}
            reload={reloadCallback}
            onAddSelectedTextToInput={handleAddSelectedTextToInput}
          />
          <OllamaChatBottombar
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={onSubmit}
            isLoading={isLoading}
            stop={handleStop}
            setInput={setInput}
            contextText={contextText}
            onRemoveContext={() => setContextText(null)}
          />
        </>
      )}
    </div>
  );
}
