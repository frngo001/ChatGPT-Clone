import { ContentSection } from '../components/content-section'
import { ProfileForm } from './profile-form'

export function SettingsProfile() {
  return (
    <ContentSection
      title='Profil'
      desc='Bearbeiten Sie Ihre persönlichen Informationen und Einstellungen'
    >
      <ProfileForm />
    </ContentSection>
  )
}
