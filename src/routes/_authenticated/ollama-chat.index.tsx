import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChatLayout } from '@/components/ollama-chat/chat-layout';
import { Header } from '@/components/layout/header';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ModelSelector } from '@/components/ollama-chat/model-selector';
import { v4 as uuidv4 } from 'uuid';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/_authenticated/ollama-chat/')({
  component: OllamaChatIndexPage,
});

function OllamaChatIndexPage() {
  const navigate = useNavigate();
  // Generate a new ID on mount
  const [id] = useState(() => uuidv4());

  // Navigate to the new chat route immediately
  useEffect(() => {
    navigate({ to: `/ollama-chat/${id}`, replace: true });
  }, [id, navigate]);

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
          key={id}
          id={id}
          initialMessages={[]}
        />
      </div>
    </>
  );
}
