"use client";

import React, { useState } from "react";
import { Message } from "@/components/chat/chat-message";
import Chat, { ChatProps } from "@/components/chat/chat";


export function ChatLayout({
  initialMessages,
  id,
  selectedModel,
  setSelectedModel,
  models,
}: ChatProps) {
  const [isMobile, setIsMobile] = useState(false);

  return (
    <div className="h-screen w-full flex justify-center">
      <Chat 
        id={id} 
        initialMessages={initialMessages} 
        isMobile={isMobile}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        models={models}
      />
    </div>
  );
}
