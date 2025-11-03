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

  // ✅ Optimized: Build-Konfiguration für besseres Code-Splitting
  build: {
    rollupOptions: {
      output: {
        // Optimiere Chunk-Größen durch manuelle Chunks
        manualChunks: (id) => {
          // Icon chunks - Group custom icons together for better loading
          if (id.includes('assets/custom/icon-') || id.includes('assets/brand-icons/icon-')) {
            return 'icons'
          }
          
          // Vendor chunks - Group by library type
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') && (id.includes('/react/') || id.includes('/react-dom/'))) {
              return 'react-vendor'
            }
            // TanStack libraries
            if (id.includes('@tanstack')) {
              return 'tanstack-vendor'
            }
            // Radix UI components
            if (id.includes('@radix-ui')) {
              return 'ui-vendor'
            }
            // PDF Viewer - Heavy library
            if (id.includes('@react-pdf-viewer')) {
              return 'pdf-viewer'
            }
            // Markdown libraries - Heavy
            if (id.includes('react-markdown') || id.includes('remark-') || id.includes('rehype-') || id.includes('katex')) {
              return 'markdown'
            }
            // Other vendor code
            return 'vendor'
          }
        },
        // Optimiere Chunk-Namen für besseres Caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Erhöhe Chunk-Warnung-Limit (wenn Chunks zu groß werden)
    chunkSizeWarningLimit: 1000,
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
      // Proxy Cognee API requests to avoid CORS issues
      '/api/v1': {
        target: 'http://imeso-ki-02:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
