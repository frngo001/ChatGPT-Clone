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
  // Extract current values and setter functions from the Zustand store using specific selectors
  // ✅ Optimized: Using specific selectors instead of subscribing to entire store
  const selectedProvider = useOllamaChatStore((state) => state.selectedProvider)
  const temperature = useOllamaChatStore((state) => state.temperature)
  const topP = useOllamaChatStore((state) => state.topP)
  const maxTokens = useOllamaChatStore((state) => state.maxTokens)
  const systemPrompt = useOllamaChatStore((state) => state.systemPrompt)
  const setSelectedProvider = useOllamaChatStore((state) => state.setSelectedProvider)
  const setTemperature = useOllamaChatStore((state) => state.setTemperature)
  const setTopP = useOllamaChatStore((state) => state.setTopP)
  const setMaxTokens = useOllamaChatStore((state) => state.setMaxTokens)
  const setSystemPrompt = useOllamaChatStore((state) => state.setSystemPrompt)

  // Initialize React Hook Form with validation and default values from store
  const form = useForm<ChatFormValues>({
    resolver: zodResolver(chatFormSchema), // Use Zod for form validation
    defaultValues: {
      // Pre-populate form with current store values
      selectedProvider,
      temperature,
      topP,
      maxTokens,
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
    setSystemPrompt(data.systemPrompt)
    
    // Show success notification to user
    toast.success('Chat-Einstellungen erfolgreich gespeichert!')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 lg:w-[80%] lg:max-w-2xl">
        {/* System Prompt Section */}
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

        {/* AI Provider Selection */}
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

        {/* Temperature Control */}
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

        {/* Top-P Control */}
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

        {/* Max Tokens Control */}
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

        <Button type="submit">Einstellungen speichern</Button>
      </form>
    </Form>
  )
}
