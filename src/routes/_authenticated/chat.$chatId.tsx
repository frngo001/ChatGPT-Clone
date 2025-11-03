import { createFileRoute } from '@tanstack/react-router';
import { ChatLayout } from '@/components/ollama-chat/chat-layout';
import useOllamaChatStore from '@/stores/ollama-chat-store';
import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { ChatErrorFallback } from '@/components/chat/chat-error-fallback';

function ChatDetailPage() {
  const { chatId } = Route.useParams();
  const getMessagesById = useOllamaChatStore((state) => state.getMessagesById);
  const getChatById = useOllamaChatStore((state) => state.getChatById);
  const setCurrentChatId = useOllamaChatStore((state) => state.setCurrentChatId);
  const setSelectedDataset = useOllamaChatStore((state) => state.setSelectedDataset);
  const messages = getMessagesById(chatId);

  // Update current chat ID when route changes
  useEffect(() => {
    setCurrentChatId(chatId);
    // Beim Laden einer Conversation das gespeicherte Dataset sofort setzen
    const chat = getChatById(chatId);
    if (chat && typeof chat.datasetId !== 'undefined') {
      setSelectedDataset(chat.datasetId ?? null);
    }
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

function ChatDetailPageWithErrorBoundary() {
  // Get chatId from route params for resetKeys
  const params = Route.useParams();
  
  return (
    <ErrorBoundary
      fallback={<ChatErrorFallback />}
      onError={(error, errorInfo) => {
        // Log error in production (e.g., to Sentry)
        if (import.meta.env.PROD) {
          console.error('Chat Detail Error:', error, errorInfo);
          // TODO: Send to error tracking service
          // Sentry.captureException(error, { contexts: { react: errorInfo } })
        }
      }}
      resetKeys={[params.chatId]}
    >
      <ChatDetailPage />
    </ErrorBoundary>
  );
}

export const Route = createFileRoute('/_authenticated/chat/$chatId')({
  component: ChatDetailPageWithErrorBoundary,
});