import { ContentSection } from '../components/content-section'
import { AccountForm } from './account-form'

export function SettingsAccount() {
  return (
    <ContentSection
      title='Konto'
      desc='Aktualisiere deine Kontoeinstellungen. Setze deine bevorzugte Sprache und
          Zeitzone.'
    >
      <AccountForm />
    </ContentSection>
  )
}
