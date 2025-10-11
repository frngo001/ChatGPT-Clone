import { ContentSection } from '../components/content-section'
import { AppearanceForm } from './appearance-form'

export function SettingsAppearance() {
  return (
    <ContentSection
      title='Anzeige'
      desc='Passe das Anzeige der App an. Automatischer Wechsel zwischen
          Tages- und Nachtmodus.'
    >
      <AppearanceForm />
    </ContentSection>
  )
}
