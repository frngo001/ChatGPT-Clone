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
    <div className="space-y-6">
      {/* Cognee User Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img 
              src="/images/logo.png" 
              alt="IMESO Logo" 
              className="h-6 w-auto"
            />
            Benutzerinformationen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">E-Mail</label>
              <p className="text-sm">{user?.email || 'Nicht verfügbar'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Benutzer-ID</label>
              <p className="text-sm font-mono">{user?.id || 'Nicht verfügbar'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tenant-ID</label>
              <p className="text-sm font-mono">{user?.tenant_id || 'Nicht zugewiesen'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="flex gap-2">
                <Badge variant={user?.is_active ? "default" : "secondary"}>
                  {user?.is_active ? "Aktiv" : "Inaktiv"}
                </Badge>
                <Badge variant={user?.is_verified ? "default" : "outline"}>
                  {user?.is_verified ? "Verifiziert" : "Nicht verifiziert"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Profil-Einstellungen</CardTitle>
          <CardDescription>
            Bearbeiten Sie Ihre persönlichen Informationen und Einstellungen
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              className='space-y-6'
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
                    <FormControl>
                      <Input placeholder='email@example.com' {...field} disabled />
                    </FormControl>
                    <FormDescription>
                      Ihre E-Mail-Adresse wird vom Cognee-System verwaltet und kann hier nicht geändert werden.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type='submit'>Profil aktualisieren</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
