# CHTGPT Clone

Ein moderner ChatGPT-Klon, erstellt mit React, TypeScript, Vite und Shadcn/ui. Dieses Projekt bietet eine vollständige Chat-Interface mit Authentifizierung, Chat-Historie und einer benutzerfreundlichen Oberfläche.

## 🚀 Features

- **Moderne Chat-Interface**: Intuitive Benutzeroberfläche ähnlich ChatGPT
- **Authentifizierung**: Login, Registrierung und Passwort-Reset
- **Chat-Historie**: Speicherung und Verwaltung vergangener Gespräche
- **Responsive Design**: Funktioniert auf Desktop und mobilen Geräten
- **Dark/Light Mode**: Unterstützung für verschiedene Themes
- **TypeScript**: Vollständige Typisierung für bessere Entwicklererfahrung
- **Shadcn/ui**: Moderne, zugängliche UI-Komponenten

## 🛠️ Technologie-Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui, Radix UI
- **Routing**: TanStack Router
- **State Management**: Zustand
- **Icons**: Lucide React

## 📦 Installation

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd chtgpt-clone
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```

4. **Browser öffnen**
   Öffnen Sie [http://localhost:5173](http://localhost:5173) in Ihrem Browser

## 🏗️ Projektstruktur

```
src/
├── components/          # Wiederverwendbare UI-Komponenten
│   ├── ui/             # Shadcn/ui Komponenten
│   └── layout/         # Layout-Komponenten (Sidebar, Header)
├── features/           # Feature-spezifische Komponenten
│   ├── auth/           # Authentifizierung (Login, Register, etc.)
│   ├── chat/           # Chat-Funktionalität
│   ├── chat-history/   # Chat-Historie
│   └── landing/        # Landing Page
├── routes/             # TanStack Router Routen
├── lib/                # Utility-Funktionen
└── hooks/              # Custom React Hooks
```

## 🎨 Seiten & Komponenten

### Authentifizierung
- **Login** (`/login`): Benutzeranmeldung
- **Registrierung** (`/register`): Neues Konto erstellen
- **Passwort vergessen** (`/forgot-password`): Passwort-Reset

### Chat-Funktionalität
- **Hauptchat** (`/`): Neue Unterhaltungen starten
- **Chat-Historie** (`/chat-history`): Vergangene Gespräche durchsuchen
- **Aktueller Chat** (`/chat`): Laufende Unterhaltung

### Einstellungen
- **Profil** (`/settings`): Benutzerprofil verwalten
- **Konto** (`/settings/account`): Kontoeinstellungen
- **Erscheinungsbild** (`/settings/appearance`): Theme-Einstellungen
- **Benachrichtigungen** (`/settings/notifications`): Benachrichtigungseinstellungen

## 🎯 Verwendung

### Neue Unterhaltung starten
1. Navigieren Sie zur Hauptseite (`/`)
2. Geben Sie Ihre Nachricht in das Eingabefeld ein
3. Drücken Sie Enter oder klicken Sie auf "Senden"

### Chat-Historie durchsuchen
1. Gehen Sie zu "Chat-Historie" in der Sidebar
2. Verwenden Sie die Suchfunktion, um spezifische Gespräche zu finden
3. Klicken Sie auf einen Chat, um ihn zu öffnen

### Einstellungen anpassen
1. Klicken Sie auf "Einstellungen" in der Sidebar
2. Wählen Sie den gewünschten Bereich aus
3. Nehmen Sie Ihre Änderungen vor

## 🔧 Entwicklung

### Verfügbare Scripts

- `npm run dev` - Startet den Entwicklungsserver
- `npm run build` - Erstellt eine Produktionsversion
- `npm run preview` - Vorschau der Produktionsversion
- `npm run lint` - Führt ESLint aus
- `npm run format` - Formatiert Code mit Prettier

### Code-Stil

Dieses Projekt verwendet:
- **ESLint** für Code-Linting
- **Prettier** für Code-Formatierung
- **TypeScript** für Typisierung

## 🤝 Beitragen

1. Forken Sie das Repository
2. Erstellen Sie einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committen Sie Ihre Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Pushen Sie zum Branch (`git push origin feature/AmazingFeature`)
5. Öffnen Sie einen Pull Request

## 📝 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. Siehe die `LICENSE`-Datei für Details.

## 🙏 Danksagungen

- [Shadcn/ui](https://ui.shadcn.com/) für die wunderbaren UI-Komponenten
- [TanStack](https://tanstack.com/) für die Router- und Query-Bibliotheken
- [Vite](https://vitejs.dev/) für das schnelle Build-Tool
- [Tailwind CSS](https://tailwindcss.com/) für das Utility-First CSS-Framework

## 📞 Support

Bei Fragen oder Problemen erstellen Sie bitte ein Issue im Repository oder kontaktieren Sie uns direkt.

---

**Entwickelt mit ❤️ für die Community**