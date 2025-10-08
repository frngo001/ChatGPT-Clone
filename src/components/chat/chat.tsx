"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import ChatTopbar from "./chat-topbar";
import ChatList from "./chat-list";
import ChatBottombar from "./chat-bottombar";
import { Message } from "./chat-message";
import { useChatStore } from "@/stores/chat-store";

export interface ChatProps {
  id: string;
  initialMessages: Message[] | [];
  isMobile?: boolean;
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
  models?: string[];
}

export default function Chat({ 
  id, 
  selectedModel, 
  setSelectedModel,
  models = []
}: ChatProps) {
  const { addMessage, getChatById, createChatIfNotExists, removeLastMessage } = useChatStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [base64Images, setBase64Images] = useState<string[] | null>(null);

  // Note: Chat must be created explicitly via the "Neuer Chat" button
  // No automatic chat creation here

  // Load messages from store when chat changes
  useEffect(() => {
    console.log('Loading chat with ID:', id);
    const chat = getChatById(id);
    console.log('Chat loaded:', { id, chat, messages: chat?.messages });
    if (chat && chat.messages.length > 0) {
      setMessages(chat.messages);
    } else {
      // If chat doesn't exist yet (new chat), start with empty messages
      setMessages([]);
    }
  }, [id, getChatById]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedModel) {
      toast.error("Bitte wählen Sie ein Modell aus");
      return;
    }

    if (!input.trim()) return;

    // Stelle sicher, dass der Chat existiert, bevor wir eine Nachricht hinzufügen
    // Dies erstellt den Chat mit einer echten UUID, falls es ein neuer Chat ist
    const currentChatId = createChatIfNotExists(id, selectedModel);

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: input,
      timestamp: new Date(),
      experimental_attachments: base64Images ? base64Images.map((image) => ({
        contentType: "image/base64",
        url: image,
      })) : undefined,
    };

    // Add user message to store (der Chat wird automatisch erstellt, falls er nicht existiert)
    addMessage(currentChatId, userMessage);
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoadingSubmit(true);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: `Das ist eine simulierte Antwort auf: "${userMessage.content}". In einer echten Implementierung würde hier eine API-Anfrage an ein KI-Modell gestellt.`,
        timestamp: new Date(),
      };
      
      // Add AI message to store
      addMessage(currentChatId, aiMessage);
      setMessages(prev => [...prev, aiMessage]);
      setLoadingSubmit(false);
      setIsLoading(false);
    }, 2000);

    setBase64Images(null);
  };

  const handleStop = () => {
    setIsLoading(false);
    setLoadingSubmit(false);
  };

  const handleReload = async () => {
    if (messages.length === 0) return;
    
    // Get the actual chat ID (might be different from the initial temp ID)
    const currentChat = getChatById(id);
    const actualChatId = currentChat ? currentChat.id : id;
    
    // Remove the last assistant message from both local state and store
    const updatedMessages = messages.slice(0, -1);
    setMessages(updatedMessages);
    removeLastMessage(actualChatId);
    
    setLoadingSubmit(true);
    setIsLoading(true);

    // Simulate regenerated response
    setTimeout(() => {
      const lastUserMessage = updatedMessages[updatedMessages.length - 1];
      const regeneratedMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: `Regenerierte Antwort auf: "${lastUserMessage.content}". Dies ist eine neue, verbesserte Version der Antwort.`,
        timestamp: new Date(),
      };
      
      // Add regenerated message to store
      addMessage(actualChatId, regeneratedMessage);
      setMessages(prev => [...prev, regeneratedMessage]);
      setLoadingSubmit(false);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col w-full max-w-3xl h-full">
      <ChatTopbar
        isLoading={isLoading}
        chatId={id}
        messages={messages}
        setMessages={setMessages}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        models={models}
      />

      {messages.length === 0 ? (
        <div className="flex flex-col h-full w-full items-center gap-4 justify-center">
          <div className="h-16 w-14 flex items-center justify-center">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold">AI</span>
            </div>
          </div>
          <p className="text-center text-base text-muted-foreground">
            How can I help you today?
          </p>
          <ChatBottombar
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={handleStop}
            setInput={setInput}
            base64Images={base64Images}
            setBase64Images={setBase64Images}
            selectedModel={selectedModel}
          />
        </div>
      ) : (
        <>
          <ChatList
            messages={messages}
            isLoading={isLoading}
            loadingSubmit={loadingSubmit}
            reload={handleReload}
          />
          <ChatBottombar
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={handleStop}
            setInput={setInput}
            base64Images={base64Images}
            setBase64Images={setBase64Images}
            selectedModel={selectedModel}
          />
        </>
      )}
    </div>
  );
}
