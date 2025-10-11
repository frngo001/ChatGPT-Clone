import { ContentSection } from '../components/content-section'
import { DisplayForm } from './display-form'

export function SettingsDisplay() {
  return (
    <ContentSection
      title='Anzeigeelement'
      desc='Schalte Elemente ein oder aus, um zu steuern, was in der App angezeigt wird.'
    >
      <DisplayForm />
    </ContentSection>
  )
}
