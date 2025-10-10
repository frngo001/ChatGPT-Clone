import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Bot, 
  MessageCircle, 
  Zap, 
  Shield, 
  ArrowRight
} from 'lucide-react'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">CHTGPT Clone</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Anmelden</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Registrieren</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Die Zukunft der KI-Unterhaltung ist{' '}
            <span className="text-primary">hier</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Erleben Sie intelligente Gespräche mit unserer fortschrittlichen KI. 
            Von kreativem Schreiben bis hin zu komplexen Problemlösungen - 
            CHTGPT Clone ist Ihr vertrauensvoller digitaler Assistent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/register">
                Kostenlos starten
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">
                Demo ansehen
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Warum CHTGPT Clone?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Entdecken Sie die Funktionen, die CHTGPT Clone zu Ihrem idealen KI-Assistenten machen
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <MessageCircle className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Intelligente Gespräche</CardTitle>
              <CardDescription>
                Natürliche, kontextbewusste Unterhaltungen mit fortschrittlicher KI-Technologie
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Zap className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Blitzschnelle Antworten</CardTitle>
              <CardDescription>
                Erhalten Sie sofortige, präzise Antworten auf Ihre Fragen und Anfragen
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Sicher & Privat</CardTitle>
              <CardDescription>
                Ihre Daten sind sicher. Wir respektieren Ihre Privatsphäre und Datenschutz
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/50 rounded-lg">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Für jeden Anwendungsfall</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Von der Arbeit bis zur Freizeit - CHTGPT Clone unterstützt Sie in allen Lebensbereichen
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl mb-2">💼</div>
              <h3 className="font-semibold mb-2">Business</h3>
              <p className="text-sm text-muted-foreground">
                Berichte, Präsentationen, E-Mails und mehr
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl mb-2">🎨</div>
              <h3 className="font-semibold mb-2">Kreativität</h3>
              <p className="text-sm text-muted-foreground">
                Geschichten, Gedichte, Ideen und Inspiration
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl mb-2">📚</div>
              <h3 className="font-semibold mb-2">Lernen</h3>
              <p className="text-sm text-muted-foreground">
                Erklärungen, Tutorials und Wissensvermittlung
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl mb-2">💻</div>
              <h3 className="font-semibold mb-2">Programmierung</h3>
              <p className="text-sm text-muted-foreground">
                Code-Review, Debugging und Entwicklung
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Bereit loszulegen?</h2>
          <p className="text-muted-foreground mb-8">
            Schließen Sie sich Tausenden von Nutzern an, die bereits die Macht der KI entdeckt haben
          </p>
          <Button size="lg" asChild>
            <Link to="/register">
              Jetzt kostenlos registrieren
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Bot className="h-6 w-6 text-primary" />
              <span className="font-semibold">CHTGPT Clone</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">Datenschutz</a>
              <a href="#" className="hover:text-foreground">Nutzungsbedingungen</a>
              <a href="#" className="hover:text-foreground">Kontakt</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
