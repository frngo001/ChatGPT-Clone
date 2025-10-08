"use client";

import OllamaChat, { ChatProps } from "./ollama-chat";

export function ChatLayout({
  initialMessages,
  id,
}: ChatProps) {
  return (
    <div className="h-full w-full flex justify-center">
      <OllamaChat id={id} initialMessages={initialMessages} />
    </div>
  );
}
