import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/ollama-chat')({
  component: OllamaChatLayout,
});

function OllamaChatLayout() {
  return <Outlet />;
}
