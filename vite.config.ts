import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// Internal plugins
import { apiPlugin } from './server/vite-plugin-api'

/**
 * Vite configuration for Agent AI application
 * 
 * @description Configures Vite with React, TanStack Router, Tailwind CSS,
 * and custom API plugin for development server.
 */
export default defineConfig({
  // Plugin configuration
  plugins: [
    // TanStack Router with automatic code splitting
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    
    // React with SWC for fast compilation
    react(),
    
    // Tailwind CSS integration
    tailwindcss(),
    
    // Custom API plugin for chat endpoints
    apiPlugin(),
  ],

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Development server configuration
  server: {
    proxy: {
      // Proxy Ollama API requests to local server
      '/api/tags': {
        target: 'http://imeso-ki-02:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tags/, '/api/tags'),
      },
    },
  },
})
