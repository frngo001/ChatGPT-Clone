import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChatLayout } from '@/components/ollama-chat/chat-layout';
import { v4 as uuidv4 } from 'uuid';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/_authenticated/chat/')({
  component: ChatIndexPage,
});

function ChatIndexPage() {
  const navigate = useNavigate();
  // Generate a new ID on mount
  const [id] = useState(() => uuidv4());

  // Navigate to the new chat route immediately
  useEffect(() => {
    navigate({ to: `/chat/${id}`, replace: true });
  }, [id, navigate]);

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col items-center">
      <ChatLayout
        key={id}
        id={id}
        initialMessages={[]}
      />
    </div>
  );
}