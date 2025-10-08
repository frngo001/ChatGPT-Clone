import { createFileRoute } from '@tanstack/react-router';
import { ChatLayout } from '@/components/ollama-chat/chat-layout';
import { Header } from '@/components/layout/header';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ModelSelector } from '@/components/ollama-chat/model-selector';
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
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <div className='mx-auto flex items-center'>
          <ModelSelector />
        </div>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <div className="flex h-[calc(100dvh-4rem)] flex-col items-center">
        <ChatLayout
          key={chatId}
          id={chatId}
          initialMessages={messages}
        />
      </div>
    </>
  );
}