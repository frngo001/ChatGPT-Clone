import { ContentSection } from '../components/content-section'
import { ProfileForm } from './profile-form'

export function SettingsProfile() {
  return (
    <ContentSection
      title='Profil'
      desc='So wirst du von anderen auf der Website gesehen.'
    >
      <ProfileForm />
    </ContentSection>
  )
}
