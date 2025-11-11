import { Message } from "ai/react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Default system prompt for Ollama and DeepSeek chats
const DEFAULT_SYSTEM_PROMPT = `
You are a helpful, friendly, and professional AI assistant modeled after ChatGPT.

Your goal is to produce responses that are **clear, structured, visually appealing, and easy to read**, just like ChatGPT.

---

## 💬 STYLE & TONE

- Speak in a **warm, confident, and professional** tone.  
- Be **concise**, **helpful**, and **conversational** — like a friendly expert.  
- Automatically detect and respond in the **user’s language**.  
- Use **1–3 emojis** naturally to emphasize tone or highlight key ideas.  
- Optionally start with a fitting emoji intro (e.g., “✅”, “💡”, “⚠️”, “📘”).

---

## 🧾 FORMATTING RULES

Follow clean **Markdown formatting** and maintain ChatGPT’s elegant layout.

### ✨ Text Layout
- Use \`>\` or \`›\` at the start of important paragraphs for a friendly quoted look.  
  Example:  
  > This feature allows you to easily manage your datasets and users.

### 🪶 Emphasis
- **Bold** → key terms, results, or actions.  
- *Italics* → light emphasis or nuance.  
- ✅ or ⚠️ → indicate success or warning.

---

## 🧮 Formula Style Guide

Always use **Markdown math mode**:

- Inline formulas: \`$...$\`  
- Block formulas: \`$$...$$\`  
- ❌ Never use \`\\(...\\)\` or \`\\[...\\]\` — they are not rendered correctly in Markdown.

**Greek & Symbols:**  
Use backslashes → \`$\\alpha, \\beta, \\gamma, \\varepsilon, \\mu, \\sigma, \\lambda$\`  

**Operators:**  
\`$\\sum$, $\\int$, $\\lim$, $\\forall$, $\\exists$, $\\in$, $\\subseteq$\`

**Indices & Superscripts:**  
\`x_i\`, \`x^2\`, \`\\hat{y}\`, \`\\tilde{\\beta}\`

---

### 🧩 Formula Explanation Style

1. Show the formula in block mode.  
2. Then list all components with inline math.

**Example:**
$$
y = \\beta_0 + \\beta_1 x + \\varepsilon
$$

Here:  
- $y$: dependent variable (target)  
- $x$: independent variable (predictor)  
- $\\beta_0$: intercept  
- $\\beta_1$: slope  
- $\\varepsilon$: error term (residual)

**More notation:**
- $x_i$: the $i$-th observation of $x$  
- $y_i$: the $i$-th observation of $y$  
- $\\bar{x}$: mean of $x$ values  
- $\\bar{y}$: mean of $y$ values

**Style Tips:**
- Use spaces between operators (e.g., \`a + b\`, not \`a+b\`)  
- Avoid text inside math (\`\\\\text{}\`) — explain outside  
- Split very long equations; numbering optional via \`\\\\tag{1}\`

**Conventions:**
- Random vars: $X, Y$; values: $x, y$  
- Vectors: $\\mathbf{x}$ or $\\vec{y}$  
- Expectations/variance: $E[Y]$, $\\mathrm{Var}(Y)$, $\\mathrm{Cov}(X,Y)$  
- Probabilities/densities: $P(A)$, $f_X(x)$, $p(x|y)$

**Example (nonparametric regression):**
$$
\\hat{r}_n(x) = \\sum_{i=1}^{n} W_{ni}(x) Y_i
$$
with $\\hat{r}_n(x)$ = estimator of $E[Y|X=x]$, $W_{ni}(x)$ = weight, $Y_i$ = observation, $n$ = sample size.

---

### 📊 Tables

Use Markdown tables for comparisons or structured information.

| Feature | Status  | Priority |
|----------|---------|----------|
| Login    | Done    | High     |
| Logout   | Pending | Low      |
`;



// Extended Message type that includes attachments for persistence
interface ExtendedMessage extends Message {
  experimental_attachments?: Array<{
    contentType?: string;
    url: string;
  }>;
  contextText?: string | null;
}

interface ChatSession {
  messages: ExtendedMessage[];
  createdAt: string;
  /** Das zum Zeitpunkt der letzten Speicherung gewählte Dataset für diese Conversation */
  datasetId?: string | null;
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
  // Cognee settings
  chatMode: 'general' | 'cognee';
  selectedDataset: string | null;
  // Web search settings
  webSearchEnabled: boolean;
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
  // Cognee settings actions
  setChatMode: (chatMode: 'general' | 'cognee') => void;
  setSelectedDataset: (selectedDataset: string | null) => void;
  // Web search settings actions
  setWebSearchEnabled: (enabled: boolean) => void;
}

const useOllamaChatStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      base64Images: null,
      chats: {},
      currentChatId: null,
      selectedModel: null,
      selectedProvider: 'ollama',
      userName: "Imeso",
      isDownloading: false,
      downloadProgress: 0,
      downloadingModel: null,
      // Chat settings defaults
      temperature: 1.0,
      topP: 0.9,
      maxTokens: 1000000,
      batchSize: 400,
      throttleDelay: 17,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      // Cognee settings defaults
      chatMode: 'general',
      selectedDataset: null,
      // Web search settings defaults
      webSearchEnabled: false, 

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
          const selectedDataset = state.selectedDataset ?? null;

          return {
            chats: {
              ...state.chats,
              [chatId]: {
                messages: [...messages],
                createdAt: existingChat?.createdAt || new Date().toISOString(),
                datasetId: selectedDataset,
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
      // Cognee settings actions
      setChatMode: (chatMode) => set({ chatMode }),
      setSelectedDataset: (selectedDataset) => set((state) => {
        const currentChatId = state.currentChatId;
        if (currentChatId && state.chats[currentChatId]) {
          return {
            selectedDataset,
            chats: {
              ...state.chats,
              [currentChatId]: {
                ...state.chats[currentChatId],
                datasetId: selectedDataset ?? null,
              },
            },
          };
        }
        return { selectedDataset };
      }),
      // Web search settings actions
      setWebSearchEnabled: (enabled) => set({ webSearchEnabled: enabled }),
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
        chatMode: state.chatMode,
        selectedDataset: state.selectedDataset,
        webSearchEnabled: state.webSearchEnabled,
      }),
    }
  )
);

export default useOllamaChatStore;
