import { Message } from "ai";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Extended Message type that includes attachments for persistence
interface ExtendedMessage extends Message {
  experimental_attachments?: Array<{
    contentType?: string;
    url: string;
  }>;
}

interface ChatSession {
  messages: ExtendedMessage[];
  createdAt: string;
}

interface State {
  base64Images: string[] | null;
  chats: Record<string, ChatSession>;
  currentChatId: string | null;
  selectedModel: string | null;
  selectedProvider: 'ollama' | 'deepseek';
  userName: string | "Anonymous";
  isDownloading: boolean;
  downloadProgress: number;
  downloadingModel: string | null;
  // Chat settings
  temperature: number;
  topP: number;
  maxTokens: number;
  batchSize: number;
  throttleDelay: number;
  systemPrompt: string;
}

interface Actions {
  setBase64Images: (base64Images: string[] | null) => void;
  setCurrentChatId: (chatId: string) => void;
  setSelectedModel: (selectedModel: string) => void;
  setSelectedProvider: (provider: 'ollama' | 'deepseek') => void;
  getChatById: (chatId: string) => ChatSession | undefined;
  getMessagesById: (chatId: string) => ExtendedMessage[];
  saveMessages: (chatId: string, messages: ExtendedMessage[]) => void;
  updateMessage: (chatId: string, messageId: string, content: string) => void;
  handleDelete: (chatId: string, messageId?: string) => void;
  setUserName: (userName: string) => void;
  startDownload: (modelName: string) => void;
  stopDownload: () => void;
  setDownloadProgress: (progress: number) => void;
  // Chat settings actions
  setTemperature: (temperature: number) => void;
  setTopP: (topP: number) => void;
  setMaxTokens: (maxTokens: number) => void;
  setBatchSize: (batchSize: number) => void;
  setThrottleDelay: (throttleDelay: number) => void;
  setSystemPrompt: (systemPrompt: string) => void;
}

const useOllamaChatStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      base64Images: null,
      chats: {},
      currentChatId: null,
      selectedModel: null,
      selectedProvider: 'ollama',
      userName: "Anonymous",
      isDownloading: false,
      downloadProgress: 0,
      downloadingModel: null,
      // Chat settings defaults
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1000000,
      batchSize: 20,
      throttleDelay: 50,
      systemPrompt: "You are a helpful AI assistant. Please provide accurate and helpful responses.", 

      setBase64Images: (base64Images) => set({ base64Images }),
      setUserName: (userName) => set({ userName }),

      setCurrentChatId: (chatId) => set({ currentChatId: chatId }),
      setSelectedModel: (selectedModel) => set({ selectedModel }),
      setSelectedProvider: (selectedProvider) => set({ selectedProvider }),
      getChatById: (chatId) => {
        const state = get();
        return state.chats[chatId];
      },
      getMessagesById: (chatId) => {
        const state = get();
        return state.chats[chatId]?.messages || [];
      },
      saveMessages: (chatId, messages) => {
        set((state) => {
          const existingChat = state.chats[chatId];

          return {
            chats: {
              ...state.chats,
              [chatId]: {
                messages: [...messages],
                createdAt: existingChat?.createdAt || new Date().toISOString(),
              },
            },
          };
        });
      },
      handleDelete: (chatId, messageId) => {
        set((state) => {
          const chat = state.chats[chatId];
          if (!chat) return state;

          // If messageId is provided, delete specific message
          if (messageId) {
            const updatedMessages = chat.messages.filter(
              (message) => message.id !== messageId
            );
            return {
              chats: {
                ...state.chats,
                [chatId]: {
                  ...chat,
                  messages: updatedMessages,
                },
              },
            };
          }

          // If no messageId, delete the entire chat
          const { [chatId]: _, ...remainingChats } = state.chats;
          return {
            chats: remainingChats,
          };
        });
      },

      updateMessage: (chatId, messageId, content) => {
        set((state) => {
          const chat = state.chats[chatId];
          if (!chat) return state;

          const updatedMessages = chat.messages.map((message) =>
            message.id === messageId ? { ...message, content } : message
          );

          return {
            chats: {
              ...state.chats,
              [chatId]: {
                ...chat,
                messages: updatedMessages,
              },
            },
          };
        });
      },

      startDownload: (modelName) =>
        set({ isDownloading: true, downloadingModel: modelName, downloadProgress: 0 }),
      stopDownload: () =>
        set({ isDownloading: false, downloadingModel: null, downloadProgress: 0 }),
      setDownloadProgress: (progress) => set({ downloadProgress: progress }),
      // Chat settings actions
      setTemperature: (temperature) => set({ temperature }),
      setTopP: (topP) => set({ topP }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setBatchSize: (batchSize) => set({ batchSize }),
      setThrottleDelay: (throttleDelay) => set({ throttleDelay }),
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
    }),
    {
      name: "nextjs-ollama-ui-state",
      partialize: (state) => ({
        chats: state.chats,
        currentChatId: state.currentChatId,
        selectedModel: state.selectedModel,
        selectedProvider: state.selectedProvider,
        userName: state.userName,
        temperature: state.temperature,
        topP: state.topP,
        maxTokens: state.maxTokens,
        batchSize: state.batchSize,
        throttleDelay: state.throttleDelay,
        systemPrompt: state.systemPrompt,
      }),
    }
  )
);

export default useOllamaChatStore;
