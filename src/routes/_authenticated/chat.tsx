import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/chat')({
  component: ChatLayout,
});

function ChatLayout() {
  return <Outlet />;
}

