# Postman API Test für Dataset File Upload

## API Endpoint
- **URL**: `http://imeso-ki-02:8080/api/v1/add`
- **Method**: POST
- **Content-Type**: multipart/form-data

## Required Parameters
- `file`: Die hochzuladende Datei
- `datasetId`: ID des Datasets

## Optional Parameters
- `metadata`: JSON-String mit Metadaten
- `fileName`: Name der Datei
- `fileType`: MIME-Type der Datei
- `fileSize`: Größe der Datei

## Headers
- `Authorization`: Bearer {token}

## Test Steps
1. Öffnen Sie Postman
2. Erstellen Sie eine neue POST-Anfrage
3. Setzen Sie die URL: `http://imeso-ki-02:8080/api/v1/add`
4. Gehen Sie zum "Body" Tab
5. Wählen Sie "form-data"
6. Fügen Sie die Parameter hinzu:
   - Key: `file`, Type: File, Value: Wählen Sie eine Datei
   - Key: `datasetId`, Type: Text, Value: Ihre Dataset-ID
7. Fügen Sie den Authorization Header hinzu
8. Senden Sie die Anfrage

## Expected Response
```json
{
  "id": "string",
  "name": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "extension": "string",
  "mimeType": "string",
  "datasetId": "string"
}
```
