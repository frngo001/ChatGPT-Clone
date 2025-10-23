import { useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const search = useSearch({ from: '/(auth)/login' }) as { redirect?: string }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await auth.login(email, password)
      
      if (result.success) {
        toast.success('Erfolgreich angemeldet!')
        
        // Don't load datasets automatically after login
        // They will be loaded when user clicks on "Verwalten" in sidebar
        
        // Redirect to the stored location or default to chat
        const targetPath = search.redirect || '/chat'
        navigate({ to: targetPath, replace: true })
      } else {
        toast.error(result.error || 'Anmeldung fehlgeschlagen')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            E-Mail
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="m@beispiel.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 border-input focus:border-ring focus:ring-ring"
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Passwort
            </Label>
            <Link
              to="/forgot-password"
              className="ml-auto inline-block text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Passwort vergessen?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ihr Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 border-input focus:border-ring focus:ring-ring pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <Button 
          type="submit" 
          className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors" 
          disabled={isLoading}
        >
          {isLoading ? 'Anmeldung...' : 'Anmelden'}
        </Button>
      </form>
      <div className="text-center text-sm text-muted-foreground">
        Noch kein Konto?{' '}
        <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
          Registrieren
        </Link>
      </div>
    </div>
  )
}
