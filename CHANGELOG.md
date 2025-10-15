### Fix - 14.01.2025

- **Navbar File Count Synchronization Fix:** Korrigiert Synchronisation der Datei-Anzahl in der Navbar
  - `fetchDatasets()` lädt automatisch Dateien für alle Datasets um Navbar-Badges zu aktualisieren
  - `fetchDatasetData()` holt gleichzeitig Dateien und Status für vollständige Synchronisation
  - Upload-Methoden loggen Datei-Anzahl-Updates für bessere Nachverfolgung
  - Entfernen von Dateien aktualisiert sofort die Navbar-Badge-Anzahl
  - Store-Persistierung: Status und Pipeline-IDs werden nicht mehr persistiert
  - Automatisches Polling startet beim Laden der Datasets
  - Umfassendes Logging für alle Datei-Operationen und Status-Updates
  - Navbar zeigt immer aktuelle Datei-Anzahl basierend auf API-Daten

### Feat - 14.01.2025

- **Automatic Status Polling:** Implementiert automatisches Status-Polling für Dataset-Verarbeitung
  - Neue Store-Methoden: `checkAllDatasetStatuses`, `startStatusPolling`, `stopStatusPolling`
  - Automatisches Polling alle 5 Sekunden für alle Datasets
  - Intelligente Polling-Verwaltung: Startet bei vorhandenen Datasets
  - Automatisches Stoppen des Pollings wenn keine Datasets vorhanden sind
  - Integration in Dataset-Übersicht und Dataset-Detail-Seite
  - Echtzeit-Status-Updates ohne manuelle Aktualisierung erforderlich
  - API-basierte Status-Verwaltung für Browser-Konsistenz

### Fix - 14.01.2025

- **Processing Status Values Fix:** Korrigiert processingStatus Werte auf tatsächliche API-Werte
  - Aktualisiert auf korrekte API-Status-Werte: `DATASET_PROCESSING_INITIATED`, `DATASET_PROCESSING_STARTED`, `DATASET_PROCESSING_COMPLETED`, `DATASET_PROCESSING_ERRORED`
  - Store-Logik angepasst für korrekte Status-Mapping und Filterung
  - ProcessingStatusBadge Komponente aktualisiert für neue Status-Werte
  - Dataset-Detail-Seite korrigiert für korrekte Verarbeitungslogik
  - Entfernt ungenutzte Imports und behoben Linter-Warnungen

### Feat - 14.01.2025

- **Dataset Processing Integration:** Vollständige Integration der Cognify-API für Dataset-Verarbeitung
  - Neue API-Methoden: `cognifyDatasets` und `getDatasetProcessingStatus` für Verarbeitung
  - `CognifyRequest` und `CognifyResponse` Interfaces für API-Integration
  - Dataset-Interface erweitert um `processingStatus` und `pipelineRunId` Felder
  - Store-Methoden: `processDatasets`, `checkDatasetStatus`, `getUnprocessedDatasets`
  - Neue `ProcessingStatusBadge` Komponente mit visuellen Status-Indikatoren
  - "Alle verarbeiten" Button in Dataset-Übersicht für Batch-Verarbeitung
  - "Dataset verarbeiten" Button in Dataset-Detail-Seite
  - Intelligente Status-Anzeige: "Muss verarbeitet werden", "Wird verarbeitet...", "Verarbeitet", "Fehlgeschlagen"
  - Automatische Status-Updates nach Verarbeitungsstart
  - Toast-Benachrichtigungen für Verarbeitungsstatus und Fehler
  - Verwendung von Dataset-IDs für präzise Verarbeitung (wie in API-Spezifikation)

- **Multi-Data-Type Support:** Erweiterte Dataset-Funktionalität für verschiedene Datentypen
  - Neue `AddDataDialog` Komponente mit Tab-basierter Benutzeroberfläche
  - Unterstützung für Dateien, Freitexte und URLs in einem Dialog
  - Separate Tabs für Datei-Upload, Text-Eingabe und URL-Eingabe
  - Progress-Tracking für alle Datentypen mit visuellen Status-Indikatoren
  - Batch-Upload-Funktionalität für mehrere Elemente gleichzeitig
  - Automatische URL-Validierung und Text-Längen-Anzeige
  - Erweiterte API-Methoden: `addTextToDataset`, `addUrlToDataset`, `addUrlsToDataset`
  - Neue `DataType` Enum und `AddDataRequest` Interface für flexible Datenverarbeitung
  - Store-Integration für alle Datentypen mit korrekter Response-Verarbeitung
  - Dataset-Detail-Seite aktualisiert für neuen "Daten hinzufügen" Dialog

### Fix - 14.01.2025

- **Dataset Upload API Response Fix:** Korrigiert API-Integration für Datei-Uploads
  - Neue `AddDataResponse` und `DataIngestionInfo` Interfaces für korrekte API-Response
  - API-Parameter von `file` zu `data` geändert (entsprechend API-Spezifikation)
  - Response-Verarbeitung für `PipelineRunCompleted` Status implementiert
  - `data_ingestion_info` Array wird korrekt verarbeitet für Multi-File-Uploads
  - Store-Logik angepasst für neue Response-Struktur mit `data_id` Feldern
  - Fehlerbehandlung für verschiedene Pipeline-Status implementiert
  - Upload-Dialog-Metadaten an API-Format angepasst

### Feat - 14.01.2025

- **Dataset File Upload API Integration:** Implementiert vollständige Datei-Upload-Funktionalität
  - Neue API-Methode `addFileToDataset` für POST `/api/v1/add` Endpunkt
  - FormData-basierter Upload mit Datei und Metadaten
  - Unterstützung für alle Dateitypen (PDF, DOC, DOCX, TXT, PPT, PPTX, XLS, XLSX, Bilder)
  - Automatische Konvertierung zwischen API-Response und lokalen Dataset-Strukturen
  - Neue Store-Methode `uploadFileToDataset` für direkte API-Integration
  - Upload-Dialog aktualisiert für echte API-Uploads statt lokaler Simulation
  - Progress-Tracking und Fehlerbehandlung für Upload-Prozesse
  - Metadaten-Support für erweiterte Dateiinformationen
  - Toast-Benachrichtigungen für Upload-Erfolg und -Fehler

### Fix - 14.01.2025

- **Dataset API Format Fix:** Korrigiert API-Integration für Dataset-Dateien
  - Aktualisiert `DatasetFileResponse` Interface für neues API-Format
  - Entfernt `rawDataLocation` aus API-Typen und Store-Interfaces
  - Korrigiert Datumskonvertierung von `upload_date` zu `createdAt`
  - Ersetzt Dateigröße-Anzeige durch Dateierweiterung (extension)
  - Automatisches Laden der Dataset-Dateien beim Öffnen der Detail-Seite
  - Verbesserte Fehlerbehandlung für API-Responses
  - Entfernt ungenutzte `formatFileSize` Funktionen
  - Aktualisiert Frontend-Komponenten für korrekte Anzeige der Dateiinformationen

### Feat - 14.01.2025

- **API Integration für Datasets:** Vollständige Integration der Cognee API für Dataset-Management
  - Ersetzt localStorage-basierte Datasets durch echte API-Verbindung zu `http://imeso-ki-02:8080`
  - Neuer API-Service (`src/lib/api/datasets-api.ts`) für alle Dataset-Endpunkte
  - Unterstützt GET, POST, DELETE Operationen für Datasets und Daten
  - Asynchrone Store-Aktionen mit Loading-States und Fehlerbehandlung
  - Automatisches Laden der Datasets beim Seitenaufruf
  - Verbesserte Benutzeroberfläche mit Loading-Indikatoren und Fehlermeldungen
  - API-Authentifizierung über Bearer Token aus localStorage
  - Konvertierung zwischen API-Response-Format und lokalen Dataset-Strukturen
  - Vite Proxy-Konfiguration für CORS-Umgehung in der Entwicklungsumgebung
  - Robuste Datumskonvertierung mit Fehlerbehandlung für API-Responses
  - Erweiterte Delete-Confirmation mit benutzerfreundlichem Dialog-Component
  - Vereinfachtes Design mit weniger Farben für bessere Benutzerfreundlichkeit
  - Toast-Benachrichtigungssystem für Dataset-Operationen (Erstellen/Löschen)
  - Integration mit bestehendem Sonner Toast-System für bessere Kompatibilität
  - Toast-Dauer auf 3 Sekunden reduziert für bessere Benutzererfahrung
  - Modals schließen mit 500ms Verzögerung, damit Toasts sichtbar bleiben
  - Verbesserte Benutzeroberfläche mit visuellen Feedback-Elementen

### Feat - 11.01.2025

- **Sichtbarer Anzeigen-Button in Grid-Ansicht:** Anzeigen-Button direkt in der Grid-Ansicht sichtbar
  - Eye-Icon-Button direkt neben dem Dropdown-Menü platziert
  - Bessere Benutzerfreundlichkeit durch direkten Zugriff auf Dateivorschau
  - Dropdown-Menü enthält nur noch Download, Umbenennen, Verschieben und Löschen
  - Konsistente Button-Größen und Abstände für optimale Darstellung

- **Vereinfachte Listenansicht:** Listenansicht der Dateien optimiert
  - Nur Dateiname wird angezeigt (keine Größe, Typ oder Datum)
  - Border entfernt für sauberere Darstellung
  - Kompaktere horizontale Darstellung mit weniger visueller Ablenkung
  - Action-Buttons (Anzeigen, Herunterladen, Dropdown) bleiben verfügbar

- **Kompaktere Dateien-Komponente mit Filter und Anzeigeweise:** Dateien-Sektion optimiert und erweitert
  - Kompaktere Header: Titel auf `text-sm font-medium`, Beschreibung auf `text-xs`
  - Suchfeld mit kleinerem Icon (`h-3 w-3`) und kompakterer Höhe (`h-8`)
  - Filter-Dropdown mit Optionen: Alle Dateien, Zuletzt hochgeladen, Größte Dateien
  - Anzeigeweise-Toggle: Grid- und Listen-Ansicht mit kompakten Buttons (`h-8`)
  - Grid-Ansicht: Kleinere Cards mit `text-sm` Titel und `text-xs` Beschreibung
  - Listen-Ansicht: Kompakte horizontale Darstellung mit allen Dateiinformationen
  - Konsistente Button-Größen und Icon-Dimensionen für bessere Platznutzung

- **Kompaktere Dataset-Informationen:** Dataset-Info-Komponente für bessere Platznutzung optimiert
  - CardHeader: Titel auf `text-sm font-medium` reduziert
  - CardDescription: Datum-Informationen auf `text-xs` verkleinert
  - Bearbeiten-Button: Höhe auf `h-7` reduziert mit `text-xs`
  - Tags: Kleinere Badges mit `text-xs px-1.5 py-0.5`
  - Statistiken: Zahlen von `text-lg` auf `text-sm` reduziert
  - Grid-Abstand: Von `gap-3` auf `gap-2` reduziert
  - Spacing: `space-y-3` auf `space-y-2` reduziert
  - Kompaktere Header-Padding: `pb-3` für weniger vertikalen Platz

- **Dateidarstellung auf Dataset-Detailseite:** Dateien werden nun in einem ähnlichen Kartenformat wie Datasets auf der Hauptseite dargestellt
  - Jede Datei wird als eigene `Card` mit `CardHeader` und `CardContent` gerendert
  - Dateiname als `CardTitle` (`text-base`)
  - Dateityp als `CardDescription` (`text-sm`)
  - Dateigröße und Upload-Datum im `CardContent` (`text-xs`)
  - Aktionen (Anzeigen, Herunterladen, Dropdown-Menü) sind in den Dateikarten integriert
  - Grid-Layout: `md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` für responsive Darstellung
  - Konsistente Darstellung mit der Hauptseite für bessere Benutzererfahrung

- **Kompaktere Dataset-Benutzeroberfläche:** Elemente auf der Dataset-Seite kleiner gemacht für bessere Platznutzung
  - Header-Titel von text-2xl auf text-xl reduziert
  - Beschreibungstexte auf text-sm verkleinert
  - Buttons auf size="sm" gesetzt für kompaktere Darstellung
  - Suchfeld-Höhe auf h-8 reduziert mit kleineren Icons (h-3 w-3)
  - Grid-Abstand von gap-4 auf gap-3 reduziert
  - Erweiterte Grid-Spalten: xl:grid-cols-4 für mehr Datasets pro Zeile
  - Card-Titel von text-lg auf text-base reduziert
  - Kleinere Statistiken und kompaktere Datei-Listen
  - Reduzierte Padding-Werte für kompaktere Darstellung
  - Kleinere Action-Buttons (h-6 w-6) mit reduzierten Icon-Größen

- **Deutsche Übersetzung:** Vollständige Übersetzung der Datasets-Seite ins Deutsche
  - Hauptseite Datasets (index.tsx) komplett übersetzt
  - Dataset-Detail-Seite (dataset-detail.tsx) komplett übersetzt  
  - Create-Dataset-Dialog komplett übersetzt
  - Upload-File-Dialog komplett übersetzt
  - Alle Benutzeroberflächen-Texte, Platzhalter und Bestätigungsdialoge auf Deutsch
  - Konsistente deutsche Terminologie für Dataset-Management-Funktionen

### Feat - 11.01.2025

- **Dataset Management System:** Implemented comprehensive dataset management functionality in the library section
  - Added collapsible "Bibliothek" navigation with "Datasets" and "Dokumente" sub-sections
  - Created dataset store with Zustand for state management and persistence
  - Dataset creation with name, description, and tags support
  - File upload functionality with progress tracking and drag-and-drop support
  - Dataset detail pages showing file management, statistics, and metadata
  - Search and filter capabilities for datasets and files
  - Grid and list view modes for better user experience
  - File type detection with appropriate icons and size formatting
  - CRUD operations for datasets and files with confirmation dialogs
  - Responsive design with modern UI components and animations
  - Integration with existing sidebar navigation structure
  - **Dynamic Sidebar Navigation:** Added dynamic dataset listing in hierarchical sidebar structure
    - Datasets are organized as sub-items under "Datasets" section within "Bibliothek"
    - Each dataset appears with FileText icon and file count badge
    - "Alle Datasets" option provides overview of all datasets
    - Clicking on a dataset navigates to the dataset detail page
    - Real-time updates when datasets are added/removed
    - Hierarchical navigation: Bibliothek > Datasets > Individual Datasets
    - File count indicator shows number of documents per dataset
    - Removed "Dokumente" section to focus on datasets only
    - Added example datasets for demonstration (Projekt Dokumentation, Forschung & Entwicklung, Marketing Materialien)
    - Enhanced navigation component to support nested collapsible menus for Datasets section
    - Changed dataset icons from FileText to Folder icons for better visual representation
    - Reduced icon size for nested menu items to h-3 w-3 for better proportions
    - Made sidebar and chat history visible on all pages instead of only chat and settings pages
    - Added header/navbar component to authenticated layout for consistent navigation across all pages
    - Removed duplicate headers from chat pages to use unified layout header
    - Added chat-specific components (ModelSelector) to header when on chat pages
    - Removed duplicate headers from Settings, Apps, Users, Tasks, and Dashboard pages
    - Completely removed Apps, Users, Tasks, and Dashboard pages and their routes
    - Removed "Projekte" navigation item from sidebar as route doesn't exist
    - Fixed DatasetDetailPage export error by adding missing export in datasets index
    - Changed import path from barrel export to direct import for DatasetDetailPage
    - Added missing Progress component with Radix UI integration
    - Fixed React hooks error by clearing Vite cache and restarting dev server

### Fix - 10.01.2025

- fix image persistence issue in chat messages (#33)
- extend Message type to include experimental_attachments for localStorage persistence
- update chat store to save and load messages with image attachments
- fix images disappearing on page refresh by persisting attachments with messages

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
  - Bereinigung: Entfernung unnötiger Chat-Komponenten (message-loading.tsx, animated-logo-loading.tsx)
  - Vereinfachte Loading-Anzeige durch einfache Text-Animation ersetzt
  - Codeblock-Darstellung: Ersetzt CodeDisplayBlock durch Response-Komponente für einheitliches Rendering
  - Entfernung von react-code-blocks Abhängigkeit für schlankere Codebase
  - ShimmeringText Loading-Effekt: Ersetzt einfache Loading-Animation durch elegante Shimmer-Text-Animation
  - Dynamische Loading-Phrasen mit automatischem Wechsel alle 3 Sekunden
  - Framer Motion Integration für sanfte Übergänge zwischen Loading-Phrasen
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