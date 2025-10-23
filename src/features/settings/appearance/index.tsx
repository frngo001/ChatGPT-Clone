import { AppearanceForm } from './appearance-form'

export function SettingsAppearance() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Anzeige</h3>
        <p className="text-sm text-muted-foreground">
          Passe die Schriftart und Seitenleiste an deine Vorlieben an.
        </p>
      </div>
      <AppearanceForm />
    </div>
  )
}
