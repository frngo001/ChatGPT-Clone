### Feat - 10.01.2025

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