import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Separator } from '@/components/ui/separator'
import { useDisplayStore } from '@/stores/display-store'
import { useFont } from '@/context/font-provider'
import { fonts } from '@/config/fonts'
import { darkThemes, getDarkThemeById } from '@/config/dark-themes'
import { applyDarkTheme } from '@/lib/apply-dark-theme'
import { useTheme } from '@/context/theme-provider'

const items = [
  {
    id: 'theme-settings',
    label: 'Theme-Einstellungen',
  },
] as const

const appearanceFormSchema = z.object({
  font: z.enum(fonts),
  items: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'Du musst mindestens ein Element auswählen.',
  }),
  darkThemeId: z.string(),
})

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>

export function AppearanceForm() {
  const showThemeSettings = useDisplayStore((state) => state.showThemeSettings)
  const setShowThemeSettings = useDisplayStore((state) => state.setShowThemeSettings)
  const selectedFont = useDisplayStore((state) => state.selectedFont)
  const setSelectedFont = useDisplayStore((state) => state.setSelectedFont)
  // @ts-ignore - Zustand type inference issue with persist middleware
  const darkThemeId = useDisplayStore((state) => state.darkThemeId)
  // @ts-ignore - Zustand type inference issue with persist middleware
  const setDarkThemeId = useDisplayStore((state) => state.setDarkThemeId)
  const { font, setFont } = useFont()
  const { resolvedTheme } = useTheme()
  
  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      font: selectedFont || font,
      items: showThemeSettings 
        ? ['theme-settings']
        : [],
      darkThemeId: darkThemeId || darkThemes[0].id,
    },
  })
  
  // Apply dark theme when it changes or when dark mode is active
  const handleDarkThemeChange = (themeId: string) => {
    setDarkThemeId(themeId)
    const theme = getDarkThemeById(themeId)
    if (theme && resolvedTheme === 'dark') {
      applyDarkTheme(theme)
    }
  }

  return (
    <Form {...form}>
      <div className='space-y-8'>
        {/* Font Selection */}
        <FormField
          control={form.control}
          name='font'
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-medium">Schriftart</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value)
                    // Apply immediately
                    const fontValue = value as typeof fonts[number]
                    setFont(fontValue)
                    setSelectedFont(fontValue)
                  }} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-48 h-8">
                      <SelectValue placeholder="Schriftart auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {fonts.map((font) => {
                      // Format font names for display
                      const displayName = font
                        .split('-')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')
                      return (
                        <SelectItem key={font} value={font}>
                          {displayName}
                        </SelectItem>
                      )
                    })}
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

        <Separator />

        {/* Dark Theme Selection */}
        <FormField
          control={form.control}
          name='darkThemeId'
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel className="text-sm font-medium">Dark-Theme</FormLabel>
                  <FormDescription className='text-xs text-muted-foreground leading-relaxed mt-1'>
                    Wähle ein Dark-Theme aus, das im dunklen Modus verwendet werden soll.
                  </FormDescription>
                </div>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value)
                    handleDarkThemeChange(value)
                  }} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-48 h-8">
                      <SelectValue placeholder="Theme auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {darkThemes.map((theme) => (
                      <SelectItem key={theme.id} value={theme.id}>
                        {theme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Sidebar Items */}
        <FormField
          control={form.control}
          name='items'
          render={() => (
            <FormItem>
              <div className='mb-4'>
                <FormLabel className='text-base'>Seitenleiste</FormLabel>
                <FormDescription className='text-xs text-muted-foreground leading-relaxed'>
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
                              const newValue = checked
                                ? [...field.value, item.id]
                                : field.value?.filter(
                                    (value) => value !== item.id
                                  )
                              field.onChange(newValue)
                              // Apply immediately
                              const showThemeSettings = newValue.includes('theme-settings')
                              setShowThemeSettings(showThemeSettings)
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
      </div>
    </Form>
  )
}
