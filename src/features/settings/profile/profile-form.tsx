import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
    <div className="space-y-8">
      {/* Cognee User Information */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <img
              src="/images/logo.png"
              alt="IMESO Logo"
              className="h-6 w-auto"
            />
            <h3 className="text-base md:text-lg font-semibold">Benutzerinformationen</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">Kontodaten und Status</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">E-Mail</div>
            <div className="text-sm break-all">{user?.email || 'Nicht verfügbar'}</div>
          </div>
          
          <Separator />
          
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Benutzer-ID</div>
            <div className="text-sm font-mono break-all">{user?.id || 'Nicht verfügbar'}</div>
          </div>
          
          <Separator />
          
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Tenant-ID</div>
            <div className="text-sm font-mono">{user?.tenant_id || 'Nicht zugewiesen'}</div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Status</div>
              <div className="text-sm">{user?.is_active ? 'Aktiv' : 'Inaktiv'}</div>
            </div>
            <Badge variant={user?.is_verified ? 'default' : 'secondary'}>
              {user?.is_verified ? 'Verifiziert' : 'Nicht verifiziert'}
            </Badge>
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Profile Form */}
      <div className="space-y-6">
        <div>
          <h3 className="text-base md:text-lg font-semibold mb-1.5">Profil-Einstellungen</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Bearbeiten Sie Ihre persönlichen Informationen und Einstellungen
          </p>
        </div>
        
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
                  <FormDescription className='text-xs text-muted-foreground leading-relaxed'>
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
                  <FormDescription className='text-xs text-muted-foreground leading-relaxed'>
                    Ihre E-Mail-Adresse wird vom Cognee-System verwaltet und kann hier nicht geändert werden.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type='submit'>Profil aktualisieren</Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
