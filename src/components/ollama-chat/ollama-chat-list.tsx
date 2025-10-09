import { Message } from "ai/react";
import type { ChatRequestOptions } from "ai";
import OllamaChatMessage from "./ollama-chat-message";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import {
  ChatBubble,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";

interface ChatListProps {
  messages: Message[];
  isLoading: boolean;
  loadingSubmit?: boolean;
  reload: (
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
}

export default function OllamaChatList({
  messages,
  isLoading,
  loadingSubmit,
  reload,
}: ChatListProps) {
  return (
    <div className="flex-1 w-full overflow-y-auto">
      <ChatMessageList>
        {messages.map((message, index) => (
          <OllamaChatMessage
            key={message.id || index}
            message={message}
            isLast={index === messages.length - 1}
            isSecondLast={index === messages.length - 2}
            isLoading={isLoading}
            reload={reload}
          />
        ))}
        {loadingSubmit && (
          <ChatBubble variant="received">
            <ChatBubbleMessage isLoading />
          </ChatBubble>
        )}
      </ChatMessageList>
    </div>
  );
}
