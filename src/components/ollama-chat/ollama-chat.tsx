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
  // Ref um den aktuellen Context zu speichern, damit der fetch-Hook immer den neuesten Wert hat
  const contextTextRef = React.useRef<string | null>(null);
  
  // Aktualisiere den Ref, wenn sich contextText ändert
  React.useEffect(() => {
    contextTextRef.current = contextText;
  }, [contextText]);

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

      // WICHTIG: Überschreibe die Nachrichten im Body, um sicherzustellen,
      // dass der Context direkt mitgeschickt wird
      // Verwende den Ref, um immer den aktuellsten Context-Wert zu erhalten
      const currentContextText = contextTextRef.current;
      if (options?.body && currentContextText) {
        try {
          const body = JSON.parse(options.body as string);
          // Wenn Nachrichten im Body sind, stelle sicher, dass der Context enthalten ist
          if (body.messages && Array.isArray(body.messages) && body.messages.length > 0) {
            const lastMessage = body.messages[body.messages.length - 1];
            // Stelle sicher, dass der Context im Content enthalten ist
            if (lastMessage.role === 'user') {
              const content = typeof lastMessage.content === 'string' 
                ? lastMessage.content 
                : JSON.stringify(lastMessage.content);
              
              // Füge Context hinzu, wenn er noch nicht enthalten ist
              if (!content.includes('Kontext:')) {
                lastMessage.content = `Der User hat den folgenden Kontext hinzugefügt aus der Markierung: ${currentContextText}\n\n${content}`;
                options.body = JSON.stringify(body);
              }
            }
          }
        } catch (e) {
          // Wenn das Parsen fehlschlägt, ignoriere es
          console.warn('Could not parse request body for context injection:', e);
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
      // Save message to store
      const savedMessages = getMessagesById(id);
      // Stelle sicher, dass der Kontext der User-Nachricht erhalten bleibt
      const messagesWithContext = savedMessages.map((msg) => {
        // Wenn die Nachricht eine User-Nachricht ist und contextText hat, behalte es
        if (msg.role === 'user' && (msg as ExtendedMessage).contextText) {
          return msg as ExtendedMessage;
        }
        return msg as ExtendedMessage;
      });
      saveMessages(id, [...messagesWithContext, message as ExtendedMessage]);
      setLoadingSubmit(false);
      setApiError(null); // Clear error on successful completion

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

  // Stelle sicher, dass der Kontext erhalten bleibt
  useEffect(() => {
    setMessages(initialMessages as ExtendedMessage[]);
  }, [id, initialMessages, setMessages]);

  // Synchronisiere Nachrichten mit Store, um contextText zu erhalten
  useEffect(() => {
    const savedMessages = getMessagesById(id);
    if (savedMessages.length > 0 && messages.length > 0) {
      // Erstelle eine Map der gespeicherten Nachrichten mit contextText
      const savedMessagesMap = new Map(
        savedMessages.map((msg) => [msg.id, msg as ExtendedMessage])
      );
      
      // Aktualisiere die aktuellen Nachrichten mit contextText aus dem Store
      let messagesWithContext = messages.map((msg) => {
        const savedMsg = savedMessagesMap.get(msg.id);
        if (savedMsg && savedMsg.contextText) {
          // Behalte alle anderen Eigenschaften der aktuellen Nachricht, aber füge contextText hinzu
          return { ...msg, contextText: savedMsg.contextText } as ExtendedMessage;
        }
        return msg as ExtendedMessage;
      });
      
      // Prüfe ob sich contextText geändert hat oder ob eine Nachricht contextText hat aber nicht in messages
      const hasChanges = messagesWithContext.some((msg, idx) => {
        const originalMsg = messages[idx] as ExtendedMessage;
        return msg.contextText !== originalMsg?.contextText;
      });
      
      if (hasChanges) {
        // Aktualisiere sofort, damit contextText direkt sichtbar ist
        setMessages(messagesWithContext);
      }
    }
  }, [messages, id, getMessagesById, setMessages]);

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

  // useCallback für onSubmit um Referenz-Stabilität zu gewährleisten
  const onSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.history.replaceState({}, "", `/chat/${id}`);

    // Validation based on chat mode
    if (chatMode === 'general' && !selectedModel) {
      toast.error("Bitte wählen Sie ein Modell aus");
      return;
    }
    
    if (chatMode === 'cognee' && !selectedDataset) {
      toast.error("Bitte wählen Sie ein Dataset aus");
      return;
    }

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

    // Kombiniere Kontext-Text mit User-Input für die API
    const messageContent = contextText 
      ? `Kontext: ${contextText}\n\n${input}`
      : input;

    // Erstelle User-Nachricht mit Kontext als separates Feld (für Anzeige)
    // aber mit kombiniertem Content für die API
    const userMessage: ExtendedMessage = {
      id: uuidv4(),
      role: "user",
      content: messageContent, // Für API mit Kontext kombiniert
      ...(contextText && { contextText }), // Für Anzeige separat gespeichert
      ...(base64Images && {
        experimental_attachments: base64Images.map((image) => ({
          contentType: "image/base64",
          url: image,
        })),
      }),
    };

    setLoadingSubmit(true);

    const attachments: Attachment[] = base64Images
      ? base64Images.map((image) => ({
          contentType: "image/base64",
          url: image,
        }))
      : [];

    // WICHTIG: Aktualisiere den Ref SOFORT, damit der fetch-Hook den Context hat
    // Der Ref wird für den fetch-Hook verwendet und muss erhalten bleiben, bis der Request abgeschlossen ist
    contextTextRef.current = contextText;
    setInput('');
    // WICHTIG: Lösche den Context State SOFORT, BEVOR die Nachricht hinzugefügt wird
    // Der Context ist bereits in der User-Nachricht gespeichert und wird oben angezeigt
    // Durch frühes Löschen des States verschwindet er sofort aus der Bottom Bar
    // Der Ref bleibt erhalten, damit der fetch-Hook den Context noch verwenden kann
    setContextText(null);
    
     // WICHTIG: Leere den Input, damit useChat die Nachricht nicht nochmal hinzufügt
    // Die Nachricht ist bereits in messagesWithContext enthalten
 

    // WICHTIG: Füge die User-Nachricht mit Context direkt zu den Messages hinzu
    // BEVOR handleSubmit aufgerufen wird, damit useChat die Nachricht mit Context verwendet
    const messagesWithContext = [...messages as ExtendedMessage[], userMessage as ExtendedMessage];
    setMessages(messagesWithContext);
    
   

    // Different request body based on chat mode
    const requestOptions: ChatRequestOptions = chatMode === 'cognee' ? {
      body: {
        searchType: "CHUNKS",
        query: formatMessageHistoryForCognee(messagesWithContext),
        datasetIds: [selectedDataset],
        systemPrompt: systemPrompt,
      },
    } : {
      body: {
        // WICHTIG: Übergebe die Nachrichten direkt im Body, damit der Context sofort enthalten ist
        messages: messagesWithContext,
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

    // Verwende requestAnimationFrame, um sicherzustellen, dass setMessages und setInput abgeschlossen sind
    // bevor handleSubmit aufgerufen wird
    requestAnimationFrame(() => {
      handleSubmit(e, requestOptions);
    });
    saveMessages(id, [...messages as ExtendedMessage[], userMessage as ExtendedMessage]);
    setBase64Images(null);
    // Context wurde bereits oben gelöscht, bevor handleSubmit aufgerufen wurde 
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
    handleSubmit,
    saveMessages,
    setBase64Images,
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
    // Aktualisiere auch den Ref sofort, damit er sofort verfügbar ist
    contextTextRef.current = formattedText
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
