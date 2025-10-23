import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate password reset process
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
    }, 1000)
  }

  if (isSubmitted) {
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
                E-Mail gesendet
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Wir haben Ihnen eine E-Mail zum Zurücksetzen Ihres Passworts gesendet
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Überprüfen Sie Ihren Posteingang und folgen Sie den Anweisungen in der E-Mail, 
                um Ihr Passwort zurückzusetzen.
              </p>
              <div className="space-y-2">
                <Button asChild className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors">
                  <Link to="/login">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Zurück zur Anmeldung
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-11 border-input hover:bg-accent hover:text-accent-foreground transition-colors" 
                  onClick={() => setIsSubmitted(false)}
                >
                  Erneut versuchen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
              Passwort vergessen
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Geben Sie Ihre E-Mail-Adresse ein, um Ihr Passwort zurückzusetzen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button 
                type="submit" 
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors" 
                disabled={isLoading}
              >
                {isLoading ? 'Senden...' : 'Zurücksetzen senden'}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-primary inline-flex items-center transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Zurück zur Anmeldung
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
