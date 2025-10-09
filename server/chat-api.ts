import type { ViteDevServer } from 'vite';

export function setupChatApi(server: ViteDevServer) {
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
        
        const { messages, selectedModel, data, streamingConfig } = JSON.parse(body);

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
          messages: [
            ...convertToCoreMessages(initialMessages),
            { role: 'user' as const, content: messageContent },
          ],
          temperature: streamingConfig?.temperature ?? 0.7,
          topP: streamingConfig?.topP ?? 0.9,
          maxTokens: streamingConfig?.maxTokens ?? 2048,
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
          let batchSize = streamingConfig?.batchSize ?? 3; // Number of tokens to batch together
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
}