import { z } from 'zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
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
import { useProfileStore } from '@/stores/profile-store'

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, 'Benutzername muss mindestens 2 Zeichen lang sein.')
    .max(30, 'Benutzername darf nicht länger als 30 Zeichen sein.'),
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein.'),
  urls: z
    .array(
      z.object({
        value: z.string().url('Bitte gib eine gültige URL ein.'),
      })
    )
    .optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const { profileData, updateProfileData } = useProfileStore()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: profileData.username,
      email: profileData.email,
      urls: profileData.urls.length > 0 ? profileData.urls : [
        { value: 'https://shadcn.com' },
        { value: 'http://twitter.com/shadcn' },
      ],
    },
    mode: 'onChange',
  })

  const { fields, append } = useFieldArray({
    name: 'urls',
    control: form.control,
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          // Save to store
          updateProfileData({
            username: data.username,
            email: data.email,
            urls: data.urls || [],
          })
          
          toast.success('Profil erfolgreich aktualisiert!')
        })}
        className='space-y-8'
      >
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Benutzername</FormLabel>
              <FormControl>
                <Input placeholder='benutzername' {...field} />
              </FormControl>
              <FormDescription>
                Das ist dein öffentlicher Anzeigename. Es kann dein echter Name oder ein
                Pseudonym sein. Du kannst dies nur alle 30 Tage ändern.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-Mail</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Verifizierte E-Mail auswählen' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='m@example.com'>m@example.com</SelectItem>
                  <SelectItem value='m@google.com'>m@google.com</SelectItem>
                  <SelectItem value='m@support.com'>m@support.com</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Du kannst verifizierte E-Mail-Adressen in deinen{' '}
                <Link to='/'>E-Mail-Einstellungen</Link> verwalten.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          {fields.map((field, index) => (
            <FormField
              control={form.control}
              key={field.id}
              name={`urls.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(index !== 0 && 'sr-only')}>
                    URLs
                  </FormLabel>
                  <FormDescription className={cn(index !== 0 && 'sr-only')}>
                    Füge Links zu deiner Website, deinem Blog oder deinen Social-Media-Profilen hinzu.
                  </FormDescription>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='mt-2'
            onClick={() => append({ value: '' })}
          >
            URL hinzufügen
          </Button>
        </div>
        <Button type='submit'>Profil aktualisieren</Button>
      </form>
    </Form>
  )
}
