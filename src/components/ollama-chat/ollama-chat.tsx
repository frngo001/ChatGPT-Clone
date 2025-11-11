import OllamaChatTopbar from "./ollama-chat-topbar";
import OllamaChatList from "./ollama-chat-list";
import OllamaChatBottombar from "./ollama-chat-bottombar";
import type { Message } from "ai/react";
import type { ChatRequestOptions } from "ai";
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

/* ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================ */

/**
 * Represents an attachment (e.g., image) in a chat message
 */
type Attachment = {
  contentType?: string;
  url: string;
};

/**
 * Extended message type that includes custom fields for persistence
 * @extends Message from AI SDK
 */
interface ExtendedMessage extends Message {
  experimental_attachments?: Array<{
    contentType?: string;
    url: string;
  }>;
  /** Optional context text shown separately from main message content */
  contextText?: string | null;
}

/**
 * Props for the OllamaChat component
 */
export interface ChatProps {
  /** Unique identifier for the chat session */
  id: string;
  /** Initial messages to display when component loads */
  initialMessages: ExtendedMessage[] | [];
}

/* ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================ */

/**
 * Formats message history for Cognee API consumption
 * @param messages - Array of messages to format
 * @returns Formatted string with role prefixes
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
 * Determines if an error is retryable based on its message
 * @param errorMessage - The error message to check
 * @returns True if the error is retryable
 */
const isRetryableError = (errorMessage: string): boolean => {
  const retryablePatterns = [
    "Failed to fetch",
    "NetworkError",
    "Connection refused",
    "ECONNREFUSED",
    "Internal Server Error",
    "500",
    "timeout",
    "TIMEOUT",
    "llama runner process has terminated"
  ];

  return retryablePatterns.some(pattern => errorMessage.includes(pattern));
};

/**
 * Maps error messages to user-friendly descriptions
 * @param errorMessage - The raw error message
 * @returns Localized, user-friendly error message
 */
const getErrorDescription = (errorMessage: string): string => {
  if (errorMessage.includes("Cognee API Error: 409") ||
      errorMessage.includes("NoDataError") ||
      errorMessage.includes("No data found in the system")) {
    return "Dataset-Fehler: Das ausgewählte Dataset enthält keine verarbeiteten Daten. Bitte fügen Sie Dokumente hinzu und verarbeiten Sie diese zuerst.";
  }

  if (errorMessage.includes("Web Search Error") || errorMessage.includes("DuckDuckGo")) {
    return "Web-Suche fehlgeschlagen: Die Web-Suche konnte nicht ausgeführt werden. Versuchen Sie es später erneut oder deaktivieren Sie die Web-Suche.";
  }

  if (errorMessage.includes("Failed to fetch") ||
      errorMessage.includes("NetworkError") ||
      errorMessage.includes("Connection refused") ||
      errorMessage.includes("ECONNREFUSED")) {
    return "Verbindungsproblem: Der Ollama-Server ist nicht erreichbar. Bitte überprüfen Sie, ob der Server läuft.";
  }

  if (errorMessage.includes("Internal Server Error") ||
      errorMessage.includes("500") ||
      errorMessage.includes("llama runner process has terminated")) {
    return "Server-Fehler: Der Ollama-Server hat ein Problem. Bitte starten Sie den Server neu oder überprüfen Sie die Modell-Konfiguration.";
  }

  if (errorMessage.includes("timeout") || errorMessage.includes("TIMEOUT")) {
    return "Zeitüberschreitung: Die Anfrage dauert zu lange. Bitte versuchen Sie es erneut.";
  }

  if (errorMessage.includes("model") && errorMessage.includes("not supported")) {
    return "Modell-Fehler: Das gewählte Modell wird nicht unterstützt. Bitte wählen Sie ein anderes Modell.";
  }

  return "An unknown error occurred.";
};

/* ============================================================================
 * MAIN COMPONENT
 * ============================================================================ */

/**
 * OllamaChat - Main chat component supporting multiple AI providers
 *
 * Features:
 * - Dual chat modes: General (Ollama/DeepSeek) and Cognee (RAG with datasets)
 * - Message persistence via Zustand store
 * - Comprehensive error handling with retry functionality
 * - Streaming LLM responses
 * - Image upload support
 * - Optional web search (DeepSeek)
 * - Context text injection (user can select text to add as context)
 *
 * Architecture:
 * - Uses AI SDK's useChat hook for message management
 * - Separates UI message display from API message content
 * - Context text shown separately in UI but embedded in API requests
 *
 * @param props - Component props
 * @returns Complete chat interface
 */
export default function OllamaChat({ initialMessages, id }: ChatProps) {
  const navigate = useNavigate();
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [contextText, setContextText] = React.useState<string | null>(null);
  const [loadingSubmit, setLoadingSubmit] = React.useState(false);

  // Store selectors - grouped by functionality
  const base64Images = useOllamaChatStore((state) => state.base64Images);
  const setBase64Images = useOllamaChatStore((state) => state.setBase64Images);
  const selectedModel = useOllamaChatStore((state) => state.selectedModel);
  const selectedProvider = useOllamaChatStore((state) => state.selectedProvider);
  const saveMessages = useOllamaChatStore((state) => state.saveMessages);
  const getMessagesById = useOllamaChatStore((state) => state.getMessagesById);
  const setSelectedDataset = useOllamaChatStore((state) => state.setSelectedDataset);

  const temperature = useOllamaChatStore((state) => state.temperature);
  const topP = useOllamaChatStore((state) => state.topP);
  const maxTokens = useOllamaChatStore((state) => state.maxTokens);
  const systemPrompt = useOllamaChatStore((state) => state.systemPrompt);

  const chatMode = useOllamaChatStore((state) => state.chatMode);
  const selectedDataset = useOllamaChatStore((state) => state.selectedDataset);
  const webSearchEnabled = useOllamaChatStore((state) => state.webSearchEnabled);

  /**
   * AI SDK useChat hook - manages chat state and API communication
   */
  const {
    messages,
    input,
    handleInputChange,
    isLoading,
    stop,
    setMessages,
    setInput,
    reload,
    append,
  } = useChat({
    id,
    initialMessages,
    api: chatMode === "cognee"
      ? "/api/cognee/search"
      : selectedProvider === "ollama"
        ? "/api/ollama/chat"
        : "/api/deepseek/chat",
    fetch: async (url, options) => {
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
        setApiError(null);
      }
    },
    onFinish: (message) => {
      const currentMessages = getMessagesById(id);
      const lastMessage = currentMessages[currentMessages.length - 1];

      if (lastMessage && lastMessage.role === "user") {
        saveMessages(id, [...currentMessages, message as ExtendedMessage]);
      } else {
        console.warn('onFinish: User message missing from store, attempting recovery');
        const userMessage = messages.find(msg =>
          msg.role === "user" && !currentMessages.some(cm => cm.id === msg.id)
        );

        if (userMessage) {
          saveMessages(id, [...currentMessages, userMessage as ExtendedMessage, message as ExtendedMessage]);
        } else {
          saveMessages(id, [...currentMessages, message as ExtendedMessage]);
        }
      }

      setLoadingSubmit(false);
      setApiError(null);
      navigate({ to: `/chat/${id}` });
    },
    onError: (error) => {
      setLoadingSubmit(false);
      console.error(error.message);
      console.error(error);

      const errorMessage = getErrorDescription(error.message);
      setApiError(errorMessage);

      if (error.message.includes("Web Search Error") || error.message.includes("DuckDuckGo")) {
        toast.warning("Web-Suche Fehler", {
          description: "Die Web-Suche konnte nicht durchgeführt werden. Der Chat wurde ohne Web-Suchergebnisse fortgesetzt.",
          duration: 6000,
        });
      }

      if (isRetryableError(error.message)) {
        toast.error("Chat-Fehler", {
          description: errorMessage,
          duration: 10000,
          action: {
            label: "Erneut versuchen",
            onClick: () => {
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

  /**
   * Load initial messages on component mount or when chat ID changes
   */
  useEffect(() => {
    setMessages(initialMessages as ExtendedMessage[]);
  }, [id, initialMessages, setMessages]);

  /**
   * Reset dataset selection when switching from Cognee to General mode
   */
  const prevChatModeRef = useRef(chatMode);
  useEffect(() => {
    const prevMode = prevChatModeRef.current;
    if (prevMode === 'cognee' && chatMode === 'general' && selectedDataset) {
      setSelectedDataset(null);
    }
    prevChatModeRef.current = chatMode;
  }, [chatMode, selectedDataset, setSelectedDataset]);

  /**
   * Handles message submission
   *
   * Process:
   * 1. Prevents submission if a response is currently being generated
   * 2. Validates required selections (model/dataset)
   * 3. Creates user message with context and attachments
   * 4. Saves to store for persistence
   * 5. Creates API-specific message with embedded context
   * 6. Sends to appropriate API endpoint
   *
   * Note: Context text is kept separate in UI but embedded for API
   */
  const onSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.history.replaceState({}, "", `/chat/${id}`);

    // Prevent sending new message while response is being generated
    if (isLoading || loadingSubmit) {
      toast.warning("Bitte warten Sie, bis die aktuelle Antwort vollständig generiert wurde");
      return;
    }

    // Validation
    if (chatMode === 'general' && !selectedModel) {
      toast.error("Bitte wählen Sie ein Modell aus");
      return;
    }

    if (chatMode === 'cognee' && !selectedDataset) {
      toast.error("Bitte wählen Sie ein Dataset aus");
      return;
    }

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

    // Prepare attachments
    const attachments: Attachment[] = base64Images
      ? base64Images.map((image) => ({
          contentType: "image/base64",
          url: image,
        }))
      : [];

    // Create UI message - context kept separate for clean display
    const userMessage: ExtendedMessage = {
      id: uuidv4(),
      role: "user",
      content: input,
      ...(contextText && { contextText }),
      ...(base64Images && { experimental_attachments: attachments }),
    };

    // Save to store immediately
    const currentStoreMessages = getMessagesById(id);
    saveMessages(id, [...currentStoreMessages, userMessage]);

    // Clean up form state
    setInput('');
    setContextText(null);
    setBase64Images(null);

    // Create API message - context embedded in content
    const apiMessage = contextText
      ? {
          ...userMessage,
          content: `Context: ${contextText}\n\n User Message: ${input}`,
        }
      : userMessage;

    // Build request options based on chat mode
    const requestOptions: ChatRequestOptions = chatMode === 'cognee' ? {
      body: {
        searchType: "CHUNKS",
        query: formatMessageHistoryForCognee([...messages, apiMessage]),
        datasetIds: [selectedDataset],
        systemPrompt: systemPrompt,
        streamingConfig: {
          temperature,
          topP,
          maxTokens,
        },
      },
    } : {
      body: {
        messages: [...messages, apiMessage],
        selectedModel: selectedModel,
        systemPrompt: systemPrompt,
        streamingConfig: {
          temperature,
          topP,
          maxTokens,
        },
        ...(chatMode === 'general' && selectedProvider === 'deepseek' && { webSearchEnabled }),
      },
      ...(base64Images && {
        data: { images: base64Images },
        experimental_attachments: attachments,
      }),
    };

    // Send to API - append handles both UI update and API call
    append(userMessage as any, requestOptions);
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
    append,
    saveMessages,
    getMessagesById,
    setInput,
    setBase64Images,
    setContextText,
    contextText,
    isLoading,
    loadingSubmit,
  ]);

  /**
   * Removes the most recent message from both UI and store
   */
  const removeLatestMessage = useCallback(() => {
    const updatedMessages = messages.slice(0, -1);
    setMessages(updatedMessages);
    saveMessages(id, updatedMessages as ExtendedMessage[]);
    return updatedMessages;
  }, [messages, setMessages, saveMessages, id]);

  /**
   * Stops the current streaming response and saves state
   */
  const handleStop = useCallback(() => {
    stop();
    saveMessages(id, [...messages as ExtendedMessage[]]);
    setLoadingSubmit(false);
  }, [stop, saveMessages, id, messages]);

  /**
   * Adds selected text as context for the next message
   */
  const handleAddSelectedTextToInput = useCallback((selectedText: string) => {
    const formattedText = selectedText.trim();
    setContextText(formattedText);
  }, []);

  /**
   * Reloads the last message with retry logic
   */
  const reloadCallback = useCallback(async (chatRequestOptions?: ChatRequestOptions) => {
    removeLatestMessage();

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
            <AlertDescription>{apiError}</AlertDescription>
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
