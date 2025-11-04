// External dependencies
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

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
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false)

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        <div className="space-y-5">
          {/* System Prompt Section - Collapsible mit besonderem Design */}
          <Collapsible open={isSystemPromptOpen} onOpenChange={setIsSystemPromptOpen}>
            <Card className={cn(
              "border-0 shadow-none transition-all duration-200",
              isSystemPromptOpen 
                ? "bg-gradient-to-br from-primary/5 via-primary/3 to-transparent" 
                : "bg-muted/20 hover:bg-muted/30"
            )}>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        isSystemPromptOpen 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted group-hover:bg-muted/80"
                      )}>
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          System-Prompt
                          {systemPrompt && !isSystemPromptOpen && (
                            <span className="text-xs font-normal text-muted-foreground">
                              ({systemPrompt.length} Zeichen)
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          Definiert KI-Verhalten und Persönlichkeit
                        </CardDescription>
                      </div>
                    </div>
                    {isSystemPromptOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-4">
                  <FormField
                    control={form.control}
                    name="systemPrompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Textarea
                              placeholder="Du bist ein hilfreicher KI-Assistent..."
                              className="min-h-[140px] text-sm resize-none bg-background font-mono text-[13px] leading-relaxed border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                              {...field}
                            />
                            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                              {field.value?.length || 0} / 2000
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* AI Provider Selection */}
          <Card className="border-0 shadow-none bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">KI-Anbieter</CardTitle>
              <CardDescription className="text-xs">
                Ollama: lokal & kostenlos | DeepSeek: Cloud & API-Schlüssel
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <FormField
                control={form.control}
                name="selectedProvider"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full md:w-[280px] bg-background h-9 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0">
                          <SelectValue placeholder="KI-Anbieter auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ollama">Ollama (Lokal)</SelectItem>
                        <SelectItem value="deepseek">DeepSeek (Cloud)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Model Parameters */}
          <Card className="border-0 shadow-none bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Modell-Parameter</CardTitle>
              <CardDescription className="text-xs">
                Anpassung der Antwortqualität und Kreativität
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-5">
              {/* Temperature Control */}
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium">Temperatur</FormLabel>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={2}
                            step={0.1}
                            value={field.value}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0
                              field.onChange(Math.min(2, Math.max(0, value)))
                            }}
                            className="w-20 h-8 bg-background text-center text-sm border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                          <span className="text-xs text-muted-foreground">/ 2.0</span>
                        </div>
                      </div>
                      <FormControl>
                        <Slider
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          min={0}
                          max={2}
                          step={0.1}
                          className="w-full"
                        />
                      </FormControl>
                      <FormDescription className="text-xs leading-relaxed">
                        Kreativität: 0.0 (deterministisch) bis 2.0 (kreativ)
                      </FormDescription>
                    </div>
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
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium">Top-P</FormLabel>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={1}
                            step={0.05}
                            value={field.value}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0
                              field.onChange(Math.min(1, Math.max(0, value)))
                            }}
                            className="w-20 h-8 bg-background text-center text-sm border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                          <span className="text-xs text-muted-foreground">/ 1.0</span>
                        </div>
                      </div>
                      <FormControl>
                        <Slider
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          min={0}
                          max={1}
                          step={0.05}
                          className="w-full"
                        />
                      </FormControl>
                      <FormDescription className="text-xs leading-relaxed">
                        Token-Vielfalt: 0.0 (fokussiert) bis 1.0 (vielfältig)
                      </FormDescription>
                    </div>
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
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium">Max. Tokens</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={10000000}
                            value={field.value}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1
                              field.onChange(Math.min(10000000, Math.max(1, value)))
                            }}
                            className="w-28 md:w-36 h-8 bg-background text-right text-sm border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </FormControl>
                      </div>
                      <FormDescription className="text-xs leading-relaxed">
                        Maximale Antwortlänge in Tokens
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end pt-1">
            <Button type="submit" className="w-full md:w-auto h-9">
              Einstellungen speichern
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
