import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import useOllamaChatStore from '@/stores/ollama-chat-store'

const chatFormSchema = z.object({
  selectedProvider: z.enum(['ollama', 'deepseek']),
  temperature: z.number().min(0).max(2),
  topP: z.number().min(0).max(1),
  maxTokens: z.number().min(1).max(10000000),
  systemPrompt: z.string().min(1).max(2000),
})

type ChatFormValues = z.infer<typeof chatFormSchema>

export function ChatForm() {
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

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(chatFormSchema),
    defaultValues: {
      selectedProvider,
      temperature,
      topP,
      maxTokens,
      systemPrompt,
    },
  })

  function onSubmit(data: ChatFormValues) {
    setSelectedProvider(data.selectedProvider)
    setTemperature(data.temperature)
    setTopP(data.topP)
    setMaxTokens(data.maxTokens)
    setSystemPrompt(data.systemPrompt)
    toast.success('Chat-Einstellungen erfolgreich gespeichert!')
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-8'
      >
        {/* System Prompt */}
        <FormField
          control={form.control}
          name='systemPrompt'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-sm font-medium'>System-Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Du bist ein hilfreicher KI-Assistent...'
                  className='min-h-[4rem] max-h-[10rem] md:min-h-[5rem] md:max-h-[10rem] resize-y'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Definiert KI-Verhalten und Persönlichkeit
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* AI Provider Selection */}
        <FormField
          control={form.control}
          name='selectedProvider'
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

        <Separator />

        {/* Temperature */}
        <FormField
          control={form.control}
          name='temperature'
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
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      field.onChange(Math.min(2, Math.max(0, value)))
                    }}
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

        {/* Top-P */}
        <FormField
          control={form.control}
          name='topP'
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
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      field.onChange(Math.min(1, Math.max(0, value)))
                    }}
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

        {/* Max Tokens */}
        <FormField
          control={form.control}
          name='maxTokens'
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
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1
                      field.onChange(Math.min(10000000, Math.max(1, value)))
                    }}
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

        <Button type='submit' variant="secondary">Chat-Einstellungen aktualisieren</Button>
      </form>
    </Form>
  )
}
