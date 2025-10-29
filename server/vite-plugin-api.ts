import type { Plugin, ViteDevServer } from 'vite';
import { config } from 'dotenv';
import { setupChatApi } from './chat-api';

// Load environment variables from .env file
config();

/**
 * Vite Plugin für Chat API Endpoints
 * 
 * @description 
 * Erstellt ein Vite Plugin, das die Middleware für die Entwicklungsumgebung
 * konfiguriert. Dieses Plugin integriert alle Chat- und Backend-API-Endpoints
 * in den Vite Dev Server, sodass sie während der Entwicklung verfügbar sind.
 * 
 * Verwendet die setupChatApi Funktion zur Konfiguration aller Endpoints:
 * - Ollama Chat API (/api/ollama/chat)
 * - DeepSeek Chat API (/api/deepseek/chat)
 * - DeepSeek Models API (/api/deepseek/models)
 * - Cognee Authentication APIs (/api/cognee/auth/*)
 * - Cognee Permissions APIs (/api/cognee/permissions/*)
 * - Cognee User Management APIs (/api/cognee/users/*)
 * - Cognee Search API (/api/cognee/search)
 * 
 * @returns {Plugin} Vite Plugin Konfiguration mit konfiguriertem Server
 * 
 * @example
 * ```typescript
 * // In vite.config.ts:
 * import { apiPlugin } from './server/vite-plugin-api';
 * 
 * export default defineConfig({
 *   plugins: [
 *     apiPlugin(),
 *     // ... andere plugins
 *   ]
 * })
 * ```
 */
export function apiPlugin(): Plugin {
  return {
    name: 'vite-plugin-api',
    
    /**
     * Konfiguriert den Vite Dev Server mit Chat API Middleware
     * 
     * @param server - Vite Development Server Instance
     */
    configureServer(server: ViteDevServer) {
      setupChatApi(server);
    },
  };
}
