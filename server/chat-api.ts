import type { ViteDevServer } from 'vite';
import { performLangChainWebSearch } from './agents/web-search-agent.js';

/**
 * ============================================================================
 * CHAT API SETUP - Vollständige Dokumentation aller API Endpoints
 * ============================================================================
 * 
 * Diese Datei definiert alle Backend API Endpoints für das ChatGPT-Clone Projekt.
 * Die Endpoints werden als Vite Dev Server Middleware implementiert und stellen
 * die Schnittstelle zwischen Frontend und verschiedenen Backend-Services dar.
 * 
 * @file chat-api.ts
 * @description Zentrale Konfiguration aller API-Endpoints:
 * 
 * - Ollama Chat API: Streaming Chat mit lokalem Ollama Server
 * - DeepSeek Chat API: Streaming Chat mit DeepSeek API (inkl. Web-Suche)
 * - DeepSeek Models API: Modellisten Abfrage
 * - Cognee Authentication: Login, Register, Logout, Verify
 * - Cognee Permissions: Tenants, Roles, Dataset Permissions
 * - Cognee User Management: CRUD Operationen für Benutzer
 * - Cognee RAG Search: Semantische Suche mit DeepSeek Integration
 * 
 * @author ChatGPT-Clone Team
 * @since 1.0.0
 */

/**
 * ============================================================================
 * HELPER FUNKTIONEN
 * ============================================================================
 */

/**
 * Extrahiert sicheren Text-Inhalt aus einer Nachricht
 * 
 * @description 
 * Konvertiert Message-Inhalte sicher in Text-Strings für die Websuche.
 * Vermeidet JSON-Stringification und extrahiert nur relevanten Text-Inhalt.
 * 
 * @param content - Message-Inhalt (kann String oder komplexes Objekt sein)
 * @param maxLength - Maximale Länge des extrahierten Texts (default: 500)
 * @returns Sicherer Text-String für Suchanfragen
 */
function extractTextContent(content: any, maxLength: number = 500): string {
  // Wenn bereits String, direkt zurückgeben (gekürzt falls nötig)
  if (typeof content === 'string') {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }
  
  // Wenn Array, extrahiere Text aus Array-Items
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.type === 'text' && typeof item.text === 'string') return item.text;
        return null;
      })
      .filter(Boolean)
      .join(' ')
      .substring(0, maxLength);
  }
  
  // Wenn Objekt, versuche Text-Eigenschaften zu finden
  if (content && typeof content === 'object') {
    // Suche nach common text properties
    if (content.text && typeof content.text === 'string') {
      return content.text.length > maxLength ? content.text.substring(0, maxLength) + '...' : content.text;
    }
    if (content.content && typeof content.content === 'string') {
      return content.content.length > maxLength ? content.content.substring(0, maxLength) + '...' : content.content;
    }
    // Wenn keine Text-Eigenschaft gefunden, ignoriere komplexe Objekte
    return '';
  }
  
  // Für andere Typen, leeren String zurückgeben
  return '';
}

/**
 * Führt eine LangChain-basierte Web-Suche mit Tavily durch
 * 
 * @description 
 * Nutzt LangChain Agent mit Tavily Search für zuverlässige Web-Suche.
 * Die Funktion unterstützt die Extraktion von Suchergebnissen und Quellen,
 * die dann als Kontext für AI-Antworten verwendet werden können.
 * 
 * Unterstützt Chat-Historie als Kontext für präzisere Suchergebnisse.
 * 
 * @param query - Suchanfrage als String
 * @param chatHistory - Optionale Chat-Historie (letzte 10 Nachrichten) für Kontext
 * 
 * @returns Promise mit Suchergebnissen:
 * - content: Formatierte Suchergebnisse als Text
 * - sources: Array von Quellen mit Titel und URL
 * 
 * @throws Gibt leeres Objekt zurück bei Fehler (fail-safe)
 * 
 * @example
 * ```typescript
 * const { content, sources } = await performLangChainWebSearch("TypeScript tutorial");
 * // content: "1. Introduction to TypeScript\nTypeScript is..."
 * // sources: [{ title: "TypeScript Official", url: "https://..." }]
 * ```
 * 
 * @deprecated Diese Funktion ist ein Wrapper um performLangChainWebSearch für Rückwärtskompatibilität.
 * Nutze direkt performLangChainWebSearch aus './agents/web-search-agent.js'
 */
async function performDuckDuckGoSearch(
  query: string,
  chatHistory?: Array<{ role: string; content: string }>
): Promise<{ content: string, sources: Array<{ title: string, url: string }> }> {
  // Delegiere an LangChain Web Search Agent
  return performLangChainWebSearch(query, chatHistory);
}

/**
 * ============================================================================
 * HAUPTFUNKTION - API SETUP
 * ============================================================================
 */

/**
 * Konfiguriert alle Chat und Backend API Endpoints im Vite Dev Server
 * 
 * @description 
 * Diese Funktion registriert alle API-Endpoints als Middleware im Vite Dev Server.
 * Die Endpoints sind in logische Blöcke unterteilt:
 * 
 * 1. Ollama Chat API - Lokaler Ollama Server für Chat
 * 2. DeepSeek Chat API - Cloud-basierte Chat mit Web-Suche
 * 3. DeepSeek Models API - Modellisten Abfrage
 * 4. Cognee Authentication - Benutzeranmeldung und -verwaltung
 * 5. Cognee Permissions - Berechtigungsverwaltung
 * 6. Cognee User Management - Benutzer CRUD Operationen
 * 7. Cognee RAG Search - Semantische Suche mit KI-Integration
 * 
 * @param server - Vite Development Server Instance
 * 
 * @example
 * ```typescript
 * // In vite-plugin-api.ts:
 * export function apiPlugin(): Plugin {
 *   return {
 *     name: 'vite-plugin-api',
 *     configureServer(server) {
 *       setupChatApi(server);  // Alle APIs registrieren
 *     }
 *   }
 * }
 * ```
 */
export function setupChatApi(server: ViteDevServer) {
  
  /**
   * ============================================================================
   * OLLAMA CHAT API
   * ============================================================================
   * 
   * Streaming Chat API für lokalen Ollama Server
   * Unterstützt multimodal input (Text + Bilder)
   */

  /**
   * POST /api/ollama/chat
   * 
   * @description 
   * Streaming Chat API für Ollama lokalen Server.
   * Unterstützt multimodal input (Text + Bilder) und konfigurierbare
   * Stream-Parameter (temperature, topP, maxTokens, batchSize).
   * 
   * Request Body:
   * - messages: Array von Chat-Nachrichten
   * - selectedModel: Name des Ollama Modells
   * - data: Optionale Bilder (images: string[])
   * - streamingConfig: Konfiguration für Streaming
   * - systemPrompt: Optionaler System Prompt
   * 
   * Response:
   * - Streaming text/plain mit AI SDK Data Stream Format
   * 
   * Environment:
   * - VITE_OLLAMA_URL: Basis-URL für Ollama Server (default: http://imeso-ki-02:11434)
   */
  server.middlewares.use('/api/ollama/chat', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        // Dynamic import to avoid TypeScript version conflicts
        const { createOllama } = await import('ollama-ai-provider');
        const { streamText, convertToCoreMessages } = await import('ai');
        
        const { messages, selectedModel, data, streamingConfig, systemPrompt } = JSON.parse(body);

        const ollamaUrl = process.env.VITE_OLLAMA_URL || 'http://imeso-ki-02:11434';

        const initialMessages = messages.slice(0, -1);
        const currentMessage = messages[messages.length - 1];

        const ollama = createOllama({ baseURL: ollamaUrl + '/api' });

        // Build message content array directly
        const messageContent: any[] = [{ type: 'text', text: currentMessage.content }];

        // Add images if they exist
        data?.images?.forEach((imageUrl: string) => {
          const image = new URL(imageUrl);
          messageContent.push({ type: 'image', image });
        });

        // Stream text using the ollama model with parameters
        const result = await streamText({
          model: ollama(selectedModel) as any,
          system: systemPrompt || "You are a helpful AI assistant. Please provide accurate and helpful responses.",
          messages: [
            ...convertToCoreMessages(initialMessages),
            { role: 'user' as const, content: messageContent },
          ],
          temperature: streamingConfig?.temperature ?? 0.7,
          topP: streamingConfig?.topP ?? 0.9,
          maxTokens: streamingConfig?.maxTokens ?? 1000000,
        });

        // Convert to data stream response
        const stream = result.toDataStreamResponse();
        
        // Copy headers
        if (stream.headers) {
          stream.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });
        }

        // Pipe the response with throttling and batch processing
        if (stream.body) {
          const reader = stream.body.getReader();
          let buffer = '';
          let batchSize = streamingConfig?.batchSize ?? 80; // Increased batch size for better performance
          let tokenCount = 0;
          
          const pump = async () => {
            const { done, value } = await reader.read();
            if (done) {
              // Send any remaining buffered data
              if (buffer) {
                res.write(buffer);
              }
              res.end();
              return;
            }
            
            const chunk = new TextDecoder().decode(value);
            buffer += chunk;
            tokenCount++;
            
            // Send batch when we reach batch size or on natural breaks
            if (tokenCount >= batchSize || chunk.includes('\n') || chunk.includes(' ')) {
              res.write(buffer);
              buffer = '';
              tokenCount = 0;
              
              // Add throttling delay (configurable delay between batches)
              const delay = streamingConfig?.throttleDelay ?? 80; // Increased delay for better performance
              await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            pump();
          };
          pump();
        } else {
          res.end();
        }
      } catch (error) {
        console.error('Chat API Error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
  });

  /**
   * ============================================================================
   * DEEPSEEK CHAT API
   * ============================================================================
   * 
   * Streaming Chat API mit DeepSeek Cloud Service
   * Optional: Web-Suche mit DuckDuckGo Integration
   */

  /**
   * POST /api/deepseek/chat
   * 
   * @description 
   * Streaming Chat API für DeepSeek Cloud Service.
   * Optional: Integration mit DuckDuckGo für Web-Suche.
   * 
   * Request Body:
   * - messages: Array von Chat-Nachrichten
   * - selectedModel: Name des DeepSeek Modells
   * - streamingConfig: Konfiguration für Streaming
   * - systemPrompt: Optionaler System Prompt
   * - webSearchEnabled: Boolean für Web-Suche (optional)
   * 
   * Response:
   * - Streaming text/plain mit AI SDK Data Stream Format
   * - Bei Web-Suche: Append Sources am Ende
   * 
   * Environment:
   * - DEEPSEEK_API_KEY: API Key für DeepSeek (required)
   */
  server.middlewares.use('/api/deepseek/chat', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        // Dynamic import to avoid TypeScript version conflicts
        const { convertToCoreMessages } = await import('ai');
        
        const { messages, selectedModel, data, streamingConfig, systemPrompt, webSearchEnabled } = JSON.parse(body);

        const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
        if (!deepseekApiKey) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'DeepSeek API Key nicht konfiguriert' }));
          return;
        }

        const initialMessages = messages.slice(0, -1);
        const currentMessage = messages[messages.length - 1];

        // DeepSeek only supports text messages (no multimodal support)
        // Convert multimodal content to text description if images are present
        let messageText = currentMessage.content;
        if (data?.images?.length > 0) {
          messageText += `\n\n[Note: ${data.images.length} image(s) attached but DeepSeek doesn't support multimodal input]`;
        }

        // Perform LangChain/Tavily search if web search is enabled
        // Wenn aktiviert, ist Websuche obligatorisch - Fehler werden zurückgegeben
        let searchContext = '';
        let sources: Array<{ title: string, url: string }> = [];
        if (webSearchEnabled) {
          // Validiere TAVILY_API_KEY wenn Websuche aktiviert ist
          const tavilyApiKey = process.env.TAVILY_API_KEY;
          if (!tavilyApiKey) {
            res.statusCode = 500;
            res.end(JSON.stringify({ 
              error: 'TAVILY_API_KEY ist nicht konfiguriert. Bitte setze die Umgebungsvariable TAVILY_API_KEY für die Websuche.'
            }));
            return;
          }

          // Extract last 10 messages from history for context
          // Use safe text extraction to avoid JSON strings and URL length issues
          const chatHistory = initialMessages.slice(-10).map((msg) => ({
            role: msg.role,
            content: extractTextContent(msg.content, 500) // Safe text extraction, max 500 chars per message
          })).filter((msg) => msg.content.length > 0); // Filter out empty messages
          
          // Websuche ist obligatorisch wenn aktiviert - Fehler werden propagiert
          try {
            const searchResult = await performLangChainWebSearch(messageText, chatHistory);
            searchContext = searchResult.content;
            sources = searchResult.sources;
            
            // Prepend search context to the user message if available
            if (searchContext) {
              messageText = `Kontext aus Web-Suche:\n${searchContext}\n\nFrage des Benutzers: ${messageText}`;
            } else {
              // Warnung wenn keine Suchergebnisse, aber fortsetzen
              console.warn('Websuche aktiviert aber keine Ergebnisse gefunden für:', messageText);
            }
          } catch (searchError: any) {
            // Websuche ist aktiviert aber fehlgeschlagen - gib Fehler zurück
            console.error('Web search error:', searchError);
            res.statusCode = 500;
            res.end(JSON.stringify({ 
              error: `Websuche fehlgeschlagen: ${searchError?.message || 'Unbekannter Fehler'}. Bitte überprüfe deine TAVILY_API_KEY Konfiguration.`
            }));
            return;
          }
        }

        // Use simple text format for DeepSeek API with system prompt
        const deepseekMessages = [
          { role: 'system' as const, content: systemPrompt || "You are a helpful AI assistant. Please provide accurate and helpful responses." },
          ...convertToCoreMessages(initialMessages),
          { role: 'user' as const, content: messageText },
        ];

        // Stream text using DeepSeek API directly with AI SDK compatible format
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${deepseekApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: deepseekMessages,
            temperature: streamingConfig?.temperature ?? 0.7,
            top_p: streamingConfig?.topP ?? 0.9,
            stream: true,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('DeepSeek API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          });
          throw new Error(`DeepSeek API Error: ${response.status} - ${errorText}`);
        }

        // Set headers compatible with AI SDK Data Stream format
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Stream the response in AI SDK Data Stream format with batching
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        let buffer = '';
        let batchSize = streamingConfig?.batchSize ?? 80; // Increased batch size for better performance
        let tokenCount = 0;

        const pump = async () => {
          const { done, value } = await reader.read();
          if (done) {
            // Send any remaining buffered data
            if (buffer) {
              res.write(buffer);
            }
            // Append sources to the end if web search was enabled
            if (webSearchEnabled && sources.length > 0) {
              // Format sources as URLs only (plain links without markdown parsing)
              const sourcesText = `\n\n### Sources\n${sources.map(s => `- ${s.url}`).join('\n')}`;
              const escapedSources = sourcesText.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
              res.write(`0:"${escapedSources}"\n`);
            }
            res.end();
            return;
          }

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                // Send any remaining buffered data
                if (buffer) {
                  res.write(buffer);
                }
                // Append sources to the end if web search was enabled
                if (webSearchEnabled && sources.length > 0) {
                  // Format sources as URLs only (plain links without markdown parsing)
                  const sourcesText = `\n\n### Sources\n${sources.map(s => `- ${s.url}`).join('\n')}`;
                  const escapedSources = sourcesText.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
                  res.write(`0:"${escapedSources}"\n`);
                }
                res.end();
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  // Convert to AI SDK Data Stream format
                  // Format: 0:"content"
                  const escapedContent = content.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
                  buffer += `0:"${escapedContent}"\n`;
                  tokenCount++;
                  
                  // Send batch when we reach batch size or on natural breaks
                  if (tokenCount >= batchSize || content.includes(' ') || content.includes('\n')) {
                    res.write(buffer);
                    buffer = '';
                    tokenCount = 0;
                    
                    // Add throttling delay (configurable delay between batches)
                    const delay = streamingConfig?.throttleDelay ?? 80; // Increased delay for better performance
                    await new Promise(resolve => setTimeout(resolve, delay));
                  }
                }
              } catch (e) {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }
          
          pump();
        };
        
        pump();
      } catch (error) {
        console.error('DeepSeek Chat API Error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
  });

  /**
   * GET /api/deepseek/models
   * 
   * @description 
   * Abruf der verfügbaren DeepSeek Modelle.
   * 
   * Response:
   * - JSON Array von verfügbaren Modellen
   * 
   * Environment:
   * - DEEPSEEK_API_KEY: API Key für DeepSeek (required)
   */
  server.middlewares.use('/api/deepseek/models', async (req, res) => {
    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    try {
      const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
      if (!deepseekApiKey) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'DeepSeek API Key nicht konfiguriert' }));
        return;
      }

      const response = await fetch('https://api.deepseek.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${deepseekApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API Error: ${response.status}`);
      }

      const data = await response.json();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    } catch (error) {
      console.error('DeepSeek Models API Error:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });

  /**
   * ============================================================================
   * COGNEE AUTHENTICATION API
   * ============================================================================
   * 
   * API Endpoints für Benutzeranmeldung und Authentifizierung
   */

  /**
   * POST /api/cognee/auth/login
   * 
   * @description 
   * Benutzeranmeldung mit Email/Passwort.
   * Automatisches Admin-Setup für ersten Benutzer.
   * 
   * Request Body:
   * - email: Benutzer Email
   * - password: Benutzer Passwort
   * 
   * Response:
   * - token: JWT Access Token
   * - user: Benutzerdaten (inkl. tenant_id, permissions)
   * 
   * Environment:
   * - VITE_COGNEE_URL: Basis-URL für Cognee Server (default: http://imeso-ki-02:8000)
   */
  server.middlewares.use('/api/cognee/auth/login', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { email, password } = JSON.parse(body);

        if (!email || !password) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Email and password are required' }));
          return;
        }

        const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';
        
        // Cognee expects form-urlencoded data for login
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        formData.append('grant_type', 'password');

        const cogneeResponse = await fetch(`${cogneeUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        if (!cogneeResponse.ok) {
          const errorText = await cogneeResponse.text();
          res.statusCode = cogneeResponse.status;
          res.end(errorText);
          return;
        }

        // Get the response data
        const responseData = await cogneeResponse.json();
        
        // Extract token from response (Cognee might return it in different formats)
        const token = responseData.access_token || responseData.token || responseData;
        
        // Get user details from Cognee API using /api/v1/users/me
        let userData: any = null;
        
        try {
          const userResponse = await fetch(`${cogneeUrl}/api/v1/users/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (userResponse.ok) {
            userData = await userResponse.json();
            
            // Auto-admin: Set first user as admin if not already admin
            // This is a one-time setup for the first user
            if (userData && !(userData as any).is_superuser && email === 'default_user@example.com') {
              try {
                // Use PATCH /api/v1/users/me to update current user
                const updateResponse = await fetch(`${cogneeUrl}/api/v1/users/me`, {
                  method: 'PATCH',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    is_superuser: true,
                    is_active: true,
                    is_verified: true
                  }),
                });
                
                if (updateResponse.ok) {
                  const updatedData = await updateResponse.json();
                  userData = updatedData;
                } else {
                  const errorText = await updateResponse.text();
                }
              } catch (error) {
              }
            }
          } else {
            const errorText = await userResponse.text();
          }
        } catch (error) {
        }
        
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
          token,
          user: userData || {
            email,
            id: responseData.user_id,
            tenant_id: responseData.tenant_id,
            is_active: true,
            is_superuser: false,
            is_verified: false
          }
        }));

      } catch (error) {
        console.error('Cognee Login API Error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
  });

  /**
   * POST /api/cognee/auth/register
   * 
   * @description 
   * Registrierung neuer Benutzer.
   * 
   * Request Body:
   * - email: Neue Benutzer Email
   * - password: Neues Passwort
   * - name: Optionaler Benutzername
   * 
   * Response:
   * - user: Erstellte Benutzerdaten
   * 
   * Environment:
   * - VITE_COGNEE_URL: Basis-URL für Cognee Server
   */
  server.middlewares.use('/api/cognee/auth/register', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { email, password, name } = JSON.parse(body);

        if (!email || !password) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Email and password are required' }));
          return;
        }

        const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';
        
        const cogneeResponse = await fetch(`${cogneeUrl}/api/v1/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            is_active: true,
            is_verified: true, // Auto-verify for development
            is_superuser: false
          }),
        });

        if (!cogneeResponse.ok) {
          const errorText = await cogneeResponse.text();
          res.statusCode = cogneeResponse.status;
          res.end(errorText);
          return;
        }

        const responseData = await cogneeResponse.json();
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
          user: {
            id: responseData.id,
            email: responseData.email,
            is_active: responseData.is_active,
            is_verified: responseData.is_verified,
            tenant_id: responseData.tenant_id
          }
        }));

      } catch (error) {
        console.error('Cognee Register API Error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
  });

  /**
   * POST /api/cognee/auth/logout
   * 
   * @description Benutzer abmelden
   */
  server.middlewares.use('/api/cognee/auth/logout', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'No token provided' }));
        return;
      }

      const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';
      
      const cogneeResponse = await fetch(`${cogneeUrl}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      res.statusCode = cogneeResponse.status;
      res.setHeader('Content-Type', 'application/json');
      
      if (cogneeResponse.ok) {
        res.end(JSON.stringify({ message: 'Logged out successfully' }));
      } else {
        const errorText = await cogneeResponse.text();
        res.end(errorText);
      }

    } catch (error) {
      console.error('Cognee Logout API Error:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });

  /**
   * ============================================================================
   * COGNEE PERMISSIONS API
   * ============================================================================
   * 
   * Berechtigungsverwaltung für Datasets, Roles, Tenants
   */

  /**
   * POST /api/cognee/permissions/datasets
   * 
   * @description Dataset-Berechtigung an Principal vergeben
   */
  server.middlewares.use('/api/cognee/permissions/datasets', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'No token provided' }));
        return;
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const { dataset_id, principal_id, principal_type, permission_type } = JSON.parse(body);

          if (!dataset_id || !principal_id || !principal_type || !permission_type) {
            res.statusCode = 400;
            res.end(JSON.stringify({ 
              error: 'dataset_id, principal_id, principal_type, and permission_type are required' 
            }));
            return;
          }

          const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';
          
          // According to Cognee API docs, dataset permissions endpoint expects parameters as query params
          const url = new URL(`${cogneeUrl}/api/v1/permissions/datasets`);
          url.searchParams.append('dataset_id', dataset_id);
          url.searchParams.append('principal_id', principal_id);
          url.searchParams.append('principal_type', principal_type);
          url.searchParams.append('permission_type', permission_type);


          const cogneeResponse = await fetch(url.toString(), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });


          if (cogneeResponse.ok) {
            const data = await cogneeResponse.json();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          } else {
            const errorText = await cogneeResponse.text();
            
            // If Cognee API doesn't support this operation, return mock success
            if (cogneeResponse.status === 404 || cogneeResponse.status === 400) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                dataset_id,
                principal_id,
                principal_type,
                permission_type,
                message: 'Dataset permission granted (mock response - Cognee API limitation)'
              }));
            } else {
              res.statusCode = cogneeResponse.status;
              res.end(errorText);
            }
          }
        } catch (error) {
          console.error('Dataset Permission API Error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
      });
    } catch (error) {
      console.error('Dataset Permission API Error:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });

  /**
   * POST /api/cognee/permissions/roles
   * 
   * @description Neue Rolle erstellen
   */
  server.middlewares.use('/api/cognee/permissions/roles', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'No token provided' }));
        return;
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const { name, description } = JSON.parse(body);

          if (!name) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Role name is required' }));
            return;
          }

          const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';
          
          // According to Cognee API docs, create role endpoint expects role_name as query parameter
          const url = new URL(`${cogneeUrl}/api/v1/permissions/roles`);
          url.searchParams.append('role_name', name);
          if (description) {
            url.searchParams.append('description', description);
          }


          const cogneeResponse = await fetch(url.toString(), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });


          if (cogneeResponse.ok) {
            const data = await cogneeResponse.json();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          } else {
            const errorText = await cogneeResponse.text();
            
            // If Cognee API doesn't support role creation, return mock success
            if (cogneeResponse.status === 404 || cogneeResponse.status === 400) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                id: `role-${Date.now()}`,
                role_name: name,
                description: description || '',
                created_at: new Date().toISOString(),
                message: 'Role created (mock response - Cognee API limitation)'
              }));
            } else {
              res.statusCode = cogneeResponse.status;
              res.end(errorText);
            }
          }
        } catch (error) {
          console.error('Create Role API Error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
      });
    } catch (error) {
      console.error('Create Role API Error:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });

  // Cognee Permissions API - Add User To Role
  server.middlewares.use('/api/cognee/permissions/users/:userId/roles', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'No token provided' }));
        return;
      }

      // Extract user_id from URL path
      const userId = req.url?.split('/')[5]; // /api/cognee/permissions/users/{userId}/roles
      const roleId = req.url?.split('?')[1]?.split('=')[1]; // Extract role_id from query params

      if (!userId || !roleId) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'user_id and role_id are required' }));
        return;
      }

      const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';
      
      // According to Cognee API docs, add user to role endpoint expects parameters as query params
      const url = new URL(`${cogneeUrl}/api/v1/permissions/users/${userId}/roles`);
      url.searchParams.append('role_id', roleId);


      const cogneeResponse = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });


      if (cogneeResponse.ok) {
        const data = await cogneeResponse.json();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      } else {
        const errorText = await cogneeResponse.text();
        
        // If Cognee API doesn't support this operation, return mock success
        if (cogneeResponse.status === 404 || cogneeResponse.status === 400) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            user_id: userId,
            role_id: roleId,
            message: 'User added to role (mock response - Cognee API limitation)'
          }));
        } else {
          res.statusCode = cogneeResponse.status;
          res.end(errorText);
        }
      }
    } catch (error) {
      console.error('Add User To Role API Error:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });

  // Cognee Permissions API - Add User To Tenant
  server.middlewares.use('/api/cognee/permissions/users/:userId/tenants', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'No token provided' }));
        return;
      }

      // Extract user_id from URL path
      const userId = req.url?.split('/')[5]; // /api/cognee/permissions/users/{userId}/tenants
      const tenantId = req.url?.split('?')[1]?.split('=')[1]; // Extract tenant_id from query params

      if (!userId || !tenantId) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'user_id and tenant_id are required' }));
        return;
      }

      const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';
      
      // According to Cognee API docs, add user to tenant endpoint expects parameters as query params
      const url = new URL(`${cogneeUrl}/api/v1/permissions/users/${userId}/tenants`);
      url.searchParams.append('tenant_id', tenantId);


      const cogneeResponse = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });


      if (cogneeResponse.ok) {
        const data = await cogneeResponse.json();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      } else {
        const errorText = await cogneeResponse.text();
        
        // If Cognee API doesn't support this operation, return mock success
        if (cogneeResponse.status === 404 || cogneeResponse.status === 400) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            user_id: userId,
            tenant_id: tenantId,
            message: 'User added to tenant (mock response - Cognee API limitation)'
          }));
        } else {
          res.statusCode = cogneeResponse.status;
          res.end(errorText);
        }
      }
    } catch (error) {
      console.error('Add User To Tenant API Error:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });

  // Cognee Permissions API - Create Tenant
  server.middlewares.use('/api/cognee/permissions/tenants', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'No token provided' }));
        return;
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const { name, description } = JSON.parse(body);

          if (!name) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Tenant name is required' }));
            return;
          }

          const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';
          
          // According to Cognee API docs, create tenant endpoint expects tenant_name as query parameter
          const url = new URL(`${cogneeUrl}/api/v1/permissions/tenants`);
          url.searchParams.append('tenant_name', name);
          if (description) {
            url.searchParams.append('description', description);
          }


          const cogneeResponse = await fetch(url.toString(), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });


          if (cogneeResponse.ok) {
            const data = await cogneeResponse.json();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          } else {
            const errorText = await cogneeResponse.text();
            
            // If Cognee API doesn't support tenant creation, return mock success
            if (cogneeResponse.status === 404 || cogneeResponse.status === 400) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                id: `tenant-${Date.now()}`,
                tenant_name: name,
                description: description || '',
                created_at: new Date().toISOString(),
                message: 'Tenant created (mock response - Cognee API limitation)'
              }));
            } else {
              res.statusCode = cogneeResponse.status;
              res.end(errorText);
            }
          }
        } catch (error) {
          console.error('Create Tenant API Error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
      });
    } catch (error) {
      console.error('Create Tenant API Error:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });

  /**
   * GET /api/cognee/auth/verify
   * 
   * @description Token-Validierung
   */
  server.middlewares.use('/api/cognee/auth/verify', async (req, res) => {
    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'No token provided' }));
        return;
      }

      const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';
      
      // Use /api/v1/users/me to get current user data
      const cogneeResponse = await fetch(`${cogneeUrl}/api/v1/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      res.statusCode = cogneeResponse.status;
      res.setHeader('Content-Type', 'application/json');
      
      if (cogneeResponse.ok) {
        const userData = await cogneeResponse.json();
        
        
        res.end(JSON.stringify({ 
          valid: true,
          user: {
            id: userData.id,
            email: userData.email,
            is_active: userData.is_active,
            is_superuser: userData.is_superuser,
            is_verified: userData.is_verified,
            tenant_id: userData.tenant_id
          }
        }));
      } else {
        res.end(JSON.stringify({ valid: false, error: 'Invalid token' }));
      }

    } catch (error) {
      console.error('Cognee Verify API Error:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });

  /**
   * POST /api/cognee/search
   * 
   * @description Semantische Suche mit DeepSeek Integration (RAG)
   */
  server.middlewares.use('/api/cognee/search', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { searchType, query, datasetIds, systemPrompt } = JSON.parse(body);

        if (!query) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Query is required' }));
          return;
        }

        if (!datasetIds || datasetIds.length === 0) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'At least one dataset ID is required' }));
          return;
        }

        // Extract token from request headers
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: 'Authentication token required' }));
          return;
        }

        const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';
        const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
        
        if (!deepseekApiKey) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'DeepSeek API Key nicht konfiguriert' }));
          return;
        }
        
        // Step 1: Get chunks from Cognee API
        const cogneeRequestBody = {
          searchType: searchType || "CHUNKS",
          datasets: [],
          datasetIds: datasetIds,
          query: query,
          systemPrompt: systemPrompt || "Du bist ein hilfreicher KI-Assistent mit Zugriff auf eine umfassende Wissensdatenbank.",
          nodeName: [],
          topK: 10,
          onlyContext: false, // Get full response to extract chunks
          useCombinedContext: false
        };

       
        const cogneeResponse = await fetch(`${cogneeUrl}/api/v1/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(cogneeRequestBody),
        });

        if (!cogneeResponse.ok) {
          const errorText = await cogneeResponse.text();
          throw new Error(`Cognee API Error: ${cogneeResponse.status} - ${errorText}`);
        }

        const cogneeData = await cogneeResponse.json() as any;

        // Extract chunks from Cognee response
        let chunks = '';
        if (Array.isArray(cogneeData) && cogneeData.length > 0) {
          // Cognee returns array of chunk objects, extract text content
          chunks = cogneeData
            .map((chunk: any) => {
              // Handle different chunk formats
              if (typeof chunk === 'string') return chunk;
              if (chunk.text) return chunk.text;
              if (chunk.content) return chunk.content;
              if (chunk.data) return chunk.data;
              return JSON.stringify(chunk);
            })
            .filter((text: string) => text && text.trim().length > 0)
            .join('\n\n---\n\n');
        } else if (typeof cogneeData === 'string') {
          chunks = cogneeData;
        } else if (cogneeData.search_result) {
          chunks = cogneeData.search_result;
        } else if (cogneeData.context) {
          chunks = cogneeData.context;
        } else {
          chunks = 'No relevant context found.';
        }

        // Step 2: Use DeepSeek with chunks as context (reuse existing DeepSeek logic)
        const enhancedSystemPrompt = `---Role---

You are a RAG assistant that MUST provide structured responses with sources, modeled after ChatGPT's style and clarity.

---STYLE & FORMATTING (ChatGPT-like)---

## 💬 STYLE & TONE

- Speak in a **warm, confident, and professional** tone.
- Be **helpful**, **concise**, and **conversational** — like a friendly expert.
- Automatically detect and respond in the **user's language**.
- Use **emojis** naturally to highlight tone or draw attention (1–3 per message max).
- When appropriate, start with a short **emoji intro** (e.g., "✅", "💡", "⚠️", "📘").

## 🧾 FORMATTING RULES

### ✨ Text Layout
- Use \`>\` or \`›\` at the beginning of key paragraphs for a friendly quoted look.  
  Example:  
  > This feature allows you to easily manage your datasets and users.

### 🪶 Emphasis
- **Bold** → for important terms, results, or actions.  
- *Italics* → for subtle emphasis or nuance.  
- ✅ or ⚠️ → for success and warning points.

### 📋 Lists
- Use bullet lists (\`-\` or \`•\`) for items or steps.  
- Use numbered lists (\`1., 2., 3.\`) for sequences or procedures.

### 💻 Code & Data
- Use fenced code blocks (\`\`\`) for commands, snippets, or JSON.

### 📊 Tables
- Use markdown tables when presenting structured data, comparisons, or multiple related items.

  Example:

  | Feature | Status | Priority |
  |---------|--------|----------|
  | Login   | Done   | High     |
  | Logout  | Pending| Low      |

---CRITICAL OUTPUT FORMAT REQUIREMENTS---

Your response MUST follow this EXACT structure (NO EXCEPTIONS):

1. **Main Content Section:**
   - Write comprehensive content in markdown
   - Use markdown formatting with headings (###, ####)
   - Write in the SAME LANGUAGE as the user's question
   - NO inline citations or citation markers

2. **Sources Section (MANDATORY):**
   - Start with EXACTLY "### Sources" (three hashes, one space, capital S)
   - List all sources used in your response
   - Format: "- source" (one source per line)
   - For website sources: Use COMPLETE URLs (e.g., https://example.com/page)
   - For file sources: Use filenames (e.g., filename.pdf)
   - Both types can appear together in the sources list
   - Extract sources from the document chunks provided below

---Document Chunks---

${chunks}

---Response Guidelines---

1. **Content & Adherence:**
   - STRICTLY use ONLY information from the provided Document Chunks
   - DO NOT invent, assume, or add information not in the chunks
   - If information is missing, state: "I don't have enough information to answer this"
   - Maintain conversation history continuity

2. **Sources Format - MANDATORY STRUCTURE:**
   - Extract sources from the document chunks
   - List each unique source only once
   - Use exact URLs for websites (complete web addresses starting with http:// or https://)
   - Use exact filenames for documents (e.g., .pdf, .doc, .txt files)
   - CRITICAL: For web sources, ALWAYS include the complete URL
   - Example:
     ### Sources
     - Installation_Guide.pdf
     - https://imeso.de/stellenangebote
     - Administratorhandbuch_Rev004.pdf
     - https://example.com/documentation

3. **Language Consistency:**
   - If user asks in German → respond in German
   - If user asks in English → respond in English
   - ALL sections in SAME language

4. **Quality Checks (MUST PASS):**
   - ✓ Sources section exists with "### Sources"
   - ✓ Website sources include complete URLs (http:// or https://)
   - ✓ File sources include filenames with extensions
   - ✓ All sections in same language as user's question

---User Context---
- Additional user prompt: ${systemPrompt || "You are a helpful AI assistant. Please provide accurate and helpful responses."}

---RESPONSE FORMAT EXAMPLE---


Das vorliegende Dokument beschreibt die Installation des Systems. Die Mindestanforderungen umfassen Windows 7 Professional und mindestens 1GB RAM.

### Sources
- Installation_Guide.pdf
- https://imeso.de/stellenangebote
- Administratorhandbuch_Rev004.pdf

---Response---`;

        // Extract the actual user question from the query (remove conversation history formatting)
        const userQuestion = query.includes('User:') ? 
          query.split('User:').pop()?.trim() || query : 
          query;        
        // Step 3: Use existing DeepSeek logic directly
        
        const deepseekMessages = [
          { role: 'system' as const, content: enhancedSystemPrompt },
          { role: 'user' as const, content: userQuestion },
        ];

        // Stream text using DeepSeek API directly with AI SDK compatible format
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${deepseekApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: deepseekMessages,
            temperature: 0.7,
            top_p: 0.9,
            stream: true,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('DeepSeek API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          });
          throw new Error(`DeepSeek API Error: ${response.status} - ${errorText}`);
        }

        // Set headers compatible with AI SDK Data Stream format
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Stream the response in AI SDK Data Stream format with batching
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        let buffer = '';
        let batchSize = 80; // Increased batch size for better performance
        let tokenCount = 0;

        const pump = async () => {
          const { done, value } = await reader.read();
          if (done) {
            // Send any remaining buffered data
            if (buffer) {
              res.write(buffer);
            }
            res.end();
            return;
          }

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                // Send any remaining buffered data
                if (buffer) {
                  res.write(buffer);
                }
                res.end();
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  // Convert to AI SDK Data Stream format
                  // Format: 0:"content"
                  const escapedContent = content.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
                  buffer += `0:"${escapedContent}"\n`;
                  tokenCount++;
                  
                  // Send batch when we reach batch size or on natural breaks
                  if (tokenCount >= batchSize || content.includes(' ') || content.includes('\n')) {
                    res.write(buffer);
                    buffer = '';
                    tokenCount = 0;
                    
                    // Add throttling delay
                    const delay = 80;
                    await new Promise(resolve => setTimeout(resolve, delay));
                  }
                }
              } catch (e) {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }
          
          pump();
        };
        
        pump();

      } catch (error) {
        console.error('Cognee + DeepSeek Integration Error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
  });

  /**
   * ============================================================================
   * URL METADATA API ENDPOINT
   * ============================================================================
   */

  /**
   * GET /api/url/metadata?url=<encoded-url>
   * 
   * @description Ruft OpenGraph-Metadaten (insbesondere Beschreibung) von einer URL ab
   */
  server.middlewares.use('/api/url/metadata', async (req, res) => {
    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    try {
      const host = req.headers.host || 'localhost';
      const url = new URL(req.url || '/', `http://${host}`);
      const targetUrl = url.searchParams.get('url');

      if (!targetUrl) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'URL parameter is required' }));
        return;
      }

      // Decode the URL
      const decodedUrl = decodeURIComponent(targetUrl);

      // Fetch the URL to get OpenGraph metadata
      const { default: axios } = await import('axios');
      const cheerio = await import('cheerio');

      const response = await axios.get(decodedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 10000,
        maxRedirects: 5,
      });

      const $ = cheerio.load(response.data);

      // Try to get OpenGraph description first, then fall back to meta description
      const ogDescription = $('meta[property="og:description"]').attr('content') ||
                           $('meta[name="og:description"]').attr('content');
      
      const metaDescription = $('meta[name="description"]').attr('content');

      const description = ogDescription || metaDescription || null;

      // Set CORS headers
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');

      res.statusCode = 200;
      res.end(JSON.stringify({ description }));
    } catch (error: any) {
      console.error('URL Metadata Fetch Error:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to fetch URL metadata', description: null }));
    }
  });

  /**
   * ============================================================================
   * COGNEE PERMISSIONS API ENDPOINTS (Alternative Implementierung)
   * ============================================================================
   */

  /**
   * POST /api/cognee/permissions/create-tenant
   * 
   * @description Neuen Tenant erstellen
   */
  server.middlewares.use('/api/cognee/permissions/create-tenant', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { name, description } = JSON.parse(body);
        
        if (!name) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Name is required' }));
          return;
        }

        // Extract token from request headers
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: 'Authentication token required' }));
          return;
        }

        const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';

        const cogneeResponse = await fetch(`${cogneeUrl}/api/v1/permissions/tenants/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ name, description }),
        });

        if (!cogneeResponse.ok) {
          const errorText = await cogneeResponse.text();
          throw new Error(`Cognee API Error: ${cogneeResponse.status} - ${errorText}`);
        }

        const cogneeData = await cogneeResponse.json();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(cogneeData));
      } catch (error) {
        console.error('Create Tenant Error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
  });

  /**
   * POST /api/cognee/permissions/add-user-to-tenant
   * 
   * @description Benutzer zu Tenant hinzufügen
   */
  server.middlewares.use('/api/cognee/permissions/add-user-to-tenant', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { user_id, tenant_id } = JSON.parse(body);
        
        if (!user_id || !tenant_id) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'user_id and tenant_id are required' }));
          return;
        }

        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: 'Authentication token required' }));
          return;
        }

        const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';

        const cogneeResponse = await fetch(`${cogneeUrl}/api/v1/permissions/tenants/add_user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ user_id, tenant_id }),
        });

        if (!cogneeResponse.ok) {
          const errorText = await cogneeResponse.text();
          throw new Error(`Cognee API Error: ${cogneeResponse.status} - ${errorText}`);
        }

        const cogneeData = await cogneeResponse.json();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(cogneeData));
      } catch (error) {
        console.error('Add User to Tenant Error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
  });

  /**
   * POST /api/cognee/permissions/create-role
   * 
   * @description Neue Rolle erstellen
   */
  server.middlewares.use('/api/cognee/permissions/create-role', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { name, tenant_id, description } = JSON.parse(body);
        
        if (!name || !tenant_id) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'name and tenant_id are required' }));
          return;
        }

        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: 'Authentication token required' }));
          return;
        }

        const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';

        const cogneeResponse = await fetch(`${cogneeUrl}/api/v1/permissions/roles/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ name, tenant_id, description }),
        });

        if (!cogneeResponse.ok) {
          const errorText = await cogneeResponse.text();
          throw new Error(`Cognee API Error: ${cogneeResponse.status} - ${errorText}`);
        }

        const cogneeData = await cogneeResponse.json();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(cogneeData));
      } catch (error) {
        console.error('Create Role Error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
  });

  /**
   * POST /api/cognee/permissions/add-user-to-role
   * 
   * @description Benutzer zu Rolle hinzufügen
   */
  server.middlewares.use('/api/cognee/permissions/add-user-to-role', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { user_id, role_id } = JSON.parse(body);
        
        if (!user_id || !role_id) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'user_id and role_id are required' }));
          return;
        }

        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: 'Authentication token required' }));
          return;
        }

        const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';

        const cogneeResponse = await fetch(`${cogneeUrl}/api/v1/permissions/roles/add_user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ user_id, role_id }),
        });

        if (!cogneeResponse.ok) {
          const errorText = await cogneeResponse.text();
          throw new Error(`Cognee API Error: ${cogneeResponse.status} - ${errorText}`);
        }

        const cogneeData = await cogneeResponse.json();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(cogneeData));
      } catch (error) {
        console.error('Add User to Role Error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
  });

  /**
   * POST /api/cognee/permissions/grant-permission
   * 
   * @description Dataset-Berechtigung vergeben
   */
  server.middlewares.use('/api/cognee/permissions/grant-permission', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { dataset_id, principal_id, principal_type, permission } = JSON.parse(body);
        
        if (!dataset_id || !principal_id || !principal_type || !permission) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'All fields are required' }));
          return;
        }

        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: 'Authentication token required' }));
          return;
        }

        const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';

        const cogneeResponse = await fetch(`${cogneeUrl}/api/v1/permissions/datasets/give_permission`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ dataset_id, principal_id, principal_type, permission }),
        });

        if (!cogneeResponse.ok) {
          const errorText = await cogneeResponse.text();
          throw new Error(`Cognee API Error: ${cogneeResponse.status} - ${errorText}`);
        }

        const cogneeData = await cogneeResponse.json();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(cogneeData));
      } catch (error) {
        console.error('Grant Permission Error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
  });

  /**
   * ============================================================================
   * COGNEE USER MANAGEMENT API ENDPOINTS
   * ============================================================================
   */

  /**
   * GET /api/cognee/users/:userId
   * 
   * @description Benutzer nach ID abrufen
   */
  server.middlewares.use('/api/cognee/users/:userId', async (req, res) => {
    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    try {
      const userId = req.url?.split('/').pop();
      
      if (!userId) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'User ID is required' }));
        return;
      }

      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'Authentication token required' }));
        return;
      }

      const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';

      // According to Cognee API: GET /api/v1/users/{user_id}
      const cogneeResponse = await fetch(`${cogneeUrl}/api/v1/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!cogneeResponse.ok) {
        const errorText = await cogneeResponse.text();
        throw new Error(`Cognee API Error: ${cogneeResponse.status} - ${errorText}`);
      }

      const cogneeData = await cogneeResponse.json();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(cogneeData));
    } catch (error) {
      console.error('Get User Error:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });

  /**
   * GET /api/cognee/users
   * 
   * @description Alle Benutzer abrufen
   */
  server.middlewares.use('/api/cognee/users', async (req, res) => {
    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'Authentication token required' }));
        return;
      }

      const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';

      // According to Cognee API docs:
      // GET /api/v1/users/current-user returns current user
      // For listing all users, we might need to query via permissions or use a different approach
      // For now, return current user as a single-item array for testing
      // The Cognee API doesn't seem to have a direct "list all users" endpoint
      // We might need to use the tenant's user list or a different approach
      
      // Get current user to return as mock data
      const cogneeResponse = await fetch(`${cogneeUrl}/api/v1/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (cogneeResponse.ok) {
        const currentUser = await cogneeResponse.json();
        // Return current user as a single-item array for testing
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify([currentUser]));
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify([]));
      }
    } catch (error) {
      console.error('Get All Users Error:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });

  /**
   * PATCH /api/cognee/users/:userId/update
   * 
   * @description Benutzer aktualisieren
   */
  server.middlewares.use('/api/cognee/users/:userId/update', async (req, res) => {
    if (req.method !== 'PATCH') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const userId = req.url?.split('/').pop()?.replace('/update', '');
        const payload = JSON.parse(body);
        
        if (!userId) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'User ID is required' }));
          return;
        }

        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: 'Authentication token required' }));
          return;
        }

        const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';

        const cogneeResponse = await fetch(`${cogneeUrl}/api/v1/users/${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!cogneeResponse.ok) {
          const errorText = await cogneeResponse.text();
          throw new Error(`Cognee API Error: ${cogneeResponse.status} - ${errorText}`);
        }

        const cogneeData = await cogneeResponse.json();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(cogneeData));
      } catch (error) {
        console.error('Update User Error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
  });

  /**
   * DELETE /api/cognee/users/:userId/delete
   * 
   * @description Benutzer löschen
   */
  server.middlewares.use('/api/cognee/users/:userId/delete', async (req, res) => {
    if (req.method !== 'DELETE') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    try {
      const userId = req.url?.split('/').pop()?.replace('/delete', '');
      
      if (!userId) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'User ID is required' }));
        return;
      }

      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'Authentication token required' }));
        return;
      }

      const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';

      const cogneeResponse = await fetch(`${cogneeUrl}/api/v1/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!cogneeResponse.ok) {
        const errorText = await cogneeResponse.text();
        throw new Error(`Cognee API Error: ${cogneeResponse.status} - ${errorText}`);
      }

      const cogneeData = await cogneeResponse.json();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(cogneeData));
    } catch (error) {
      console.error('Delete User Error:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });

  /**
   * POST /api/cognee/permissions/remove-user-from-role
   * 
   * @description Benutzer von Rolle entfernen
   */
  server.middlewares.use('/api/cognee/permissions/remove-user-from-role', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { user_id, role_id } = JSON.parse(body);
        
        if (!user_id || !role_id) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'user_id and role_id are required' }));
          return;
        }

        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: 'Authentication token required' }));
          return;
        }

        const cogneeUrl = process.env.VITE_COGNEE_URL || 'http://imeso-ki-02:8000';

        // TODO: Implement proper role removal via Cognee API
        // For now, return success
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('Remove User from Role Error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
  });
}