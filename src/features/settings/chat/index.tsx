import { ContentSection } from '../components/content-section'
import { ChatForm } from './chat-form'

export function SettingsChat() {
  return (
    <ContentSection
      title='Chat-Einstellungen'
      desc='Konfiguriere deine Chat-Präferenzen inklusive KI-Anbieter, Temperatur und anderen Modellparametern.'
    >
      <ChatForm />
    </ContentSection>
  )
}
