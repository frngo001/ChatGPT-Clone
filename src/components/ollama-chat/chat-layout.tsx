"use client";

import OllamaChat, { ChatProps } from "./ollama-chat";

/**
 * ChatLayout - Layout wrapper component for Ollama Chat
 * 
 * This component provides the layout for the chat interface and
 * is a simple wrapper that centers the OllamaChat component.
 * 
 * @param {ChatProps} props - Props for the ChatLayout
 * @param {Message[]} props.initialMessages - Initial messages for the chat
 * @param {string} props.id - Unique ID for the chat
 * 
 * @returns {JSX.Element} Layout container with centered chat
 */
export function ChatLayout({ initialMessages, id }: ChatProps) {
  return (
    <div className="h-full w-full flex justify-center">
      <OllamaChat id={id} initialMessages={initialMessages} />
    </div>
  );
}
