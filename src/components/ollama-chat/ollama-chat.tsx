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

// Type definition for Attachment
type Attachment = {
  contentType?: string;
  url: string;
};

export interface ChatProps {
  id: string;
  initialMessages: Message[] | [];
}

export default function OllamaChat({ initialMessages, id }: ChatProps) {
  const navigate = useNavigate();
  
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
    api: "/api/ollama/chat",
    onResponse: (response) => {
      if (response) {
        setLoadingSubmit(false);
      }
    },
    onFinish: (message) => {
      const savedMessages = getMessagesById(id);
      saveMessages(id, [...savedMessages, message]);
      setLoadingSubmit(false);
      navigate({ to: `/ollama-chat/${id}` });
    },
    onError: (error) => {
      setLoadingSubmit(false);
      navigate({ to: "/ollama-chat" });
      console.error(error.message);
      console.error(error);
    },
  });
  
  const [loadingSubmit, setLoadingSubmit] = React.useState(false);
  const base64Images = useOllamaChatStore((state) => state.base64Images);
  const setBase64Images = useOllamaChatStore((state) => state.setBase64Images);
  const selectedModel = useOllamaChatStore((state) => state.selectedModel);
  const saveMessages = useOllamaChatStore((state) => state.saveMessages);
  const getMessagesById = useOllamaChatStore((state) => state.getMessagesById);

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
      },
      ...(base64Images && {
        data: {
          images: base64Images,
        },
        experimental_attachments: attachments,
      }),
    };

    handleSubmit(e, requestOptions);
    saveMessages(id, [...messages, userMessage]);
    setBase64Images(null);
  };

  const removeLatestMessage = () => {
    const updatedMessages = messages.slice(0, -1);
    setMessages(updatedMessages);
    saveMessages(id, updatedMessages);
    return updatedMessages;
  };

  const handleStop = () => {
    stop();
    saveMessages(id, [...messages]);
    setLoadingSubmit(false);
  };

  return (
    <div className="flex flex-col w-full max-w-3xl h-full">
      <OllamaChatTopbar
        isLoading={isLoading}
        chatId={id}
        messages={messages}
        setMessages={setMessages}
      />

      {messages.length === 0 ? (
        <div className="flex flex-col h-full w-full items-center gap-4 justify-center">
          <img
            src="/images/favicon.png"
            alt="AI"
            width={40}
            height={40}
            className="h-16 w-14 object-contain"
          />
          <p className="text-center text-base text-muted-foreground">
            How can I help you today?
          </p>
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
