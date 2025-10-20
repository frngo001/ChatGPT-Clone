# Docker Setup für Agent AI

Dieses Setup containerisiert Frontend und Cognee auf der `imeso-ki-02` Maschine und verbindet sich mit externem Ollama.

## Voraussetzungen

- Docker und Docker Compose installiert auf `imeso-ki-02`
- Ollama läuft auf `imeso-ki-02`
- OpenAI API Key für Cognee

## Services

### Externe Services (auf imeso-ki-02)
- **Ollama**: `http://imeso-ki-02:11434`

### Containerisierte Services (auf imeso-ki-02)
- **Frontend**: `http://imeso-ki-02:3000` (Production)
- **Frontend Dev**: `http://imeso-ki-02:5173` (Development)
- **Cognee**: `http://imeso-ki-02:8000` (local container)

## Schnellstart

### 1. .env Datei erstellen
```env
# Services Configuration (all on imeso-ki-02)
OLLAMA_URL=http://imeso-ki-02:11434
COGNEE_URL=http://imeso-ki-02:8000

# Frontend Configuration
NODE_ENV=production

# Development URLs (for Vite)
VITE_OLLAMA_URL=http://imeso-ki-02:11434
VITE_COGNEE_URL=http://imeso-ki-02:8000

# Cognee LLM Configuration
LLM_PROVIDER=custom
LLM_MODEL=deepseek/deepseek-chat
LLM_ENDPOINT=https://api.deepseek.com/v1
LLM_API_KEY=

# Cognee Embedding Configuration
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=openai/text-embedding-3-large
EMBEDDING_DIMENSIONS=3072
EMBEDDING_ENDPOINT=https://api.openai.com/v1
EMBEDDING_API_KEY=

# Cognee Database Configuration
DATABASE_URL=sqlite:///app/data/cognee.db
COGNEE_DATA_DIR=/app/data
```

### 2. Production starten
```bash
# Mit Skript
./start.sh

# Oder direkt
docker-compose up -d
```

### 3. Development starten
```bash
# Mit Skript
./start-dev.sh

# Oder direkt
docker-compose -f docker-compose.dev.yml up -d
```

## Verfügbare Befehle

### Production
```bash
# Starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f

# Stoppen
docker-compose down

# Neustart
docker-compose restart
```

### Development
```bash
# Starten
docker-compose -f docker-compose.dev.yml up -d

# Logs anzeigen
docker-compose -f docker-compose.dev.yml logs -f

# Stoppen
docker-compose -f docker-compose.dev.yml down

# Neustart
docker-compose -f docker-compose.dev.yml restart
```

## Netzwerk-Konfiguration

Das Setup verwendet ein Docker-Netzwerk für Container-Kommunikation:

```yaml
networks:
  agent-ai-network:
    driver: bridge
```

Cognee-Container haben `extra_hosts` um auf die externe `imeso-ki-02` Maschine zuzugreifen:

```yaml
extra_hosts:
  - "imeso-ki-02:host-gateway"
```

## Nginx Proxy

Der Nginx-Container leitet API-Requests weiter:
- `/api/v1/*` → `${COGNEE_URL}/api/v1/*` (Cognee auf imeso-ki-02)
- `/api/ollama/*` → `${OLLAMA_URL}/api/*` (Ollama auf imeso-ki-02)
- `/api/tags` → `${OLLAMA_URL}/api/tags` (Ollama auf imeso-ki-02)

Die URLs werden zur Laufzeit durch Umgebungsvariablen ersetzt.

## Frontend Environment Variables

Das Frontend-Container erhält alle relevanten Cognee-Umgebungsvariablen:

```yaml
environment:
  # Service URLs
  - COGNEE_URL=http://imeso-ki-02:8000
  - OLLAMA_URL=http://imeso-ki-02:11434
  - VITE_COGNEE_URL=http://imeso-ki-02:8000
  - VITE_OLLAMA_URL=http://imeso-ki-02:11434
  # Cognee Configuration
  - LLM_PROVIDER=${LLM_PROVIDER}
  - LLM_MODEL=${LLM_MODEL}
  - LLM_ENDPOINT=${LLM_ENDPOINT}
  - LLM_API_KEY=${LLM_API_KEY}
  - EMBEDDING_PROVIDER=${EMBEDDING_PROVIDER}
  - EMBEDDING_MODEL=${EMBEDDING_MODEL}
  - EMBEDDING_DIMENSIONS=${EMBEDDING_DIMENSIONS}
  - EMBEDDING_ENDPOINT=${EMBEDDING_ENDPOINT}
  - EMBEDDING_API_KEY=${EMBEDDING_API_KEY}
  - DATABASE_URL=${DATABASE_URL}
  - COGNEE_DATA_DIR=${COGNEE_DATA_DIR}
```

## Cognee Configuration

Cognee ist konfiguriert mit:
- **LLM Provider**: DeepSeek (custom)
- **LLM Model**: `deepseek/deepseek-chat`
- **Embedding Provider**: OpenAI
- **Embedding Model**: `text-embedding-3-large`
- **Database**: SQLite (persistent)

## Troubleshooting

### Container kann imeso-ki-02 nicht erreichen
```bash
# Netzwerk-Verbindung testen
docker exec chatgpt-clone-frontend ping imeso-ki-02

# DNS-Auflösung testen
docker exec chatgpt-clone-frontend nslookup imeso-ki-02
```

### Services nicht erreichbar
1. Prüfe ob Ollama auf `imeso-ki-02:11434` läuft
2. Prüfe ob Cognee auf `imeso-ki-02:8000` läuft
3. Prüfe Firewall-Einstellungen

### Logs prüfen
```bash
# Frontend-Logs
docker-compose logs -f frontend

# Nginx-Logs
docker exec chatgpt-clone-frontend tail -f /var/log/nginx/access.log
```

## Build

### Production Build
```bash
docker-compose build frontend
```

### Development Build
```bash
docker-compose -f docker-compose.dev.yml build frontend-dev
```

## Volumes

- `cognee_data`: SQLite-Datenbank und Cognee-Daten (persistent)
- `frontend_logs`: Nginx-Logs für Debugging

## Ports

- **3000**: Frontend (Production)
- **5173**: Frontend (Development)
- **8000**: Cognee (lokaler Container)
