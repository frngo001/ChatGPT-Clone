import { Message } from "ai/react";

/**
 * Props for the OllamaChatTopbar component
 */
interface ChatTopbarProps {
  isLoading: boolean;
  chatId?: string;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
}

/**
 * OllamaChatTopbar - Topbar component for Ollama Chat
 * 
 * This component is currently empty since the sidebar functionality
 * is handled by the main app sidebar.
 * 
 * @param {ChatTopbarProps} _props - Props (currently not used)
 * @returns {null} Returns null since the topbar is empty
 */
export default function OllamaChatTopbar(_props: ChatTopbarProps) {
  // Topbar is currently empty - sidebar is handled by the main app sidebar
  return null;
}
