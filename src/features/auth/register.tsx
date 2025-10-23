import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (password !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein')
      return
    }
    
    if (password.length < 3) {
      toast.error('Passwort muss mindestens 3 Zeichen lang sein')
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await auth.register(email, password, name)
      
      if (result.success) {
        toast.success('Registrierung erfolgreich! Sie können sich jetzt anmelden.')
        navigate({ to: '/login' })
      } else {
        toast.error(result.error || 'Registrierung fehlgeschlagen')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-gradient-to-br from-background to-muted p-6">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center pb-8">
            <div className="flex justify-center mb-4">
              <img 
                src="/images/logo.png" 
                alt="Agent AI Logo" 
                className="h-12 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-card-foreground">
              Registrieren
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Erstellen Sie Ihr Agent AI Konto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Name (optional)
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ihr Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 border-input focus:border-ring focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  E-Mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ihre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-input focus:border-ring focus:ring-ring"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Passwort
                </Label>
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Passwort bestätigen
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Passwort wiederholen"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 border-input focus:border-ring focus:ring-ring"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors" 
                disabled={isLoading}
              >
                {isLoading ? 'Registrierung...' : 'Registrieren'}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Bereits ein Konto?{' '}
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Anmelden
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}