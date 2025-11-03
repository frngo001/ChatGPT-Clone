import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useProfileStore } from '@/stores/profile-store'
import { useAuthStore } from '@/stores/auth-store'

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, 'Benutzername muss mindestens 2 Zeichen lang sein.')
    .max(30, 'Benutzername darf nicht länger als 30 Zeichen sein.'),
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein.'),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const { profileData, updateProfileData } = useProfileStore()
  // Optimize: Only subscribe to user data, not the entire auth object
  const user = useAuthStore((state) => state.auth.user)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user?.email?.split('@')[0] || profileData.username,
      email: user?.email || profileData.email,
    },
    mode: 'onChange',
  })

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
      {/* Cognee User Information Card */}
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <img
              src="/images/logo.png"
              alt="IMESO Logo"
              className="h-6 w-auto"
            />
            Benutzerinformationen
          </CardTitle>
          <CardDescription>Kontodaten und Status</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="rounded-lg border bg-background p-3">
            <div className="text-xs text-muted-foreground">E-Mail</div>
            <div className="text-sm font-medium break-all">{user?.email || 'Nicht verfügbar'}</div>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <div className="text-xs text-muted-foreground">Benutzer-ID</div>
            <div className="text-sm font-medium break-all font-mono">{user?.id || 'Nicht verfügbar'}</div>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <div className="text-xs text-muted-foreground">Tenant-ID</div>
            <div className="text-sm font-medium font-mono">{user?.tenant_id || 'Nicht zugewiesen'}</div>
          </div>
          <div className="rounded-lg border bg-background p-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="text-sm font-medium">{user?.is_active ? 'Aktiv' : 'Inaktiv'}</div>
            </div>
            <Badge variant={user?.is_verified ? 'default' : 'outline'}>
              {user?.is_verified ? 'Verifiziert' : 'Nicht verifiziert'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Profil-Einstellungen</CardTitle>
          <CardDescription>
            Bearbeiten Sie Ihre persönlichen Informationen und Einstellungen
          </CardDescription>
        </CardHeader>
        <CardContent className="md:pt-0">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => {
                // Save to store
                updateProfileData({
                  username: data.username,
                  email: data.email,
                })
                
                toast.success('Profil erfolgreich aktualisiert!')
              })}
              className='space-y-6 md:space-y-5'
            >
              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benutzername</FormLabel>
                    <FormControl>
                      <Input placeholder='benutzername' {...field} className="md:h-9 md:text-sm" />
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
                    <FormControl>
                      <Input placeholder='email@example.com' {...field} disabled className="md:h-9 md:text-sm" />
                    </FormControl>
                    <FormDescription>
                      Ihre E-Mail-Adresse wird vom Cognee-System verwaltet und kann hier nicht geändert werden.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type='submit' className="md:h-8 md:px-3 md:text-xs">Profil aktualisieren</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
