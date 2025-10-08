import type { Plugin, ViteDevServer } from 'vite';
import { setupChatApi } from './chat-api';

export function apiPlugin(): Plugin {
  return {
    name: 'vite-plugin-api',
    configureServer(server: ViteDevServer) {
      setupChatApi(server);
    },
  };
}
