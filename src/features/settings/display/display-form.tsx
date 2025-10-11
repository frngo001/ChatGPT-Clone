import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDisplayStore } from '@/stores/display-store'
import { useFont } from '@/context/font-provider'
import { fonts } from '@/config/fonts'

const items = [
  {
    id: 'recents',
    label: 'Zuletzt verwendet',
  },
  {
    id: 'home',
    label: 'Startseite',
  },
  {
    id: 'applications',
    label: 'Anwendungen',
  },
  {
    id: 'desktop',
    label: 'Desktop',
  },
  {
    id: 'downloads',
    label: 'Downloads',
  },
  {
    id: 'documents',
    label: 'Dokumente',
  },
  {
    id: 'theme-settings',
    label: 'Theme-Einstellungen',
  },
] as const

const displayFormSchema = z.object({
  items: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'Du musst mindestens ein Element auswählen.',
  }),
  font: z.enum(fonts),
})

type DisplayFormValues = z.infer<typeof displayFormSchema>

export function DisplayForm() {
  const { showThemeSettings, setShowThemeSettings, selectedFont, setSelectedFont } = useDisplayStore()
  const { font, setFont } = useFont()
  
  const form = useForm<DisplayFormValues>({
    resolver: zodResolver(displayFormSchema),
    defaultValues: {
      items: showThemeSettings 
        ? ['recents', 'home', 'theme-settings']
        : ['recents', 'home'],
      font: selectedFont || font,
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          // Check if theme-settings is selected and update store immediately
          const showThemeSettings = data.items.includes('theme-settings')
          setShowThemeSettings(showThemeSettings)
          
          // Update font if changed
          if (data.font !== font) {
            setFont(data.font)
            setSelectedFont(data.font)
          }
          
          toast.success('Anzeigeelement erfolgreich aktualisiert!')
        })}
        className='space-y-8'
      >
        {/* Font Selection */}
        <FormField
          control={form.control}
          name='font'
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-medium">Schriftart</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-48 h-8">
                      <SelectValue placeholder="Schriftart auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {fonts.map((font) => (
                      <SelectItem key={font} value={font}>
                        <span className="capitalize">{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Wähle die Schriftart aus, die in der gesamten Anwendung verwendet werden soll.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sidebar Items */}
        <FormField
          control={form.control}
          name='items'
          render={() => (
            <FormItem>
              <div className='mb-4'>
                <FormLabel className='text-base'>Seitenleiste</FormLabel>
                <FormDescription>
                  Wähle die Elemente aus, die in der Seitenleiste angezeigt werden sollen.
                </FormDescription>
              </div>
              {items.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name='items'
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className='flex flex-row items-start'
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item.id
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className='font-normal'>
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit'>Anzeige aktualisieren</Button>
      </form>
    </Form>
  )
}
