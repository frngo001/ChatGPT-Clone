// External dependencies
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

// UI Components
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

// Store and state management
import useOllamaChatStore from '@/stores/ollama-chat-store'

// Validation schema for chat settings form
// Defines the structure and validation rules for all chat configuration fields
const chatFormSchema = z.object({
  selectedProvider: z.enum(['ollama', 'deepseek']), // AI provider selection
  temperature: z.number().min(0).max(2), // Controls response creativity (0-2)
  topP: z.number().min(0).max(1), // Controls token diversity (0-1)
  maxTokens: z.number().min(1).max(10000000), // Maximum response length
  batchSize: z.number().min(1).max(100), // Tokens processed simultaneously
  throttleDelay: z.number().min(0).max(1000), // Delay between streaming updates (ms)
  systemPrompt: z.string().min(1).max(2000), // AI behavior definition
})

// TypeScript type inferred from the Zod schema
type ChatFormValues = z.infer<typeof chatFormSchema>

/**
 * ChatForm Component
 * 
 * A comprehensive form for configuring AI chat settings including:
 * - AI provider selection (Ollama/DeepSeek)
 * - Model parameters (temperature, top-p, max tokens)
 * - Streaming configuration (batch size, throttle delay)
 * - System prompt customization
 * 
 * All settings are persisted in the Zustand store and applied to chat requests.
 */
export function ChatForm() {
  // Extract current values and setter functions from the Zustand store
  const {
    // Current values
    selectedProvider,
    temperature,
    topP,
    maxTokens,
    batchSize,
    throttleDelay,
    systemPrompt,
    // Setter functions
    setSelectedProvider,
    setTemperature,
    setTopP,
    setMaxTokens,
    setBatchSize,
    setThrottleDelay,
    setSystemPrompt,
  } = useOllamaChatStore()

  // Initialize React Hook Form with validation and default values from store
  const form = useForm<ChatFormValues>({
    resolver: zodResolver(chatFormSchema), // Use Zod for form validation
    defaultValues: {
      // Pre-populate form with current store values
      selectedProvider,
      temperature,
      topP,
      maxTokens,
      batchSize,
      throttleDelay,
      systemPrompt,
    },
  })

  /**
   * Handle form submission
   * 
   * Updates the Zustand store with new form values and shows a success notification.
   * All changes are immediately available for chat requests.
   * 
   * @param data - Validated form data from React Hook Form
   */
  function onSubmit(data: ChatFormValues) {
    // Update store with new values - these will be used in chat requests
    setSelectedProvider(data.selectedProvider)
    setTemperature(data.temperature)
    setTopP(data.topP)
    setMaxTokens(data.maxTokens)
    setBatchSize(data.batchSize)
    setThrottleDelay(data.throttleDelay)
    setSystemPrompt(data.systemPrompt)
    
    // Show success notification to user
    toast.success('Chat-Einstellungen erfolgreich gespeichert!')
  }

  return (
    <div className="bg-background">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* System Prompt Section */}
          {/* Defines the AI's behavior and personality */}
          <div className="p-4">
            <FormField
              control={form.control}
              name="systemPrompt"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel className="text-sm font-medium">System-Prompt</FormLabel>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Du bist ein hilfreicher KI-Assistent..."
                      className="min-h-[80px] text-sm"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Definiert KI-Verhalten und Persönlichkeit
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* AI Provider Selection */}
          {/* Choose between local Ollama or cloud-based DeepSeek */}
          <div className="p-4">
            <FormField
              control={form.control}
              name="selectedProvider"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">KI-Anbieter</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-48 h-8">
                          <SelectValue placeholder="KI-Anbieter auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ollama">Ollama (Lokal)</SelectItem>
                        <SelectItem value="deepseek">DeepSeek (Cloud)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ollama: lokal & kostenlos | DeepSeek: Cloud & API-Schlüssel
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Temperature Control */}
          {/* Controls response creativity: 0.0 (deterministic) to 2.0 (very creative) */}
          <div className="p-4">
            <FormField
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">Temperatur</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={2}
                        step={0.1}
                        value={field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        className="w-24 h-8"
                      />
                    </FormControl>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Kreativität: 0.0 (deterministisch) bis 2.0 (kreativ)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Top-P Control */}
          {/* Controls token diversity: 0.0 (most likely tokens) to 1.0 (all tokens) */}
          <div className="p-4">
            <FormField
              control={form.control}
              name="topP"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">Top-P</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step={0.05}
                        value={field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        className="w-24 h-8"
                      />
                    </FormControl>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Token-Vielfalt: 0.0 (fokussiert) bis 1.0 (vielfältig)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Max Tokens Control */}
          {/* Maximum number of tokens in AI responses */}
          <div className="p-4">
            <FormField
              control={form.control}
              name="maxTokens"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">Max. Tokens</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={10000000}
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="w-32 h-8"
                      />
                    </FormControl>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximale Antwortlänge in Tokens
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Batch Size Control */}
          {/* Number of tokens processed simultaneously (affects speed vs memory usage) */}
          <div className="p-4">
            <FormField
              control={form.control}
              name="batchSize"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">Batch-Größe</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="w-24 h-8"
                      />
                    </FormControl>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gleichzeitig verarbeitete Tokens
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Throttle Delay Control */}
          {/* Delay between streaming updates in milliseconds (affects smoothness vs network traffic) */}
          <div className="p-4">
            <FormField
              control={form.control}
              name="throttleDelay"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">Verzögerung (ms)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={1000}
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="w-24 h-8"
                      />
                    </FormControl>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verzögerung zwischen Streaming-Updates (ms)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Submit Button */}
          {/* Saves all settings to the Zustand store */}
          <div className="p-4">
            <Button type="submit" className="w-full h-9">
              Einstellungen speichern
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
