### Feat - 10.01.2025

- **Response-Komponente:** Implementiert ElevenLabs Response-Komponente für Streaming-Markdown-Rendering
  - Memoized wrapper um Streamdown für optimale Performance
  - Automatische Entfernung von Top/Bottom-Margins für saubere Integration
  - Unterstützung für vollständige Markdown-Syntax inklusive Code-Blöcken, Listen, Tabellen
  - Optimiert für Streaming AI-Antworten mit zeichenweise Rendering
  - Perfekt für Chat-Anwendungen mit flüssigen Animationen
  - Integration in bestehenden Chat ersetzt react-markdown durch Response-Komponente
  - Beibehaltung aller bestehenden Styles und Toast-Funktionalität
  - Streaming-Animationen für AI-Antworten mit charakterweise Rendering
- **Elegante Loading-Animation:** Ersetzt animierte Punkte durch kleine aber sehr schöne Animation beim Senden von Nachrichten
  - Minimalistische AnimatedLogoLoading-Komponente mit nur 3 Elementen
  - Zentraler pulsierender Punkt (1.2s Zyklus) als Herz der Animation
  - Ein einzelner orbitierender Punkt (2s Rotation) für sanfte Bewegung
  - Dezenter "breathing" Ring (2s Pulse) für subtile Eleganz
  - Kompakte Größe (6x6) mit maximaler visueller Wirkung
  - Perfekte Balance zwischen Einfachheit und Schönheit
- DeepSeek API-Integration hinzugefügt (#33)
- Provider-Auswahl zwischen Ollama und DeepSeek implementiert
- DeepSeek-Modelle werden automatisch geladen und angezeigt
- API-Key wird sicher über Umgebungsvariablen verwaltet
- Model-Selector erweitert für Multi-Provider-Unterstützung
- TanStack Query Devtools integriert für bessere Entwicklungserfahrung
- **TanStack Query Migration:** Alle API-Aufrufe auf useQuery/useMutation umgestellt
  - Wiederverwendbare Hooks für Model-Abfragen (use-models.ts)
  - Chat-Mutationen mit Retry-Logik (use-chat-mutation.ts)
  - Erweiterte API-Hooks für Status, Cache-Management und Optimistic Updates
  - Verbesserte Fehlerbehandlung und Loading-States im Model-Selector
- **Code-Dokumentation:** Umfassende JSDoc-Dokumentation für alle Hooks und Backend-Dateien
  - Vollständige JSDoc-Kommentare für alle React Hooks mit Beispielen
  - Dokumentation für Backend-API-Endpunkte und Vite-Plugin
  - TypeScript-Interfaces mit detaillierten Beschreibungen
  - Professionelle Code-Dokumentation für bessere Entwicklererfahrung
- **Chat Settings:** Neue Settings-Seite für Chat-Konfiguration implementiert
  - Provider-Auswahl (Ollama/DeepSeek) mit persistenter Speicherung
  - Temperatur-Steuerung mit Slider (0.0-2.0)
  - Top-P-Parameter-Anpassung (0.0-1.0)
  - Max-Tokens-Konfiguration für Antwortlänge
  - Streaming-Parameter (Batch-Size, Throttle-Delay)
  - Einheitliche Nachrichtenformate für nahtlosen Provider-Wechsel
  - Chat-Store erweitert um alle Konfigurationsparameter

### Fix - 10.10.2025

- optimize onComplete/onIncomplete invocation (#32)
- solve asChild attribute issue in custom button (#31)
- improve custom Button component (#28)

### Feat 10-10-2025

- **DeepSeek Integration:** Added support for DeepSeek models, allowing users to switch between Ollama and DeepSeek providers.
  - DeepSeek API key can be configured in `.env`.
  - New API endpoints for DeepSeek chat and model listing.
  - Model selector and chat store updated to support both providers.
  - Fixed max_tokens parameter issue by removing it from DeepSeek API requests.

### Feat 25-12-2024

- implement chat page (#21)
- add 401 error page (#12)
- implement apps page
- add otp page