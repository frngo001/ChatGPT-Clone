import type { Plugin, ViteDevServer } from 'vite';
import { setupChatApi } from './chat-api';

/**
 * Vite plugin for setting up chat API endpoints
 * 
 * @description Creates a Vite plugin that configures development server
 * middleware to handle chat API requests for Ollama and DeepSeek providers.
 * 
 * @returns {Plugin} Vite plugin configuration
 */
export function apiPlugin(): Plugin {
  return {
    name: 'vite-plugin-api',
    configureServer(server: ViteDevServer) {
      setupChatApi(server);
    },
  };
}
