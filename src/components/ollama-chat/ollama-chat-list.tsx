import { Message } from "ai/react";
import type { ChatRequestOptions } from "ai";
import OllamaChatMessage from "./ollama-chat-message";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import {
  ChatBubble,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";

/**
 * Props for the OllamaChatList component
 */
interface ChatListProps {
  messages: Message[];
  isLoading: boolean;
  loadingSubmit?: boolean;
  reload: (chatRequestOptions?: ChatRequestOptions) => Promise<string | null | undefined>;
  isCogneeMode?: boolean;
}

/**
 * OllamaChatList - Chat message list component
 * 
 * This component renders the list of all chat messages and displays
 * a loading indicator when a new message is being submitted.
 * It supports both general chat mode and Cognee mode.
 * 
 * @param {ChatListProps} props - Props for the chat list
 * @param {Message[]} props.messages - Array of chat messages
 * @param {boolean} props.isLoading - Indicates if the chat is loading
 * @param {boolean} props.loadingSubmit - Indicates if a message is being sent
 * @param {Function} props.reload - Function to reload the last message
 * @param {boolean} props.isCogneeMode - Indicates if Cognee mode is active
 * 
 * @returns {JSX.Element} List with chat messages and loading indicator
 */
export default function OllamaChatList({
  messages,
  isLoading,
  loadingSubmit,
  reload,
  isCogneeMode = false,
}: ChatListProps) {
  return (
    <div className="flex-1 w-full overflow-y-auto">
      <ChatMessageList>
        {/* Render all messages */}
        {messages.map((message, index) => (
          <OllamaChatMessage
            key={message.id || index}
            message={message}
            isLast={index === messages.length - 1}
            isSecondLast={index === messages.length - 2}
            isLoading={isLoading}
            reload={reload}
            isCogneeMode={isCogneeMode}
          />
        ))}
        
        {/* Show loading indicator during submission */}
        {loadingSubmit && (
          <ChatBubble variant="received">
            <ChatBubbleMessage isLoading />
          </ChatBubble>
        )}
      </ChatMessageList>
    </div>
  );
}
