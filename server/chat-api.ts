import type { ViteDevServer } from 'vite';

/**
 * Sets up chat API endpoints for Ollama and DeepSeek providers
 * 
 * @description Configures Vite dev server middleware to handle chat API requests.
 * Provides streaming chat functionality for both Ollama and DeepSeek AI providers
 * with support for multimodal input (text and images).
 * 
 * @param server - Vite development server instance
 */
export function setupChatApi(server: ViteDevServer) {
  // Ollama Chat API
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
          let batchSize = streamingConfig?.batchSize ?? 20; // Increased batch size for DeepSeek
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
              const delay = streamingConfig?.throttleDelay ?? 50;
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

  // DeepSeek Chat API
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
        
        const { messages, selectedModel, data, streamingConfig, systemPrompt } = JSON.parse(body);

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
        let batchSize = streamingConfig?.batchSize ?? 20; // Increased batch size for DeepSeek
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
                    
                    // Add throttling delay (configurable delay between batches)
                    const delay = streamingConfig?.throttleDelay ?? 30; // Reduced delay for DeepSeek
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

  // DeepSeek Models API
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

  // Cognee Search API with DeepSeek Integration
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
        const { searchType, query, datasets, systemPrompt } = JSON.parse(body);

        if (!query) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Query is required' }));
          return;
        }

        if (!datasets || datasets.length === 0) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'At least one dataset is required' }));
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
          datasets: datasets,
          datasetIds: [],
          query: query,
          systemPrompt: systemPrompt || "Du bist ein hilfreicher KI-Assistent mit Zugriff auf eine umfassende Wissensdatenbank.",
          nodeName: [],
          topK: 20,
          onlyContext: false, // Get full response to extract chunks
          useCombinedContext: false
        };

       
        const cogneeResponse = await fetch(`${cogneeUrl}/api/v1/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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

You are a RAG assistant that MUST provide structured responses with sources.

---CRITICAL OUTPUT FORMAT REQUIREMENTS---

Your response MUST follow this EXACT structure (NO EXCEPTIONS):

1. **Main Content Section:**
   - Write comprehensive content in markdown
   - Use markdown formatting with headings (###, ####)
   - Write in the SAME LANGUAGE as the user's question
   - NO inline citations or citation markers

2. **Sources Section (MANDATORY):**
   - Start with EXACTLY "### Sources" (three hashes, one space, capital S)
   - List only the filenames used in your response
   - Format: "- filename.pdf" (one filename per line)
   - Extract filenames from the document chunks provided below

---Document Chunks---

${chunks}

---Response Guidelines---

1. **Content & Adherence:**
   - STRICTLY use ONLY information from the provided Document Chunks
   - DO NOT invent, assume, or add information not in the chunks
   - If information is missing, state: "I don't have enough information to answer this"
   - Maintain conversation history continuity

2. **Sources Format - MANDATORY STRUCTURE:**
   - Extract filenames from the document chunks
   - List each unique filename only once
   - Use the exact filename as it appears in the chunks
   - Example:
     ### Sources
     - Installation_Guide.pdf
     - Administratorhandbuch_Rev004.pdf
     - Systemhandbuch_v2.1.pdf

3. **Language Consistency:**
   - If user asks in German → respond in German
   - If user asks in English → respond in English
   - ALL sections in SAME language

4. **Quality Checks (MUST PASS):**
   - ✓ Sources section exists with "### Sources"
   - ✓ Only filenames listed (no additional details)
   - ✓ All sections in same language as user's question

---User Context---
- Additional user prompt: ${systemPrompt || "You are a helpful AI assistant. Please provide accurate and helpful responses."}

---RESPONSE FORMAT EXAMPLE---


Das vorliegende Dokument beschreibt die Installation des Systems. Die Mindestanforderungen umfassen Windows 7 Professional und mindestens 1GB RAM.

### Sources
- Installation_Guide.pdf
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
        let batchSize = 20;
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
                    const delay = 30;
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
}