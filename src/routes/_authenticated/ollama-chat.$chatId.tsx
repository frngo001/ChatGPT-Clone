import { createFileRoute } from '@tanstack/react-router';
import { ChatLayout } from '@/components/ollama-chat/chat-layout';
import useOllamaChatStore from '@/stores/ollama-chat-store';
import { useEffect } from 'react';

export const Route = createFileRoute('/_authenticated/ollama-chat/$chatId')({
  component: OllamaChatDetailPage,
});

function OllamaChatDetailPage() {
  const { chatId } = Route.useParams();
  const getMessagesById = useOllamaChatStore((state) => state.getMessagesById);
  const setCurrentChatId = useOllamaChatStore((state) => state.setCurrentChatId);
  const messages = getMessagesById(chatId);

  // Update current chat ID when route changes
  useEffect(() => {
    setCurrentChatId(chatId);
  }, [chatId, setCurrentChatId]);

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col items-center">
      <ChatLayout
        key={chatId}
        id={chatId}
        initialMessages={messages}
      />
    </div>
  );
}