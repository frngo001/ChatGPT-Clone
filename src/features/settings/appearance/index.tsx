import { ContentSection } from '../components/content-section'
import { AppearanceForm } from './appearance-form'

export function SettingsAppearance() {
  return (
    <ContentSection
      title='Anzeige'
      desc='Passe die Schriftart und Seitenleiste an deine Vorlieben an.'
    >
      <AppearanceForm />
    </ContentSection>
  )
}
