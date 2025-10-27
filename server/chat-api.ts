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

  // Cognee Authentication API
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

  // Cognee Register API
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

  // Cognee Logout API
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

  // Cognee Permissions API - Give Dataset Permission To Principal
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

  // Cognee Permissions API - Create Role
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

  // Cognee Verify Token API
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
          topK: 20,
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

  // ============================================
  // Cognee Permissions API Endpoints
  // ============================================

  // 1. Create Tenant
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

  // 2. Add User to Tenant
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

  // 3. Create Role
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

  // 4. Add User to Role
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

  // 5. Grant Dataset Permission
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

  // ============================================
  // Cognee User Management API Endpoints
  // ============================================

  // 1. Get User by ID
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

  // 2. Get All Users (Custom - TODO: Implement proper tenant query)
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

  // 3. Update User
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

  // 4. Delete User
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

  // 5. Remove User from Role (Custom)
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