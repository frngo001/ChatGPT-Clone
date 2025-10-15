import OllamaChatTopbar from "./ollama-chat-topbar";
import OllamaChatList from "./ollama-chat-list";
import OllamaChatBottombar from "./ollama-chat-bottombar";
import type { Message, ChatRequestOptions } from "ai";
import { useChat } from "ai/react";
import React, { useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import useOllamaChatStore from "@/stores/ollama-chat-store";
import { useNavigate } from "@tanstack/react-router";
import { WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Type definition for Attachment
type Attachment = {
  contentType?: string;
  url: string;
};

// Extended Message type that includes attachments for persistence
interface ExtendedMessage extends Message {
  experimental_attachments?: Array<{
    contentType?: string;
    url: string;
  }>;
}

export interface ChatProps {
  id: string;
  initialMessages: ExtendedMessage[] | [];
}

export default function OllamaChat({ initialMessages, id }: ChatProps) {
  const navigate = useNavigate();
  const [apiError, setApiError] = React.useState<string | null>(null);
  
  const base64Images = useOllamaChatStore((state) => state.base64Images);
  const setBase64Images = useOllamaChatStore((state) => state.setBase64Images);
  const selectedModel = useOllamaChatStore((state) => state.selectedModel);
  const selectedProvider = useOllamaChatStore((state) => state.selectedProvider);
  const saveMessages = useOllamaChatStore((state) => state.saveMessages);
  const getMessagesById = useOllamaChatStore((state) => state.getMessagesById);
  // Chat settings from store
  const temperature = useOllamaChatStore((state) => state.temperature);
  const topP = useOllamaChatStore((state) => state.topP);
  const maxTokens = useOllamaChatStore((state) => state.maxTokens);
  const batchSize = useOllamaChatStore((state) => state.batchSize);
  const throttleDelay = useOllamaChatStore((state) => state.throttleDelay);
  const systemPrompt = useOllamaChatStore((state) => state.systemPrompt);
  
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
    api: selectedProvider === 'ollama' ? "/api/ollama/chat" : "/api/deepseek/chat",
    onResponse: (response) => {
      if (response) {
        setLoadingSubmit(false);
        setApiError(null); // Clear error on successful response
      }
    },
    onFinish: (message) => {
      const savedMessages = getMessagesById(id);
      saveMessages(id, [...savedMessages, message as ExtendedMessage]);
      setLoadingSubmit(false);
      setApiError(null); // Clear error on successful completion
      navigate({ to: `/ollama-chat/${id}` });
    },
    onError: (error) => {
      setLoadingSubmit(false);
      console.error(error.message);
      console.error(error);
      
      // Determine error type and show appropriate message
      let errorMessage = "Ein unbekannter Fehler ist aufgetreten.";
      
      if (error.message.includes("Failed to fetch") || 
          error.message.includes("NetworkError") ||
          error.message.includes("Connection refused") ||
          error.message.includes("ECONNREFUSED")) {
        errorMessage = "Verbindungsproblem: Der Ollama-Server ist nicht erreichbar. Bitte überprüfen Sie, ob der Server läuft.";
      } else if (error.message.includes("Internal Server Error") ||
                 error.message.includes("500") ||
                 error.message.includes("llama runner process has terminated")) {
        errorMessage = "Server-Fehler: Der Ollama-Server hat ein Problem. Bitte starten Sie den Server neu oder überprüfen Sie die Modell-Konfiguration.";
      } else if (error.message.includes("timeout") || 
                 error.message.includes("TIMEOUT")) {
        errorMessage = "Zeitüberschreitung: Die Anfrage dauert zu lange. Bitte versuchen Sie es erneut.";
      } else if (error.message.includes("model") && 
                 error.message.includes("not supported")) {
        errorMessage = "Modell-Fehler: Das gewählte Modell wird nicht unterstützt. Bitte wählen Sie ein anderes Modell.";
      }
      
      setApiError(errorMessage);
      toast.error("Chat-Fehler", {
        description: errorMessage,
        duration: 8000,
      });
    },
  });
  
  const [loadingSubmit, setLoadingSubmit] = React.useState(false);

  // Update messages when initialMessages or id changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [id, initialMessages, setMessages]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.history.replaceState({}, "", `/ollama-chat/${id}`);

    if (!selectedModel) {
      toast.error("Please select a model");
      return;
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: input,
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

    const requestOptions: ChatRequestOptions = {
      body: {
        selectedModel: selectedModel,
        systemPrompt: systemPrompt,
        streamingConfig: {
          temperature: temperature,
          topP: topP,
          maxTokens: maxTokens,
          batchSize: batchSize,
          throttleDelay: throttleDelay,
        },
      },
      ...(base64Images && {
        data: {
          images: base64Images,
        },
        experimental_attachments: attachments,
      }),
    };

    handleSubmit(e, requestOptions);
    saveMessages(id, [...messages as ExtendedMessage[], userMessage as ExtendedMessage]);
    setBase64Images(null);
  };

  const removeLatestMessage = () => {
    const updatedMessages = messages.slice(0, -1);
    setMessages(updatedMessages);
    saveMessages(id, updatedMessages as ExtendedMessage[]);
    return updatedMessages;
  };

  const handleStop = () => {
    stop();
    saveMessages(id, [...messages as ExtendedMessage[]]);
    setLoadingSubmit(false);
  };

  return (
    <div className="flex flex-col w-full max-w-5xl h-full ollama-chat-container">
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
            reload={async () => {
              removeLatestMessage();

              const requestOptions: ChatRequestOptions = {
                body: {
                  selectedModel: selectedModel,
                  streamingConfig: {
                    temperature: 0.7,
                    topP: 0.9,
                    maxTokens: 10000,
                    batchSize: 10,
                    throttleDelay: 20,
                  }
                },
              };

              setLoadingSubmit(true);
              return reload(requestOptions);
            }}
          />
          <OllamaChatBottombar
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={onSubmit}
            isLoading={isLoading}
            stop={handleStop}
            setInput={setInput}
          />
        </>
      )}
    </div>
  );
}
