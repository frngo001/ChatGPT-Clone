import React from "react";
import { Message } from "ai/react";

interface ChatTopbarProps {
  isLoading: boolean;
  chatId?: string;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
}

export default function OllamaChatTopbar({
  isLoading,
  chatId,
  messages,
  setMessages,
}: ChatTopbarProps) {
  // Topbar is now empty - sidebar is handled by main app sidebar
  return null;
}
