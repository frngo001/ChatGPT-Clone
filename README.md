# Agent AI


## Chat-Funktionalität

Die Anwendung bietet eine vollständige Chat-Oberfläche unter `/chat` mit folgenden Features:
- Unterstützung für verschiedene AI-Modelle (Ollama, DeepSeek)
- RAG-basierte Suche mit Cognee
- **Web-Suchagent mit LangChain & Tavily** (nur DeepSeek)
- Streaming-Antworten
- Chat-Historie
- Datei-Uploads und Bild-Unterstützung

### Web-Suchagent

Der Web-Suchagent wird automatisch verfügbar, wenn:
- **General Chat** Modus aktiviert ist
- **DeepSeek** als Provider ausgewählt ist

Der Web-Button (Globe-Icon) erscheint neben dem Send-Button und ermöglicht die Aktivierung der Web-Suche. Wenn aktiviert, werden Suchergebnisse über LangChain mit Tavily Search in die AI-Antwort integriert und die Quellen werden wie bei Cognee Chat angezeigt.

**Setup für Tavily Search:**

1. **Tavily API Key erstellen:**
   - Besuchen Sie [tavily.com](https://tavily.com) und erstellen Sie einen kostenlosen Account
   - Generieren Sie einen API Key in Ihrem Dashboard

2. **Environment Variable setzen:**
   Erstellen Sie eine `.env` Datei im Projekt-Root oder setzen Sie die Variable in Ihrer Umgebung:
   ```bash
   TAVILY_API_KEY=your_tavily_api_key_here
   ```

**Vorteile der LangChain & Tavily Integration:**
- ✅ Zuverlässige API-basierte Suche (kein Scraping)
- ✅ Schnelle und präzise Suchergebnisse
- ✅ Strukturierte Daten mit Titel, URL und Inhalt
- ✅ Intelligente Query-Optimierung basierend auf Chat-Historie
- ✅ Erweiterbar mit weiteren LangChain Tools

## Installation

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd chatgpt-clone
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

## Technologie-Stack

- React 19 + TypeScript
- Vite
- TanStack Query + Router
- Tailwind CSS + Shadcn/ui
- Zustand

## Verfügbare Scripts

- `npm run dev` - Entwicklungsserver
- `npm run build` - Produktionsbuild
- `npm run preview` - Vorschau
- `npm run lint` - Linting
- `npm run format` - Formatierung

## Lizenz

MIT