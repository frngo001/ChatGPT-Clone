import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChatLayout } from '@/components/ollama-chat/chat-layout';
import { v4 as uuidv4 } from 'uuid';
import { useEffect, useState } from 'react';
import { useDatasetStore } from '@/stores/dataset-store';
import useOllamaChatStore from '@/stores/ollama-chat-store';
import { ErrorBoundary } from '@/components/error-boundary';
import { ErrorRedirect } from '@/components/error-redirect';

function ChatIndexPageWithErrorBoundary() {
  return (
    <ErrorBoundary
      fallback={<ErrorRedirect />}
      onError={(error, errorInfo) => {
        // Log error in production (e.g., to Sentry)
        if (import.meta.env.PROD) {
          console.error('Chat Index Error:', error, errorInfo);
          // TODO: Send to error tracking service
          // Sentry.captureException(error, { contexts: { react: errorInfo } })
        }
      }}
    >
      <ChatIndexPage />
    </ErrorBoundary>
  );
}

export const Route = createFileRoute('/_authenticated/chat/')({
  component: ChatIndexPageWithErrorBoundary
});

function ChatIndexPage() {
  const navigate = useNavigate();
  // Generate a new ID on mount
  const [id] = useState(() => uuidv4());
  // Selektive Store-Selektoren: Nur die benötigten Properties abonnieren
  // Verhindert unnötige Re-renders der Chat-Index-Seite bei Store-Updates
  const datasets = useDatasetStore((state) => state.datasets)
  const isLoading = useDatasetStore((state) => state.isLoading)
  const error = useDatasetStore((state) => state.error)
  const fetchDatasets = useDatasetStore((state) => state.fetchDatasets)
  const chatMode = useOllamaChatStore((state) => state.chatMode);
  const selectedDataset = useOllamaChatStore((state) => state.selectedDataset);
  const setSelectedDataset = useOllamaChatStore((state) => state.setSelectedDataset);

  // Wähle beim Start eines neuen Chats das erste verfügbare Dataset als Default
  useEffect(() => {
    const ensureDatasets = async () => {
      // Prüfe ob Datasets vollständig geladen sind (haben processingStatus)
      // Nach einem Reload können Datasets aus dem persistierten Zustand kommen,
      // aber ohne processingStatus (wird nicht persistiert)
      const hasDatasetsWithoutStatus = datasets.length > 0 && 
        datasets.some(d => !d.processingStatus)
      
      // Lade Datasets wenn keine vorhanden oder unvollständig
      if ((datasets.length === 0 || hasDatasetsWithoutStatus) && !isLoading && !error) {
        try { await fetchDatasets(); } catch { /* ignore */ }
      }
    };
    ensureDatasets();
  }, [datasets.length, isLoading, error, fetchDatasets, datasets]);

  useEffect(() => {
    // Only set default dataset in cognee mode
    if (chatMode === 'cognee' && !selectedDataset && datasets.length > 0) {
      const available = datasets.filter((d) => d.files && d.files.length > 0 && d.processingStatus === 'DATASET_PROCESSING_COMPLETED');
      if (available.length > 0) {
        setSelectedDataset(available[0].id);
      }
    }
  }, [chatMode, selectedDataset, datasets]);

  // Navigate to the new chat route immediately
  // navigate ist stabil und muss nicht in Dependencies sein
  useEffect(() => {
    navigate({ to: `/chat/${id}`, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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