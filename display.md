📊 **Monitoring in Cognee überprüfen**

Cognee bietet verschiedene Möglichkeiten, um das Monitoring und die Observability deiner Wissensgraphen zu überprüfen. Hier sind die verfügbaren Optionen:

## 🔍 **Integrierte Observability-Tools**

### **Langfuse Integration**
Cognee verfügt über eine eingebaute Langfuse-Unterstützung für umfassende Observability:

```python
from cognee.modules.observability.get_observe import get_observe

observe = get_observe()

@observe(as_type="generation")
async def your_function(...):
    ...
```

**Setup:**
- Erstelle ein Projekt bei [Langfuse Cloud](https://cloud.langfuse.com)
- Exportiere diese Umgebungsvariablen:
```bash
LANGFUSE_PUBLIC_KEY=<dein_public_key>
LANGFUSE_SECRET_KEY=<dein_secret_key>
LANGFUSE_HOST=https://cloud.langfuse.com
```

### **Keywords AI Integration**
Alternative Observability-Lösung für LLM-gestützte Anwendungen:

```bash
pip install cognee-community-observability-keywordsai
export MONITORING_TOOL=keywordsai
export KEYWORDSAI_API_KEY=<dein_key>
```

## 📈 **Monitoring in verschiedenen Umgebungen**

### **Cogwit (Cloud)**
- **Modal Dashboard**: Überwache Container-Status und Logs in Echtzeit
- **Automatisches Scaling**: Modal skaliert automatisch basierend auf Workload
- **Log-Streaming**: `modal logs cognee-app`

### **Lokale Entwicklung**
- **Service-Status**: `sudo systemctl status cognee`
- **Logs einsehen**: `sudo journalctl -u cognee -f`
- **Port-Verfügbarkeit**: `sudo netstat -tlnp | grep :8000`

## 🛠 **Praktische Überprüfung**

### **Health Checks**
```python
# API Health Check
curl -H "X-Api-Key: YOUR-API-KEY" https://api.cognee.ai/api/health

# Detaillierter Health Check
curl -H "X-Api-Key: YOUR-API-KEY" https://api.cognee.ai/api/health/detailed
```

### **Pipeline-Status**
```python
# Verarbeite Status von Datasets
cognify_result = await cogwit_instance.cognify(dataset_ids=[dataset_id])
print(f"Cognify status: {cognify_result[str(dataset_id)].status}")
```

## ⚠️ **Wichtige Hinweise**

> **Telemetrie-Kontrolle**: Du kannst die Telemetrie mit `TELEMETRY_DISABLED=true` deaktivieren, wenn gewünscht.

> **Debug-Modus**: Für detaillierte Problembehebung kannst du den Debug-Modus in verschiedenen Tools aktivieren.

Die Monitoring-Lösungen sammeln automatisch Traces, Generierungen und Metriken, sodass du deine AI-Features in der Produktion debuggen, evaluieren und überwachen kannst.