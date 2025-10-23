import { LoginForm } from '@/components/login-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function LoginPage() {
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
              Willkommen zurück
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Melden Sie sich bei Ihrem Agent AI Konto an
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
