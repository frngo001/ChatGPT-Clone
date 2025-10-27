### Feature & Enhancement - 23.10.2025

- **User Management Extension:** Erweiterte Userverwaltung mit vollständigen Benutzerinformationen
  - **Neuer API-Endpunkt:** Integration des `/api/v1/users/all` Endpunkts für vollständige User-Daten
  - **Tenant-Anzeige:** Neue Spalte zeigt Tenant-Namen mit Owner-Indicator (Krone-Icon)
  - **Rollen-Anzeige:** Zusätzliche Spalte für alle zugewiesenen Rollen
  - **Tenant-Zuweisung:** Neue Funktion zum Zuweisen von Benutzern zu Tenants via Dialog
  - **Erweiterter Tenant-Filter:** Filter nach Tenant-Zugehörigkeit in User-Tabelle
  - **Responsive Design:** 
    - Mobile (<640px): Card-basiertes Layout mit allen Informationen
    - Tablet (640px-1024px): Kompakte Tabelle mit wichtigsten Spalten
    - Desktop (>1024px): Vollständige Tabelle mit allen Details
  - **shadcn/ui Components:** Dialog, Select, Badge, und Card für moderne UI
  - **TypeScript Types:** Erweiterte Interfaces für Tenant und User-Objekte
  - **Permissions Store:** Neue Actions für Tenant-Management und Filterung

### UI/UX Enhancement - 23.10.2025

- **Permissions Page Redesign & Simplification:** Vollständige Neugestaltung und Vereinfachung der Berechtigungsseite
  - **Fokus auf User-Verwaltung:** Entfernung der Tabs "Übersicht", "Tenants" und "Rollen" für besseren Fokus
  - **Konsistenter Header:** Vereinfachter Header-Style wie bei anderen Settings-Seiten (Profil, Anzeige)
  - **Single Card Layout:** Direkte User-Management-Card ohne unnötige Tab-Navigation
  - **Verbesserte User-Verwaltung:** Optimierte User-Management-Tabelle innerhalb einer Card-Struktur
  - **Vereinfachte Filter:** Kompaktere Filter-Controls mit inline Zurücksetzen-Button
  - **Aktualisieren-Button:** Lädt User-Liste vom Server neu mit Loading-Animation
  - **Einheitliches Spacing:** `space-y-6` und konsistente Abstände wie in anderen Settings-Seiten
  - **Optimierte Buttons:** Kleinere Buttons (`size="sm"`) und `variant="outline"` für Aktualisieren-Button
  - **Bessere Hierarchie:** Klare CardTitle und CardDescription ohne überflüssige Icons
  - **Responsive Design:** Optimiertes Layout für mobile und Desktop-Geräte
  - **Reduzierte Komplexität:** Nur noch essentielle User-Management-Funktionen sichtbar

### UI/UX Enhancement - 10.01.2025

- **Permissions Page Layout Overhaul:** Complete redesign of permissions management interface
- **Dashboard Statistics Cards:** Added comprehensive statistics overview with visual indicators
- **Enhanced Tab Navigation:** Improved tab structure with icons, badges, and better organization
- **Modern Filter System:** Advanced filtering with active filter display and clear functionality
- **Improved User Table:** Enhanced table design with better badges, icons, and hover effects
- **Responsive Design:** Optimized layout for mobile and desktop devices
- **Visual Hierarchy:** Better spacing, typography, and component organization
- **Loading States:** Improved loading indicators and empty states
- **Accessibility:** Better contrast, focus states, and screen reader support

### Performance Fix - 10.01.2025

- optimize navigation performance by eliminating unnecessary API calls (#33)
- implement token verification caching (10-minute cache) (#33)
- remove automatic dataset detail loading on navigation (#33)
- add lazy loading for dataset details only when clicked (#33)
- optimize sidebar dataset badges to show "..." when data not loaded (#33)
- add initial app loading hook for better startup performance (#33)
- **fix dataset loading logic:** "Verwalten" loads all details, individual clicks use cache (#33)
- **improve cache utilization:** display values taken from cache, details loaded on demand (#33)
- **fix token verification:** only called once after login, then cached for 10 minutes (#33)
- **optimize dataset details loading:** only load details for datasets without cached data (#33)
- **fix cache preservation:** prevent cached dataset details from being lost on refresh (#33)
- **improve cache merging:** preserve file details when updating dataset metadata (#33)
- **implement permanent token cache:** verifyToken only called once at app start, then cached forever (#33)
- **add auth store persistence:** user data and verification status survive page refreshes (#33)

### Feat - 16.01.2025

- **Admin Permissions Management:** Vollständiges Admin-Permissions-System implementiert
  - **Backend API-Endpoints:** Alle Cognee Permissions-Endpoints implementiert
    - `POST /api/cognee/permissions/datasets` - Dataset-Berechtigungen vergeben
    - `POST /api/cognee/permissions/roles` - Rollen erstellen
    - `POST /api/cognee/permissions/users/roles` - User zu Rolle hinzufügen
    - `POST /api/cognee/permissions/users/tenants` - User zu Tenant hinzufügen
    - `POST /api/cognee/permissions/tenants` - Tenant erstellen
  - **Frontend API-Client:** Alle Admin-Permissions-Methoden implementiert
    - `createTenant()`, `createRole()`, `addUserToRole()`, `addUserToTenant()`
    - `giveDatasetPermission()` für Dataset-Berechtigungen
  - **Admin-Panel UI:** Umfassende Tenant- und Rollen-Verwaltung
    - **Tenant-Management:** Tenant erstellen, bearbeiten, löschen mit Tabellen-UI
    - **Rollen-Management:** Rollen erstellen, bearbeiten, löschen mit Tabellen-UI
    - **Neue Tabs:** Tenants und Rollen Tabs im Admin-Panel
    - **Dialog-basierte UI:** Moderne Dialoge für Create/Edit-Operationen
    - **Tabellen-UI:** Professionelle Tabellen mit Dropdown-Actions
    - **Toast-Benachrichtigungen:** Erfolgs- und Fehler-Toasts für alle Aktionen
  - **Permissions-Store:** Erweitert um Tenant/Role-Management-Funktionen
    - `fetchTenants()`, `fetchRoles()` Methoden hinzugefügt
    - State für `tenants` Array hinzugefügt
  - **Admin-Berechtigungen:** Alle neuen Funktionen nur für Admins zugänglich
    - Nur `is_superuser: true` kann Tenants/Rollen erstellen und verwalten
    - Admin-Panel-Tabs nur für Admins sichtbar
  - **UI-Komponenten:** Neue shadcn-Komponenten integriert
    - Dialog, Table, DropdownMenu für moderne Admin-UI
    - Plus-Icons für Create-Buttons, Building2/Shield-Icons für Tenants/Rollen
    - Responsive Design mit Grid-Layout

- **Admin User Management Dashboard:** Umfassendes User-Management-System für Admins implementiert
  - **Backend User-API-Endpoints:** Neue Proxy-Endpoints für User-Management (GET, UPDATE, DELETE)
  - **TypeScript Types:** User, UpdateUserPayload Interfaces hinzugefügt
  - **API-Client:** User-Management-Methoden (getUser, getAllUsers, updateUser, deleteUser)
  - **Permissions-Store:** Vollständige User-Management-Funktionen (fetchAllUsers, toggleUserRole, deleteUser)
  - **User-Management-Table:** Professionelle Tabelle mit Dropdown-Actions für jeden User
  - **User-Filters:** Such- und Filterfunktionen (Suche, Rolle, Status)
  - **Admin-Panel:** Tabs-basiertes Dashboard mit User-, Rollen- und Tenant-Tabs
  - **Toggle Admin Role:** Admins können User zu Admins machen oder Admin-Rechte entfernen
  - **Toggle Verification:** Admins können User verifizieren/entverifizieren (is_verified)
  - **User Delete:** User löschen mit Bestätigungsdialog und Toast-Benachrichtigung
  - **Security:** Eigenen Account schützen (keine Selbst-Löschung)
  - **User Badges:** "Du" Badge für aktuellen User, Role-Badges (Admin/User), Verification-Badge
  - **Verification Status:** Zeigt Verifizierungsstatus aller User in der Tabelle
  - **Cognee Superuser Integration:** Nutzt Cognee's `is_superuser` Feld statt Rollen-System
  - **Table UI:** Moderne shadcn Table-Komponente mit vollständiger User-Übersicht
  - **Tabs Navigation:** Drei Tabs für User-Verwaltung, Rollen-Übersicht und Tenant-Info
  - **Role Statistics:** Zeigt Anzahl User pro Rolle im Rollen-Tab
  - **Tenant Info:** Zeigt Tenant-Details und Statistiken (Anzahl User)
  - **Search & Filter:** Suche nach E-Mail, Filter nach Rolle und Status
  - **Loading States:** Loading-Indikatoren und Error-Handling
  - **Toast Notifications:** Erfolgs- und Fehler-Toasts für alle Aktionen

- **Cognee Permissions System Integration:** Implementiert vollständiges Multi-User-Permissions-System für RAG-Chatbot
  - **Backend API-Endpoints:** Neue Proxy-Endpoints für Cognee Permissions API (Tenants, Roles, Permissions)
  - **TypeScript Types:** Interfaces für Tenant, Role, UserWithRoles, DatasetPermission
  - **Frontend API-Client:** Erweiterte cognee-api-client.ts mit Permissions-Methoden
  - **Auth Store:** Roles-Support mit isAdmin() und hasRole() Helper-Methoden
  - **Dataset Store:** Permissions-Integration mit ownerId, isShared, und shareDatasetWithTenant()
  - **Permissions Store:** NEU für Tenant-/Role-Management (initializeTenant, createRole, assignRoleToUser)
  - **Permission Helper:** Utility-Functions für Zugriffskontrolle (canShare, canDelete, canWrite, canRead)
  - **Permissions Badge:** UI-Komponente zur Anzeige von Dataset-Berechtigungen (Owner/Shared/Read-Only)
  - **Share Dataset Dialog:** Dialog für Admin zum Teilen von Datasets mit Tenant (Read-Only für alle User)
  - **Admin Panel:** Settings-Seite für Permissions-Management (Tenant-Info, Rollen, Nutzer)
  - **Setup Script:** Automatische Initialisierung von Tenant und Rollen beim ersten Start
  - **Single-Tenant Architecture:** "imeso-ki" Tenant für firmeninterne Nutzung
  - **Role-Based Access:** Admin- und User-Rollen mit unterschiedlichen Berechtigungen
- **Dataset Sharing:** Admins können Datasets mit allen Tenant-Usern teilen (Read-Only-Zugriff)
- **User Dataset Sharing:** Alle User können ihre eigenen Datasets mit dem Tenant teilen (Read-Only-Zugriff)
- **User Isolation:** Jeder User kann eigene Datasets erstellen mit vollen Rechten
  - **Backend Config:** Cognee muss mit ENABLE_BACKEND_ACCESS_CONTROL=true laufen
  - **Integration:** Permissions-System vollständig in bestehende Auth- und Dataset-Funktionalität integriert

### Fix - 16.01.2025

- **Missing Appearance Settings Index:** Behebt fehlende index.tsx Datei für Appearance Settings Route
  - Erstellt fehlende `src/features/settings/appearance/index.tsx` Datei
  - Exportiert `SettingsAppearance` Komponente für Route-Import
  - Wrapper-Komponente mit Header und `AppearanceForm` Integration
  - Behebt "Failed to load module script" Fehler bei Appearance Settings Route
  - Route kann jetzt korrekt `SettingsAppearance` aus `@/features/settings/appearance` importieren

### Fix - 16.01.2025

- **Chat Settings Simplification:** Entfernt Batch-Größe und Verzögerung aus den Chat-Einstellungen
  - **Removed UI Controls:** Batch-Größe und Verzögerung (ms) Felder aus Chat-Settings entfernt
  - **Fixed Default Values:** Standardwerte für batchSize und throttleDelay auf 80 gesetzt
  - **Simplified Interface:** Reduzierte Komplexität der Chat-Konfiguration für bessere UX
  - **Maintained Functionality:** Werte werden weiterhin intern verwendet, aber nicht mehr konfigurierbar

- **Cognee 409 Error Handling:** Implementiert umfassende Behandlung von Cognee "No Data" Fehlern
  - **User-Friendly Error Messages:** Zeigt verständliche Fehlermeldungen für 409 Cognee API Fehler
  - **Preventive Checks:** Fügt präventive Überprüfung hinzu, ob Dataset verarbeitete Daten enthält
  - **Dataset Status Display:** Erweitert Dataset-Selector um Verarbeitungsstatus-Anzeige
  - **Enhanced Visual Warnings:** Verbesserte Sichtbarkeit der Warnmeldung mit größerer Schrift und auffälligeren Farben
  - **Auto-Reset Dataset Selection:** Setzt automatisch selectedDataset zurück wenn nicht verfügbar oder nicht verarbeitet
  - **Empty Default Selection:** Standardmäßig ist kein Dataset ausgewählt, verhindert ungewollte Auswahl
  - **Error Prevention:** Verhindert 409 Fehler durch vorherige Datenverfügbarkeitsprüfung
  - **Better UX:** Benutzer sehen sofort, welche Datasets bereit sind und welche noch verarbeitet werden

- **Cmd+K Shortcut Fix:** Behebt nicht funktionierenden Cmd+K Shortcut für Command Menu
  - **Consolidated Event Listeners:** Alle Keyboard-Shortcuts werden jetzt zentral im SearchProvider verwaltet
  - **Removed Duplicates:** Entfernt doppelte Event-Listener aus ProfileDropdown Komponente
  - **Centralized Management:** Alle Shortcuts (⌘K, ⇧⌘N, ⇧⌘P, ⇧⌘C, ⌘S, ⇧⌘Q) werden an einem Ort verwaltet
  - **Improved Performance:** Verhindert Konflikte zwischen mehreren Event-Listenern
  - **Better Maintainability:** Einfachere Wartung und Debugging von Keyboard-Shortcuts

- **Dataset Search Error Fix:** Behebt TypeError beim Durchsuchen von Datasets mit undefined description
  - **Null Check:** Fügt Null-Check für dataset.description in searchDatasets Funktion hinzu
  - **Safe Rendering:** Zeigt Fallback-Text für undefined description in DatasetsPage an
  - **Error Prevention:** Verhindert "Cannot read properties of undefined (reading 'toLowerCase')" Fehler

- **Dataset Loading Optimization:** Behebt automatisches Laden von Datasets beim Hover über Sidebar
  - **Removed Auto-Loading:** Entfernt automatisches Laden von Datasets nach Login
  - **Conditional Loading:** Datasets werden nur angezeigt, wenn sie bereits geladen sind
  - **Click-Based Loading:** Datasets werden nur geladen, wenn Benutzer auf "Verwalten" klickt
  - **Performance Improvement:** Verhindert unnötige API-Aufrufe beim Hover über Sidebar-Elemente
  - **Sidebar Optimization:** Sidebar zeigt nur "Verwalten" Link, bis Datasets explizit geladen werden

- **Functional Keyboard Shortcuts:** Macht alle Shortcuts im Command Menu funktional
  - **Profile Dropdown:** "⌘K - Suchfunktion" als Informationstext hinzugefügt
  - **Search Component:** Placeholder-Text auf "Suchen oder Befehl eingeben..." geändert
  - **Command Menu:** Placeholder-Text auf "Suchen oder Befehl eingeben..." geändert
  - **Navbar:** Kreatives "Suchen mit ⌘K" Design in der Navbar hinzugefügt
    - **Modern Design:** Abgerundete Karte mit Hintergrund und Border
    - **Animierter Indikator:** Pulsierender Punkt für visuellen Fokus
    - **Interaktive Effekte:** Hover-Animationen und Farbübergänge
    - **Professioneller KBD:** Stilisiertes Keyboard-Shortcut mit Schatten
    - **Responsive:** Versteckt auf mobilen Geräten für optimale Platzausnutzung
  - **Command Menu:** Neue "Keyboard Shortcuts" Sektion mit funktionalen Shortcuts
  - **Functional Actions:** Alle Shortcuts führen jetzt die entsprechenden Aktionen aus:
    - ⌘K (Suchfunktion) - Schließt das Command Menu
    - ⇧⌘N (Neuer Chat) - Navigiert zu /chat
    - ⇧⌘P (Profil-Einstellungen) - Navigiert zu /settings
    - ⇧⌘C (Chat-Einstellungen) - Navigiert zu /settings/chat
    - ⌘S (Einstellungen) - Navigiert zu /settings
    - ⇧⌘Q (Abmelden) - Führt Abmeldung durch und navigiert zu /login
  - **Auth Store Integration:** Direkte Integration des Auth Stores für Abmelden-Funktionalität
  - **User Experience:** Benutzer können Shortcuts sowohl über Tastatur als auch über Mausklick verwenden

- **Account Settings Section Removal:** Entfernt komplette Konto-Sektion aus den Einstellungen
  - **Settings Sidebar:** "Konto" Navigation-Item aus der Sidebar entfernt
  - **Account Route:** `/settings/account` Route und Komponente gelöscht
  - **Account Components:** Alle Account-bezogenen Komponenten entfernt (SettingsAccount, AccountForm)
  - **Account Store:** Account Store komplett gelöscht
  - **Navigation Links:** Account-Links aus Nav-User-Dropdown entfernt
  - **Profile Dropdown:** Account-Link mit Shortcut "⇧⌘K" aus Profile-Dropdown entfernt
  - **Keyboard Shortcuts:** Entsprechender Keyboard-Shortcut für Account-Seite entfernt
  - **Clean Codebase:** Ungenutzte Imports und Abhängigkeiten bereinigt
  - **Simplified Settings:** Einstellungen-Seite fokussiert sich jetzt nur auf Profil, Chat, Anzeige und Anzeigeelement

- **Sign Out Dialog German Translation:** Übersetzt Sign-Out-Dialog und Buttons ins Deutsche
  - **SignOutDialog Component:** Titel "Sign out" → "Abmelden", Beschreibung vollständig übersetzt
  - **Dialog Message:** "Are you sure you want to sign out? You will need to sign in again to access your account." → "Sind Sie sicher, dass Sie sich abmelden möchten? Sie müssen sich erneut anmelden, um auf Ihr Konto zugreifen zu können."
  - **Button Texts:** "Sign out" → "Abmelden", "Cancel" → "Abbrechen"
  - **Profile Dropdown:** "Sign out" → "Abmelden" im Dropdown-Menü
  - **Nav User Component:** "Sign out" → "Abmelden" in der Sidebar-Navigation
  - **Consistent German UI:** Alle Sign-Out-bezogenen Texte sind jetzt auf Deutsch

- **Theme Switch System Mode Fix:** Behebt Theme-Color Meta-Tag für System-Modus
  - **ThemeSwitch Component Update:** Verwendet jetzt `resolvedTheme` anstatt `theme` für Meta-Tag-Updates
  - **System Mode Support:** Korrekte Behandlung des System-Modus in der Theme-Color-Logik
  - **Meta-Tag Consistency:** Theme-Color Meta-Tag wird jetzt korrekt für alle Theme-Modi aktualisiert
  - **Resolved Theme Integration:** Verwendet den bereits berechneten `resolvedTheme` aus dem Theme-Provider
  - **Better Theme Detection:** System-Modus wird jetzt korrekt als Light oder Dark aufgelöst für Meta-Tag-Updates

### Feat - 16.01.2025

- **Enhanced Cognify Function with Custom Prompt:** Implementiert ausführlichen Custom Prompt für optimale Bildverarbeitung
  - **Custom Prompt Integration:** Cognify-Funktion verwendet jetzt detaillierten Custom Prompt für bessere Verarbeitung
  - **Comprehensive Image Processing:** Spezielle Anweisungen für vollständige Bildanalyse ohne Detailverlust
  - **OCR Optimization:** Anweisungen für optimale Texterkennung aus Bildern und Dokumenten
  - **Structured Data Extraction:** Hierarchische Strukturierung und Organisation extrahierter Informationen
  - **Quality Assurance:** Qualitätssicherung und Validierung der Extraktionsergebnisse
  - **Contextual Analysis:** Kontextuelle Analyse und Verknüpfung verwandter Informationen
  - **Multi-format Support:** Unterstützung verschiedener Dateiformate (PDF, Bilder, Scans)
  - **Advanced Processing Guidelines:** Verwendung fortschrittlicher OCR-Technologien und Machine Learning-Modelle

### Fix - 16.01.2025

- **Dataset Auto-Loading After Login:** Implementiert automatisches Laden der Datasets nach erfolgreichem Login
  - **LoginForm Enhancement:** LoginForm lädt automatisch Datasets nach erfolgreichem Login über fetchDatasets()
  - **Authenticated Route Update:** Token-Verifikation in _authenticated Route lädt Datasets nach erfolgreicher Validierung
  - **Dataset Store Integration:** Verwendung des Dataset Stores in LoginForm und authentifizierten Routen
  - **Error Handling:** Graceful Fehlerbehandlung für Dataset-Loading ohne Beeinträchtigung des Login-Prozesses
  - **Sidebar Synchronization:** Datasets werden automatisch in der Sidebar-Navigation angezeigt nach Login
  - **Consistent User Experience:** Benutzer sehen sofort ihre Datasets ohne manuelle Aktualisierung
  - **Token-Based Loading:** Dataset-Loading erfolgt sowohl bei manuellem Login als auch bei automatischer Token-Verifikation

- **Profile URL Elements Removal:** Entfernt URL-Elemente aus der Profil-Seite für vereinfachte Benutzeroberfläche
  - **Profile Form Cleanup:** Entfernung aller URL-Eingabefelder und URL-Verwaltung aus der Profile-Form
  - **Schema Simplification:** Profile-Schema vereinfacht - nur noch Username und E-Mail-Felder
  - **ProfileStore Update:** Entfernung der URL-Behandlung aus dem ProfileStore
  - **Form Validation:** Vereinfachte Validierung ohne URL-spezifische Regeln
  - **Cleaner UI:** Sauberere und fokussiertere Profil-Seite ohne URL-Ablenkungen
  - **Reduced Complexity:** Weniger Code und einfachere Wartung der Profil-Funktionalität
  - **useFieldArray Removal:** Entfernung der useFieldArray-Hook da keine dynamischen URL-Felder mehr benötigt werden

- **Profile Data Synchronization:** Behebt Anzeige von falschen Benutzerdaten im Profile-Dropdown
  - **ProfileDropdown Update:** Verwendet jetzt echte Auth-Daten anstatt Storage-Werte für Name und E-Mail
  - **AuthStore Integration:** ProfileDropdown zeigt jetzt die tatsächlichen Daten aus Login/Registrierung an
  - **Dynamic User Data:** Name wird automatisch aus E-Mail-Adresse generiert (Teil vor @)
  - **Real-time Updates:** Profile-Daten werden automatisch aktualisiert wenn sich Auth-Status ändert
  - **ProfileStore Enhancement:** Neue getCurrentUserData() Methode für direkten Zugriff auf Auth-Daten
  - **Profile Form Sync:** Profile-Form verwendet jetzt Auth-Daten als Standard-Werte
  - **Consistent Data Source:** Alle Profile-Komponenten verwenden jetzt die gleiche Datenquelle (AuthStore)
  - **Fallback Handling:** Graceful Fallback zu Storage-Werten wenn Auth-Daten nicht verfügbar sind

- **File Deletion Confirmation Dialog:** Implementiert Bestätigungsdialog für das Löschen von Dateien in Datasets
  - **DeleteFileDialog Component:** Neue Dialog-Komponente für sichere Datei-Löschung mit Bestätigung
  - **Dataset Detail Page:** Ersetzt sofortige Löschung durch Bestätigungsdialog in der Dataset-Detail-Seite
  - **File Detail Page:** Ersetzt einfachen confirm() Dialog durch professionellen DeleteFileDialog
  - **Consistent UX:** Einheitliche Benutzeroberfläche für alle Datei-Löschvorgänge mit modernem Dialog-Design
  - **Error Handling:** Umfassende Fehlerbehandlung mit Toast-Benachrichtigungen für erfolgreiche und fehlgeschlagene Löschvorgänge
  - **Loading States:** Loading-Indikatoren während des Löschvorgangs für bessere Benutzererfahrung
  - **German Translation:** Vollständig deutsche Benutzeroberfläche mit "Datei löschen" und "Möchten Sie die Datei wirklich löschen?"
  - **Success Callbacks:** Automatische Aktualisierung der Dataset-Daten nach erfolgreicher Löschung
  - **Navigation Integration:** Automatische Rücknavigation zur Dataset-Seite nach Löschung in der File-Detail-Seite
  - **Prevents Accidental Deletion:** Verhindert versehentliches Löschen von Dateien durch Bestätigungsdialog

### Fix - 16.01.2025

- **Login Page Redesign:** Komplett neues modernes Login-Design mit shadcn/ui Komponenten
  - **Card-basiertes Layout:** Elegante Card-Komponente mit Glassmorphism-Effekt (backdrop-blur-sm)
  - **Gradient-Hintergrund:** Schöner Gradient von slate-50 zu slate-100 (Light) / slate-900 zu slate-800 (Dark)
  - **Zentriertes Design:** Vollständig zentriertes Layout ohne zwei-spaltige Struktur
  - **Moderne Effekte:** Shadow-xl, transparente Hintergründe (bg-white/80) und Backdrop-Blur
  - **Verbesserte Typografie:** CardTitle und CardDescription für bessere Hierarchie
  - **Logo-Integration:** Zentriertes Logo im CardHeader mit größerer Darstellung (h-12)
  - **Enhanced Input-Felder:** Höhere Input-Felder (h-11) mit verbesserter Border-Farbe und Focus-States
  - **Verbesserte Buttons:** Konsistente Höhe (h-11) mit modernen Hover-Effekten
  - **Deutsche Übersetzung:** "Willkommen zurück" und "Melden Sie sich bei Ihrem Agent AI Konto an"
  - **Responsive Design:** Optimiert für alle Bildschirmgrößen mit max-w-md Container
- **Logout Redirect Fix:** Behebung der Logout-Weiterleitung zur falschen Login-Seite
  - **SignOutDialog Update:** SignOutDialog leitet jetzt zu `/login` anstatt `/sign-in` weiter
  - **Main.tsx Auth Error Fix:** 401-Fehler in main.tsx leiten jetzt zu `/login` anstatt `/sign-in` weiter
  - **Consistent Login Route:** Alle Logout-Weiterleitungen verwenden jetzt die ursprüngliche Login-Seite (`/login`)
- **Dataset ID Only Usage:** Behebung der Verwendung von dataset_name in der Cognee add und search Funktionen
  - **Removed datasetName Parameter:** Entfernung des optionalen datasetName Parameters aus der AddDataRequest Interface
  - **Dataset ID Only:** Alle addDataToDataset Aufrufe verwenden jetzt nur noch die dataset_id anstatt dataset_name
  - **Search Function Fix:** Cognee Search API verwendet jetzt datasetIds anstatt datasets für bessere Kompatibilität
  - **Dataset Selector Update:** Dataset-Selektor übergibt jetzt dataset.id anstatt dataset.name an den Chat Store
  - **Backend Search Update:** Backend Search-Endpunkt verwendet jetzt datasetIds Parameter für Cognee API-Aufrufe
  - **Cross-User Dataset Support:** Ermöglicht das Hinzufügen von Daten zu Datasets, die nicht dem aktuellen Benutzer gehören
  - **API Consistency:** Verbesserte Konsistenz mit der Cognee API-Spezifikation für dataset_id basierte Operationen
  - **Simplified Interface:** Vereinfachte AddDataRequest Interface durch Entfernung redundanter Parameter
- **Cognee Search Authentication Fix:** Behebung des 401 Unauthorized-Fehlers bei Cognee Search-Anfragen
  - **useChat Authorization:** useChat Hook wurde mit einem fetch Callback erweitert, um automatisch Authorization-Header hinzuzufügen
  - **Token Injection:** Authentifizierungstoken wird jetzt automatisch für alle Cognee Search-Anfragen übertragen
  - **Auth Store Integration:** Direkte Integration des Auth Stores in die Chat-Komponente für Token-Zugriff
  - **Conditional Headers:** Authorization-Header wird nur für Cognee-Modus hinzugefügt, nicht für andere Chat-Provider

### Feat - 16.01.2025

- **Cognee API Authentication Integration:** Vollständige Implementierung eines Authentifizierungssystems mit der Cognee API
  - **Backend Authentication Middleware:** Neue Endpunkte in server/chat-api.ts für Login, Registrierung, Logout und Token-Verifikation
  - **Token-basierte Zugriffskontrolle:** Alle Cognee-Anfragen erfordern jetzt Authentifizierung über Bearer Token
  - **Frontend Auth Store:** Erweiterte Zustand-Verwaltung mit Cognee-spezifischen Benutzerfeldern (id, tenant_id, is_active, is_verified)
  - **Login-Seite Integration:** Echte API-Integration mit Fehlerbehandlung und automatischer Weiterleitung nach erfolgreichem Login
  - **Registrierungs-Seite:** Neue Registrierungskomponente mit Validierung und automatischer Weiterleitung zur Login-Seite
  - **Route Guards:** beforeLoad-Hooks in _authenticated-Routen für Token-Validierung und automatische Umleitung bei ungültigen Tokens
  - **Cognee API Client:** Axios-basierter Client mit automatischer Token-Injektion und 401/403-Fehlerbehandlung
  - **Datasets API Update:** Aktualisierung der datasets-api.ts für Token-basierte Authentifizierung über Auth Store
  - **Environment Configuration:** Cognee-Authentifizierungs-Flags (ENABLE_BACKEND_ACCESS_CONTROL, REQUIRE_AUTHENTICATION) hinzugefügt
  - **Automatische Token-Verifikation:** Token-Validierung beim App-Start und bei jedem geschützten Routen-Zugriff
  - **Benutzer-Isolation:** Jeder authentifizierte Benutzer erhält isolierten Zugriff auf seine Cognee-Datasets und -Daten
  - **Sichere API-Kommunikation:** Alle Anfragen an imeso-ki-02:8000 werden mit Authentifizierungstoken gesichert
  - **Fehlerbehandlung:** Umfassende Fehlerbehandlung für 401 Unauthorized, 403 Forbidden und Netzwerkfehler
  - **Persistente Authentifizierung:** Token-Speicherung in Cookies und localStorage für nahtlose Benutzererfahrung
  - **Deutsche Benutzeroberfläche:** Vollständige Übersetzung aller Authentifizierungs-Komponenten ins Deutsche
- **Profile Store Email Integration:** Dynamische E-Mail-Adresse des authentifizierten Benutzers
  - **Removed Hardcoded Email:** Entfernung der fest codierten E-Mail-Adresse m@example.com aus dem Profile Store
  - **Dynamic Email Source:** Profile Store verwendet jetzt die E-Mail-Adresse des authentifizierten Benutzers aus dem Auth Store
  - **getCurrentUserEmail Method:** Neue Methode für dynamische E-Mail-Abfrage aus dem authentifizierten Benutzer
  - **User-Specific Profile Data:** Profile-Daten werden jetzt benutzerspezifisch geladen statt mit Standard-Werten
  - **Real User Information:** Echte Benutzerdaten aus dem Cognee-System werden in der Profile-Seite angezeigt

### Feat - 16.01.2025

- **Error Pages German Translation:** Vollständige Übersetzung aller Error Pages auf Deutsch
  - forbidden.tsx: "Access Forbidden" → "Zugriff verweigert"
  - general-error.tsx: "Oops! Something went wrong" → "Ups! Etwas ist schiefgelaufen"
  - maintenance-error.tsx: "Website is under maintenance!" → "Website befindet sich im Wartungsmodus!"
  - not-found-error.tsx: "Oops! Page Not Found!" → "Ups! Seite nicht gefunden!"
  - unauthorized-error.tsx: "Unauthorized Access" → "Unbefugter Zugriff"
  - Alle Button-Texte übersetzt: "Go Back" → "Zurück", "Back to Home" → "Zur Startseite"
  - Deutsche Fehlermeldungen für bessere Benutzerfreundlichkeit
  - Konsistente deutsche Terminologie in allen Error Pages

### Fix - 16.10.2025

- **TypeScript Build Errors:** Behebung aller TypeScript-Kompilierungsfehler
  - NavGroup Type-Kompatibilitätsprobleme behoben
  - Ungenutzte Imports in ai-markdown.tsx und cognee-markdown.tsx entfernt
  - @types/react-syntax-highlighter installiert für fehlende Type-Definitionen
  - Inline-citation.tsx ref-Type-Probleme behoben
  - Appearance-form.tsx Form-Type-Issues korrigiert
  - Chat-api.ts ungenutzte Imports entfernt
  - SyntaxHighlighter Style-Type-Probleme behoben
  - NavGroup-Extended map-Property-Fehler korrigiert
  - Alle TypeScript-Fehler erfolgreich behoben, Build läuft ohne Fehler

- **Dependencies Update:** Fehlende Bibliotheken zur package.json hinzugefügt
  - rehype-slug (^6.0.0) für Markdown-Slug-Generierung
  - embla-carousel-react (^8.6.0) für Carousel-Komponenten
  - shiki (^3.13.0) für Syntax-Highlighting
  - react-syntax-highlighter (^15.6.6) für Code-Syntax-Highlighting
  - Alle verwendeten Bibliotheken sind jetzt in package.json vorhanden
  - Vite Dependency-Scan-Fehler behoben, Build läuft erfolgreich

- **Docker Setup:** Vollständige Docker-Integration mit Cognee und Ollama
  - Docker Compose Konfiguration für Production und Development
  - Cognee-Integration mit DeepSeek LLM und OpenAI Embeddings
  - Nginx-Proxy für API-Routing zwischen Services
  - Alle Services konfiguriert für imeso-ki-02
  - Umfassende Dokumentation und Deployment-Skripte
  - Behebung von dotenv-Dependency-Problem in Development-Container
  - Hinzufügung fehlender Markdown-Dependencies (remark-emoji, rehype-highlight, rehype-raw)
  - Node.js 22 Support für Vite 7.x Kompatibilität

### Feat - 15.01.2025

- **Route Refactoring:** Umbenennung der Chat-Routen von `/ollama-chat` zu `/chat` für bessere Benutzerfreundlichkeit
  - Alle Routen von `ollama-chat` zu `chat` umbenannt
  - Navigation und Links entsprechend aktualisiert
  - CSS-Klassen von `ollama-chat-container` zu `chat-container` geändert
  - Route-Tree-Generierung aktualisiert
  - Dokumentation mit neuen Chat-Endpunkten erweitert
  - Beibehaltung aller bestehenden Funktionalitäten

- **Enhanced Markdown Rendering:** Verbessertes Markdown-Rendering mit optimierter Inline-Code-Darstellung
  - Neue `AIMarkdown` Komponente mit verbesserter Inline-Code-Unterstützung in Zitaten
  - Erweiterte Citation-Badge-Komponente mit detaillierten Tooltip-Informationen
  - Verbesserte Codeblock-Darstellung mit Syntax-Highlighting und Copy-Funktionalität
  - Neue `useAIElements` Prop in Response, CogneeMarkdown und Chat-Komponenten
  - Aktiviert standardmäßig in OllamaChat für bessere Code-Formatierung
  - Beibehaltung der bestehenden Funktionalität mit erweiterten Rendering-Optionen
  - Professionelle Suggestion-Komponenten mit verbesserter UX
  - Optimierte Markdown-Parsing-Logik für bessere Inline-Code-Erkennung

- **AI SDK Suggestion Components:** Implementiert moderne Suggestion-Komponenten basierend auf AI SDK Elements
  - Ersetzt benutzerdefinierte Suggestion-Komponente durch AI SDK-konforme Implementierung
  - Neue `Suggestions` und `SuggestionItem` Komponenten mit verbesserter UX
  - Vertikale Suggestion-Liste für bessere Lesbarkeit und Übersichtlichkeit
  - Sichtbare Borders für bessere visuelle Abgrenzung der Suggestion-Buttons
  - Verbesserte Hover-Effekte und moderne Button-Styles
  - Responsive Design mit Touch-freundlichen Zielen
  - TypeScript-Unterstützung mit korrekten Typdefinitionen
  - Suggestion-Komponenten nur in Chat-Antworten, nicht im leeren Chat-Zustand

### Fix - 15.01.2025

- **Debug Information Removal:** Entfernt Debug-Informationen aus der CogneeMarkdown-Komponente
  - Debug-Box mit Citation-Details, Content-Längen und Parsing-Informationen entfernt
  - Saubere Benutzeroberfläche ohne Entwicklungshinweise
  - Verbessert die Benutzererfahrung durch Entfernung von technischen Details
  - Komponente zeigt nur noch relevante Inhalte für Endbenutzer an

- **Muted Color Update:** Ändert `--muted` Farbe zu `hsl(0, 0%, 98%)` in der gesamten Anwendung
  - `--muted` verwendet jetzt `oklch(0.98 0 0)` (entspricht `hsl(0, 0%, 98%)`)
  - Änderung gilt für beide Themes (Light und Dark Mode)
  - Alle Komponenten mit `bg-muted` werden automatisch aktualisiert
  - Avatar-Fallbacks, subtile Hintergründe und andere muted-Elemente verwenden jetzt die hellere Farbe
  - Verbessert die visuelle Konsistenz und Lesbarkeit der Anwendung

- **Citation Badge Display Fix:** Behebt das Problem, dass Citation-Placeholder anstatt echte Badges angezeigt werden
  - Citation-Placeholder (`__CITATION_PLACEHOLDER_N__`) werden jetzt korrekt durch echte Citation-Badges ersetzt
  - Implementiert direkte Citation-Badge-Integration ohne Placeholder-System
  - Zitate erscheinen als klickbare Badges mit Hover-Tooltips direkt im Textfluss
  - Ersetzt komplexes Placeholder-System durch einfache, direkte Badge-Rendering
  - Verbessert die Zuverlässigkeit der Citation-Anzeige
  - Behebt das Problem, dass nur Placeholder-Text anstatt funktionale Badges angezeigt wurden

- **Inline Citation Display Fix:** Behebt das Problem, dass Zitate in separaten Zeilen angezeigt werden
  - Zitate werden jetzt inline mit dem Text angezeigt anstatt in eigenen Zeilen
  - Implementiert custom Markdown-Renderer mit spezieller Paragraph-Behandlung für Citation-Placeholder
  - Ersetzt separate MarkdownRenderer-Komponenten durch inline Text-Rendering
  - Zitate erscheinen direkt neben dem Text als klickbare Badges mit Hover-Tooltips
  - Verbessert die Lesbarkeit und Benutzerfreundlichkeit der Citation-Anzeige
  - Behebt Linter-Fehler und TypeScript-Probleme in der CogneeMarkdown-Komponente

### Feat - 15.01.2025

- **Dynamische Zitat-Erkennung mit shadcn Hover-Tooltips:** Vollständige Überarbeitung der Citation-Implementierung
  - **Erweiterte DeepSeek Antwort-Parsing:** Robuste Regex-Patterns für verschiedene Citation-Formate
  - **shadcn Tooltip Integration:** Professionelle Hover-Tooltips mit detaillierten Zitat-Informationen
  - **Verbesserte Citation-Parsing:** Unterstützt verschiedene Formatierungsvarianten und Fallback-Modi
  - **Dynamische Badge-Rendering:** Intelligente Zitat-Badges mit Hover-Informationen
  - **Enhanced Debug-Modus:** Detaillierte Parsing-Informationen für Development
  - **Robuste Suggested Questions Parsing:** Unterstützt verschiedene Listenformate (*, -, 1.)
  - **Fallback-Parsing:** Graceful Degradation bei unerwarteten Citation-Formaten
  - **Professional Citation Display:** Strukturierte Anzeige von Dokumenttyp, Sektion und Inhalt
  - **Citation-Table-Konflikt-Lösung:** Verhindert dass Citations-Sektionen als Tabellen interpretiert werden
  - **Markdown-Rendering-Fix:** Verbesserte Erkennungslogik für normale Markdown-Texte vs. Cognee-Content
  - **Streaming-Content-Fix:** Korrekte Markdown-Erkennung während und nach dem Streaming-Prozess
  - **Citation-Markdown-Integration:** Markdown-Formatierung wird auch in Citation-Texten korrekt angewendet

- **Cognee CHUNKS-Modus mit DeepSeek Integration und Streaming Inline-Citations:** Implementiert erweiterte RAG-Funktionalität mit professionellen Zitierungen
  - Cognee liefert relevante Chunks zur Benutzeranfrage (unsichtbar für User)
  - Nutzt bestehende DeepSeek-Server-Middleware-Logik direkt
  - **Robuster RAG-System-Prompt** mit strengen Formatierungsregeln und Qualitätschecks
  - **Streaming Inline-Citations** als klickbare Badges mit Details
  - **Neues Citation-Format:** [CITATION:1], [CITATION:2] im Text + separate "### Citations" Sektion mit Details
  - **Echte Inline-Citations während Streaming** - klickbare Badges erscheinen direkt im Text
  - **Robustes Citation-Parsing** aus "### Citations" Sektion mit vollständigen Quellen-Informationen
  - **Citation-Informationen aus Document Chunks** extrahiert
  - **Debug-Modus** für Development (zeigt Citation-Count)
  - **Suggested Questions** im Perplexity-Stil als klickbare Buttons
  - Automatisches Parsing von Inline-Citations und Suggestions aus Streaming-Content
  - Streaming der DeepSeek-Antwort an den User mit AI SDK Data Stream Format
  - Robuste Chunk-Extraktion mit Unterstützung verschiedener Cognee-Response-Formate
  - Separate Fehlerbehandlung für Cognee und DeepSeek APIs
  - Verbesserte Antwortqualität durch Kombination von RAG und LLM-Stärken
  - Effiziente Server-Middleware-Integration ohne HTTP-Overhead
  - **Neue UI-Komponenten:** HoverCard, Carousel, InlineCitation, Suggestion
  - **CogneeMarkdown-Komponente** für intelligentes Rendering von Streaming RAG-Antworten
  - **Neue Dependencies:** @radix-ui/react-hover-card, embla-carousel-react

### Fix - 15.01.2025

- **Cognee Message History Context:** Implementiert vollständige Nachrichtenhistorie für Cognee RAG-Suche
  - Ersetzt einzelne Nachricht durch formatierte Nachrichtenhistorie als String
  - Klare Unterscheidung zwischen User- und AI-Nachrichten im Format "User: [message]" und "AI: [message]"
  - System-Prompt erweitert um Erklärung der Nachrichtenhistorie-Formatierung
  - Cognee erhält jetzt vollständigen Kontext aus vorherigen Nachrichten für bessere Antworten
  - Verbessert die Qualität und Relevanz der RAG-basierten Antworten durch Kontext-Bewusstsein

- **Cognee System-Prompt auf Deutsch:** Vollständige Übersetzung und Erweiterung des System-Prompts für RAG-Optimierung
  - System-Prompt komplett auf Deutsch übersetzt für bessere Verständlichkeit
  - Erweiterte Anweisungen speziell für RAG-Nutzung mit 10 detaillierten Punkten
  - Betont Kontext-Integration zwischen Konversationshistorie und Dokumenten
  - Explizite Anweisungen für Vollständigkeit, Detailliertheit und Strukturierung
  - RAG-optimierte Anweisungen für intelligente Nutzung der Wissensdatenbank
  - Konversationskontext-Berücksichtigung für kohärente Antworten
  - Benutzerorientierte Anpassung basierend auf Gesprächsverlauf
  - Verbesserte Qualität und Relevanz der deutschen RAG-Antworten

- **File Upload Size Limit Increase:** Erhöht die Datei-Upload-Beschränkung von 10MB auf 50MB
  - Aktualisiert `maxSize` in `upload-file-dialog.tsx` von 10MB auf 50MB
  - Aktualisiert `maxSize` in `add-data-dialog.tsx` von 10MB auf 50MB
  - Aktualisiert `maxSize` in `image-embedder.tsx` von 10MB auf 50MB
  - Fehlermeldungen und UI-Texte entsprechend angepasst
  - Benutzer können jetzt größere Dateien (bis zu 50MB) hochladen
  - Betrifft alle Upload-Komponenten: Dataset-Dateien, Bilder und allgemeine Dateien

- **Cognee System Prompt Update:** Ändert den Systemprompt für sehr lange und vollständige Antworten
  - Neuer Systemprompt fordert **sehr lange**, detaillierte und umfassende Antworten mit Markdown-Formatierung
  - Explizite Anweisung, **ALLE** relevanten Informationen aus dem bereitgestellten Kontext ohne Ausnahme zu inkludieren
  - Keine Details sollen weggelassen werden, egal wie klein oder scheinbar unbedeutend
  - **Gründliche und erschöpfende Erklärungen** werden gefordert
  - Strukturierte Antworten mit Überschriften, Listen und Formatierung für bessere Klarheit
  - **Sprachkonsistenz**: Antworten müssen immer in der gleichen Sprache wie die Benutzerfrage erfolgen
  - **Vollständigkeit vor Kürze**: Längere Antworten werden bevorzugt
  - Betrifft sowohl den Standard-Systemprompt im Store als auch den Fallback-Systemprompt in der API
  - Verbessert die Qualität, Vollständigkeit, Länge und Sprachkonsistenz der Cognee-Antworten

- **Light Theme Primary Color Update:** Ändert die Button-Hintergrundfarbe von schwarz zu der grauen Farbe des Textarea-Hintergrunds
  - Verwendet `var(--accent)` für `--primary` anstatt der schwarzen Farbe
  - Diese Farbe (oklch(0.968 0.007 247.896)) wird bereits für `bg-accent` im Chat-Textarea verwendet
  - Button-Hintergründe (`bg-primary`) verwenden jetzt die gleiche helle graue Farbe wie das Chat-Input-Feld
  - Button-Text (`text-primary-foreground`) verwendet jetzt dunkle Farbe (oklch(0.129 0.042 264.695)) für bessere Lesbarkeit auf hellem Hintergrund
  - Konsistente Verwendung der bereits definierten Theme-Farben für bessere Wartbarkeit
  - Verbessert die Lesbarkeit und reduziert die Helligkeit für angenehmere Augen
  - Behält alle anderen Theme-Eigenschaften und das Dark Theme unverändert bei

- **Streamdown Copy Toast Support:** Fügt Toast-Benachrichtigungen für Codeblock-Kopierfunktion hinzu
  - Implementiert Toast-Benachrichtigung beim Kopieren von Codeblöcken in Streamdown-Komponente
  - Verwendet Sonner Toast-Bibliothek für konsistente Benutzeroberfläche
  - Aktiviert Copy-Controls in Streamdown für bessere UX
  - Zeigt "Code wurde erfolgreich kopiert!" Nachricht nach erfolgreichem Kopieren
  - Verwendet Event-Delegation für robuste Copy-Button-Erkennung

- **Streamdown Catppuccin Theme Support:** Fügt Catppuccin Latte und Mocha Themes für Streamdown-Komponente hinzu
  - Implementiert automatische Theme-Erkennung für Codeblöcke in Streamdown
  - Verwendet Catppuccin Latte Theme für hellen Modus und Catppuccin Mocha Theme für dunklen Modus
  - Verbessert die Lesbarkeit von Codeblöcken in beiden Theme-Modi
  - Behält bestehende MarkdownRenderer-Funktionalität für nicht-Code-Inhalte bei

- **Hybrid Markdown Rendering Fix:** Kombiniert shadcn-markdown und Streamdown für optimale Formatierung
  - Verwendet shadcn-markdown (react-markdown) für normale Inhalte und Listen-Formatierung
  - Behält Streamdown für Codeblöcke bei, da es bessere Code-Formatierung bietet
  - Behebt Formatierungsprobleme bei nummerierten Listen während des AI-Streamings
  - Fügt @tailwindcss/typography Plugin für bessere Typografie hinzu
  - Intelligente Erkennung: Codeblöcke (```) verwenden Streamdown, andere Inhalte shadcn-markdown
  - Unterstützt Syntax-Highlighting, Math-Rendering und Emoji-Integration

- **Cognee Stream Format Fix:** Behebt "Failed to parse stream string" Fehler bei Cognee-Antworten
  - Cognee API-Antworten werden jetzt im AI SDK Data Stream Format gestreamt
  - Korrekte Formatierung mit `0:"content"\n` Präfix für jeden Chunk
  - Escape-Sequenzen für Sonderzeichen (Backslash, Anführungszeichen, Zeilenumbrüche)
  - Zusätzliche HTTP-Header für bessere Stream-Kompatibilität (Cache-Control, Connection)
  - Frontend kann Cognee-Antworten jetzt korrekt parsen und anzeigen

### Feat - 15.01.2025

- **Cognee RAG Search Integration:** Implementiert RAG-basierte Suche mit Cognee API
  - Neue Chat-Modi: "General Chat" (Ollama/DeepSeek) und "Cognee Search" (RAG-basiert)
  - Chat-Modus Switcher in der BottomBar für einfachen Wechsel zwischen Modi
  - Dataset-Selector für Cognee-Modus mit Filterung nach Datasets mit mindestens einem Dokument
  - Conditional Rendering von Model-Selector (General) oder Dataset-Selector (Cognee) in der TopBar
  - Streaming-Support für Cognee API mit GRAPH_COMPLETION Modus
  - Validierung: Dataset-Auswahl erforderlich im Cognee-Modus, Model-Auswahl im General-Modus
  - Persistierung von Chat-Modus und ausgewähltem Dataset im localStorage
  - Kompatible Markdown-Response-Verarbeitung wie bei Ollama/DeepSeek

### Fix - 14.01.2025

- **Dataset Name Validation Fix:** Behebt "Dataset name cannot contain spaces or dots" Fehler
  - Implementiert `sanitizeDatasetName()` Methode zur automatischen Bereinigung von Dataset-Namen
  - Ersetzt Leerzeichen durch Unterstriche und entfernt Punkte vor API-Aufrufen
  - Dataset-Erstellung bereinigt Namen automatisch vor Backend-Übertragung
  - Alle Upload-Methoden senden bereinigte Dataset-Namen an das Backend
  - Verhindert Validierungsfehler bei Dataset-Namen mit Sonderzeichen

- **Add Data Dialog UX Fix:** Verbessert Benutzererfahrung beim Hinzufügen von Daten
  - Modal schließt sich automatisch nach erfolgreichem Upload aller Elemente
  - Verhindert doppeltes Hinzufügen von Elementen durch verbesserte State-Verwaltung
  - Toast-Benachrichtigungen für Erfolg und Fehler beim Upload
  - Automatisches Zurücksetzen des Dialog-States beim Schließen
  - Bessere Fehlerbehandlung mit detaillierten Fehlermeldungen

- **Dataset Processing Toast Notifications:** Sofortige Benachrichtigungen bei Verarbeitungsabschluss
  - Toast-Benachrichtigung wird sofort angezeigt, wenn API-Antwort vom Backend kommt
  - Fehler-Toast wird sofort angezeigt, wenn Dataset-Verarbeitung fehlschlägt
  - Toast wird direkt in `checkDatasetStatus()` ausgelöst, nicht erst beim nächsten Polling-Zyklus
  - Intelligente Status-Erkennung: Toast nur bei tatsächlicher Status-Änderung von "STARTED" zu "COMPLETED"
  - Dynamischer Import von Sonner Toast zur Vermeidung von zirkulären Abhängigkeiten

- **Dataset Status Update After Upload:** Automatische Status-Aktualisierung nach Daten-Upload
  - Dataset-Status wird sofort auf "DATASET_PROCESSING_INITIATED" gesetzt nach erfolgreichem Upload
  - Betrifft alle Upload-Methoden: `uploadFileToDataset`, `addTextToDataset`, `addUrlToDataset`, `addUrlsToDataset`
  - Benutzer sieht sofort, dass das Dataset verarbeitet werden muss
  - Status-Badge wird automatisch aktualisiert ohne manuelle Aktualisierung

- **Immediate Status Check After Processing:** Sofortige Status-Überprüfung nach Verarbeitungsstart
  - Status wird automatisch nach 1 Sekunde überprüft, wenn "Dataset verarbeiten" geklickt wird
  - Betrifft sowohl einzelne Dataset-Verarbeitung als auch "Alle verarbeiten" Funktion
  - Benutzer sieht sofort, ob die Verarbeitung erfolgreich gestartet wurde
  - Status-Badge wird automatisch von "Muss verarbeitet werden" zu "Wird verarbeitet..." aktualisiert

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

### Fix - 10.10.2025

- fix Cognee API parameter format (query params instead of body params) (#35)
- resolve 400 Bad Request errors for tenant/role creation (#34)
- correct frontend API client to match backend query parameter expectations (#33)

### Feat 25-12-2024

- implement chat page (#21)
- add 401 error page (#12)
- implement apps page
- add otp page