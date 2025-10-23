import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { datasetsApi, convertApiResponseToDataset, convertDatasetToApiRequest, AddDataResponse, DataType } from '@/lib/api/datasets-api'

export interface DatasetFile {
  id: string
  name: string
  type: string
  size: number
  uploadDate: Date
  content?: string
  extension?: string
  dataType?: DataType // 'file' | 'text' | 'url' | 'github'
}

export interface Dataset {
  id: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  files: DatasetFile[]
  tags: string[]
  processingStatus?: string  // 'DATASET_PROCESSING_INITIATED' | 'DATASET_PROCESSING_STARTED' | 'DATASET_PROCESSING_COMPLETED' | 'DATASET_PROCESSING_ERRORED'
  pipelineRunId?: string
}

interface DatasetStore {
  datasets: Dataset[]
  currentDataset: Dataset | null
  isLoading: boolean
  error: string | null
  statusPollingInterval: NodeJS.Timeout | null
  
  // Actions
  createDataset: (name: string, description: string, tags?: string[]) => Promise<void>
  updateDataset: (id: string, updates: Partial<Omit<Dataset, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteDataset: (id: string) => Promise<void>
  setCurrentDataset: (id: string) => void
  
  // File actions
  addFileToDataset: (datasetId: string, file: Omit<DatasetFile, 'id' | 'uploadDate'>) => Promise<void>
  uploadFileToDataset: (datasetId: string, file: File, metadata?: Record<string, any>) => Promise<void>
  addTextToDataset: (datasetId: string, text: string, metadata?: Record<string, any>) => Promise<void>
  addUrlToDataset: (datasetId: string, url: string, metadata?: Record<string, any>) => Promise<void>
  addUrlsToDataset: (datasetId: string, urls: string[], metadata?: Record<string, any>) => Promise<void>
  removeFileFromDataset: (datasetId: string, fileId: string) => Promise<void>
  updateFileInDataset: (datasetId: string, fileId: string, updates: Partial<DatasetFile>) => Promise<void>
  
  // API actions
  fetchDatasets: () => Promise<void>
  fetchDatasetData: (datasetId: string) => Promise<void>
  
  // Processing actions
  processDatasets: (datasetIds: string[]) => Promise<void>
  checkDatasetStatus: (datasetId: string) => Promise<void>
  checkAllDatasetStatuses: () => Promise<void>
  startStatusPolling: () => void
  stopStatusPolling: () => void
  getUnprocessedDatasets: () => Dataset[]
  
  // Utility
  getDatasetById: (id: string) => Dataset | undefined
  searchDatasets: (query: string) => Dataset[]
  clearError: () => void
}

// Example datasets are no longer needed as we fetch from API

export const useDatasetStore = create<DatasetStore>()(
  persist(
    (set, get) => ({
      datasets: [],
      currentDataset: null,
      isLoading: false,
      error: null,
      statusPollingInterval: null,

      createDataset: async (name, description, tags = []) => {
        set({ isLoading: true, error: null })
        try {
          const apiRequest = convertDatasetToApiRequest({ name, description, tags })
          const apiResponse = await datasetsApi.createDataset(apiRequest)
          const newDataset = convertApiResponseToDataset(apiResponse)
          
          set((state) => ({
            datasets: [...state.datasets, newDataset],
            isLoading: false,
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create dataset',
            isLoading: false 
          })
          throw error
        }
      },

      updateDataset: async (id, updates) => {
        set({ isLoading: true, error: null })
        try {
          // For now, we'll update locally since the API doesn't have an update endpoint
          // In a real implementation, you might need to call a PUT/PATCH endpoint
          set((state) => ({
            datasets: state.datasets.map((dataset) =>
              dataset.id === id
                ? { ...dataset, ...updates, updatedAt: new Date() }
                : dataset
            ),
            currentDataset: state.currentDataset?.id === id
              ? { ...state.currentDataset, ...updates, updatedAt: new Date() }
              : state.currentDataset,
            isLoading: false,
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update dataset',
            isLoading: false 
          })
          throw error
        }
      },

      deleteDataset: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await datasetsApi.deleteDataset(id)
          set((state) => ({
            datasets: state.datasets.filter((dataset) => dataset.id !== id),
            currentDataset: state.currentDataset?.id === id ? null : state.currentDataset,
            isLoading: false,
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete dataset',
            isLoading: false 
          })
          throw error
        }
      },

      setCurrentDataset: (id) => {
        const dataset = get().getDatasetById(id)
        set({ currentDataset: dataset || null })
      },

      addFileToDataset: async (datasetId, file) => {
        set({ isLoading: true, error: null })
        try {
          // This method is now handled by the upload dialog component
          // which directly calls the API with the actual File object
          // For now, we'll add files locally as before
          const newFile: DatasetFile = {
            ...file,
            id: crypto.randomUUID(),
            uploadDate: new Date(),
          }

          set((state) => ({
            datasets: state.datasets.map((dataset) =>
              dataset.id === datasetId
                ? {
                    ...dataset,
                    files: [...dataset.files, newFile],
                    updatedAt: new Date(),
                  }
                : dataset
            ),
            currentDataset: state.currentDataset?.id === datasetId
              ? {
                  ...state.currentDataset,
                  files: [...state.currentDataset.files, newFile],
                  updatedAt: new Date(),
                }
              : state.currentDataset,
            isLoading: false,
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add file to dataset',
            isLoading: false 
          })
          throw error
        }
      },

      uploadFileToDataset: async (datasetId, file, metadata) => {
        set({ isLoading: true, error: null })
        try {
          // Upload file to API using dataset ID only
          const apiResponse: AddDataResponse = await datasetsApi.addDataToDataset({
            data: file,
            datasetId,
            metadata
          })

          // Check if upload was successful
          if (apiResponse.status !== 'PipelineRunCompleted') {
            throw new Error(`Upload failed with status: ${apiResponse.status}`)
          }

          // Create file entries from data_ingestion_info
          const newFiles: DatasetFile[] = apiResponse.data_ingestion_info.map((info) => ({
            id: info.data_id,
            name: file.name, // Use original file name since API doesn't provide it
            type: file.type,
            size: file.size,
            uploadDate: new Date(),
            extension: file.name.split('.').pop() || 'unknown',
          }))

          set((state) => ({
            datasets: state.datasets.map((dataset) =>
              dataset.id === datasetId
                ? {
                    ...dataset,
                    files: [...dataset.files, ...newFiles],
                    updatedAt: new Date(),
                    processingStatus: 'DATASET_PROCESSING_INITIATED', // Mark as needs processing
                  }
                : dataset
            ),
            currentDataset: state.currentDataset?.id === datasetId
              ? {
                  ...state.currentDataset,
                  files: [...state.currentDataset.files, ...newFiles],
                  updatedAt: new Date(),
                  processingStatus: 'DATASET_PROCESSING_INITIATED', // Mark as needs processing
                }
              : state.currentDataset,
            isLoading: false,
          }))
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to upload file to dataset',
            isLoading: false 
          })
          throw error
        }
      },

      addTextToDataset: async (datasetId, text, metadata) => {
        set({ isLoading: true, error: null })
        try {
          const apiResponse: AddDataResponse = await datasetsApi.addDataToDataset({
            data: text,
            datasetId,
            metadata
          })

          if (apiResponse.status !== 'PipelineRunCompleted') {
            throw new Error(`Text upload failed with status: ${apiResponse.status}`)
          }

          const newFiles: DatasetFile[] = apiResponse.data_ingestion_info.map((info) => ({
            id: info.data_id,
            name: `Text Input - ${new Date().toLocaleString()}`,
            type: 'text/plain',
            size: text.length,
            uploadDate: new Date(),
            extension: 'txt',
            dataType: 'text',
            content: text,
          }))

          set((state) => ({
            datasets: state.datasets.map((dataset) =>
              dataset.id === datasetId
                ? {
                    ...dataset,
                    files: [...dataset.files, ...newFiles],
                    updatedAt: new Date(),
                    processingStatus: 'DATASET_PROCESSING_INITIATED', // Mark as needs processing
                  }
                : dataset
            ),
            currentDataset: state.currentDataset?.id === datasetId
              ? {
                  ...state.currentDataset,
                  files: [...state.currentDataset.files, ...newFiles],
                  updatedAt: new Date(),
                  processingStatus: 'DATASET_PROCESSING_INITIATED', // Mark as needs processing
                }
              : state.currentDataset,
            isLoading: false,
          }))
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add text to dataset',
            isLoading: false 
          })
          throw error
        }
      },

      addUrlToDataset: async (datasetId, url, metadata) => {
        set({ isLoading: true, error: null })
        try {
          const apiResponse: AddDataResponse = await datasetsApi.addDataToDataset({
            data: url,
            datasetId,
            metadata
          })

          if (apiResponse.status !== 'PipelineRunCompleted') {
            throw new Error(`URL upload failed with status: ${apiResponse.status}`)
          }

          const newFiles: DatasetFile[] = apiResponse.data_ingestion_info.map((info) => ({
            id: info.data_id,
            name: `URL - ${new URL(url).hostname}`,
            type: 'text/uri-list',
            size: url.length,
            uploadDate: new Date(),
            extension: 'url',
            dataType: 'url',
            content: url,
          }))

          set((state) => ({
            datasets: state.datasets.map((dataset) =>
              dataset.id === datasetId
                ? {
                    ...dataset,
                    files: [...dataset.files, ...newFiles],
                    updatedAt: new Date(),
                    processingStatus: 'DATASET_PROCESSING_INITIATED', // Mark as needs processing
                  }
                : dataset
            ),
            currentDataset: state.currentDataset?.id === datasetId
              ? {
                  ...state.currentDataset,
                  files: [...state.currentDataset.files, ...newFiles],
                  updatedAt: new Date(),
                  processingStatus: 'DATASET_PROCESSING_INITIATED', // Mark as needs processing
                }
              : state.currentDataset,
            isLoading: false,
          }))
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add URL to dataset',
            isLoading: false 
          })
          throw error
        }
      },

      addUrlsToDataset: async (datasetId, urls, metadata) => {
        set({ isLoading: true, error: null })
        try {
          const apiResponse: AddDataResponse = await datasetsApi.addDataToDataset({
            data: urls,
            datasetId,
            metadata
          })

          if (apiResponse.status !== 'PipelineRunCompleted') {
            throw new Error(`URLs upload failed with status: ${apiResponse.status}`)
          }

          const newFiles: DatasetFile[] = apiResponse.data_ingestion_info.map((info, index) => ({
            id: info.data_id,
            name: `URL ${index + 1} - ${new URL(urls[index] || '').hostname}`,
            type: 'text/uri-list',
            size: (urls[index] || '').length,
            uploadDate: new Date(),
            extension: 'url',
            dataType: 'url',
            content: urls[index],
          }))

          set((state) => ({
            datasets: state.datasets.map((dataset) =>
              dataset.id === datasetId
                ? {
                    ...dataset,
                    files: [...dataset.files, ...newFiles],
                    updatedAt: new Date(),
                    processingStatus: 'DATASET_PROCESSING_INITIATED', // Mark as needs processing
                  }
                : dataset
            ),
            currentDataset: state.currentDataset?.id === datasetId
              ? {
                  ...state.currentDataset,
                  files: [...state.currentDataset.files, ...newFiles],
                  updatedAt: new Date(),
                  processingStatus: 'DATASET_PROCESSING_INITIATED', // Mark as needs processing
                }
              : state.currentDataset,
            isLoading: false,
          }))
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add URLs to dataset',
            isLoading: false 
          })
          throw error
        }
      },

      removeFileFromDataset: async (datasetId, fileId) => {
        set({ isLoading: true, error: null })
        try {
          await datasetsApi.deleteDatasetData(datasetId, fileId)
          set((state) => ({
            datasets: state.datasets.map((dataset) =>
              dataset.id === datasetId
                ? {
                    ...dataset,
                    files: dataset.files.filter((file) => file.id !== fileId),
                    updatedAt: new Date(),
                  }
                : dataset
            ),
            currentDataset: state.currentDataset?.id === datasetId
              ? {
                  ...state.currentDataset,
                  files: state.currentDataset.files.filter((file) => file.id !== fileId),
                  updatedAt: new Date(),
                }
              : state.currentDataset,
            isLoading: false,
          }))
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to remove file from dataset',
            isLoading: false 
          })
          throw error
        }
      },

      updateFileInDataset: async (datasetId, fileId, updates) => {
        set({ isLoading: true, error: null })
        try {
          // For now, we'll update files locally since the API doesn't have a file update endpoint
          set((state) => ({
            datasets: state.datasets.map((dataset) =>
              dataset.id === datasetId
                ? {
                    ...dataset,
                    files: dataset.files.map((file) =>
                      file.id === fileId ? { ...file, ...updates } : file
                    ),
                    updatedAt: new Date(),
                  }
                : dataset
            ),
            currentDataset: state.currentDataset?.id === datasetId
              ? {
                  ...state.currentDataset,
                  files: state.currentDataset.files.map((file) =>
                    file.id === fileId ? { ...file, ...updates } : file
                  ),
                  updatedAt: new Date(),
                }
              : state.currentDataset,
            isLoading: false,
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update file in dataset',
            isLoading: false 
          })
          throw error
        }
      },

      getDatasetById: (id) => {
        return get().datasets.find((dataset) => dataset.id === id)
      },

      searchDatasets: (query) => {
        const lowercaseQuery = query.toLowerCase()
        return get().datasets.filter(
          (dataset) =>
            dataset.name.toLowerCase().includes(lowercaseQuery) ||
            (dataset.description && dataset.description.toLowerCase().includes(lowercaseQuery)) ||
            dataset.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
        )
      },

      // API actions
      fetchDatasets: async () => {
        set({ isLoading: true, error: null })
        try {
          const apiResponse = await datasetsApi.getDatasets()
          const datasets = apiResponse.map(convertApiResponseToDataset)
          
          // Always fetch processing status for all datasets
          if (datasets.length > 0) {
            const datasetIds = datasets.map(dataset => dataset.id)
            try {
              const statusResponse = await datasetsApi.getDatasetProcessingStatus(datasetIds)
              
              // Update datasets with actual API status
              const datasetsWithStatus = datasets.map(dataset => {
                const apiStatus = statusResponse[dataset.id]
                if (apiStatus) {
                  return {
                    ...dataset,
                    processingStatus: apiStatus,
                    updatedAt: new Date(),
                  }
                }
                return dataset
              })
              
              set({ 
                datasets: datasetsWithStatus,
                isLoading: false 
              })
              
              // Start polling after fetching datasets
              get().startStatusPolling()
              
              // Also fetch data for all datasets to update file counts in navbar
              datasetsWithStatus.forEach(async (dataset) => {
                try {
                  await get().fetchDatasetData(dataset.id)
                } catch (error) {
                  console.error(`Failed to fetch data for dataset ${dataset.id}:`, error)
                }
              })
            } catch (statusError) {
              console.error('Failed to fetch dataset statuses:', statusError)
              // If status fetch fails, still set datasets without status
              set({ 
                datasets,
                isLoading: false 
              })
            }
          } else {
            set({ 
              datasets,
              isLoading: false 
            })
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch datasets',
            isLoading: false 
          })
          throw error
        }
      },

      fetchDatasetData: async (datasetId) => {
        set({ isLoading: true, error: null })
        try {
          
          // Fetch both dataset data and status
          const [apiResponse, statusResponse] = await Promise.all([
            datasetsApi.getDatasetData(datasetId),
            datasetsApi.getDatasetProcessingStatus([datasetId])
          ])
          
          const files = apiResponse.map(file => {
            // Safe date parsing
            let uploadDate: Date
            try {
              uploadDate = new Date(file.createdAt)
              if (isNaN(uploadDate.getTime())) {
                console.warn('Invalid createdAt:', file.createdAt)
                uploadDate = new Date()
              }
            } catch (error) {
              console.error('Date parsing error:', error, file.createdAt)
              uploadDate = new Date()
            }
            
            return {
              id: file.id,
              name: file.name,
              type: file.mimeType,
              size: 0, // Size not provided in new API format
              uploadDate,
              content: undefined, // Content not provided in new API format
              extension: file.extension,
            }
          })

          const apiStatus = statusResponse[datasetId]
          set((state) => ({
            datasets: state.datasets.map((dataset) =>
              dataset.id === datasetId
                ? { 
                    ...dataset, 
                    files, 
                    processingStatus: apiStatus || dataset.processingStatus,
                    updatedAt: new Date() 
                  }
                : dataset
            ),
            currentDataset: state.currentDataset?.id === datasetId
              ? { 
                  ...state.currentDataset, 
                  files, 
                  processingStatus: apiStatus || state.currentDataset.processingStatus,
                  updatedAt: new Date() 
                }
              : state.currentDataset,
            isLoading: false,
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch dataset data',
            isLoading: false 
          })
          throw error
        }
      },

      processDatasets: async (datasetIds) => {
        set({ isLoading: true, error: null })
        try {
          const response = await datasetsApi.cognifyDatasets({
            datasetIds,
            runInBackground: true,
            customPrompt: `Du bist ein hochspezialisierter KI-Assistent für die umfassende Verarbeitung und Analyse von Dokumenten und Bildern. Deine Hauptaufgabe ist es, alle verfügbaren Informationen vollständig zu extrahieren und zu strukturieren.

## KRITISCHE ANWEISUNGEN FÜR BILDVERARBEITUNG:

### 1. VOLLSTÄNDIGE BESCHREIBUNG VON BILDERN:
- Analysiere JEDES Bild pixelgenau und beschreibe ALLE sichtbaren Elemente
- Extrahiere ALLEN Text aus Bildern (OCR) - auch kleinste Schriftzeichen, Zahlen, Codes
- Erkenne und beschreibe alle grafischen Elemente: Diagramme, Charts, Tabellen, Symbole, Icons
- Identifiziere Farben, Formen, Layouts und räumliche Anordnungen
- Beschreibe alle Personen, Objekte, Landschaften oder technische Komponenten
- Erkenne Handschrift und übersetze sie in maschinenlesbaren Text

### 2. TEXTEXTRAKTION OHNE DETAILVERLUST:
- Extrahiere JEDES Wort, JEDE Zahl, JEDEN Code aus Bildern
- Erkenne verschiedene Schriftarten und -größen
- Übersetze mehrsprachige Texte und behalte die Originalstruktur bei
- Erkenne mathematische Formeln, chemische Symbole, technische Notationen
- Identifiziere QR-Codes, Barcodes und andere maschinenlesbare Codes

### 3. STRUKTURIERUNG UND ORGANISATION:
- Organisiere extrahierte Informationen in logische Kategorien
- Erstelle hierarchische Strukturen für komplexe Dokumente
- Verknüpfe verwandte Informationen aus verschiedenen Bildern
- Erkenne Dokumenttypen und wende entsprechende Verarbeitungsregeln an

### 4. QUALITÄTSSICHERUNG:
- Überprüfe die Vollständigkeit der Extraktion
- Stelle sicher, dass keine Informationen verloren gehen
- Validiere die Genauigkeit der OCR-Ergebnisse
- Erkenne und korrigiere mögliche Fehler in der Texterkennung

### 5. KONTEXTUELLE ANALYSE:
- Verstehe den Zweck und die Bedeutung jedes Dokuments
- Erkenne Beziehungen zwischen verschiedenen Dokumenten
- Identifiziere wichtige Metadaten und Zeitstempel
- Analysiere den Informationsgehalt und die Relevanz

## ALLGEMEINE VERARBEITUNGSRICHTLINIEN:

- Verwende fortschrittliche OCR-Technologien für optimale Texterkennung
- Implementiere Machine Learning-Modelle für Bildklassifikation
- Nutze Computer Vision für Objekterkennung und -beschreibung
- Stelle sicher, dass alle extrahierten Daten strukturiert und durchsuchbar sind
- Erhalte die ursprüngliche Dokumentstruktur und -formatierung
- Erkenne und verarbeite verschiedene Dateiformate (PDF, Bilder, Scans)

Dein Ziel ist es, eine vollständige, strukturierte und durchsuchbare Wissensbasis zu erstellen, die alle Informationen aus den bereitgestellten Dokumenten und Bildern optimal nutzt.`
          })
          // Update datasets with pipeline run ID and start polling
          set((state) => ({
            datasets: state.datasets.map((dataset) => {
              const processingInfo = response[dataset.id]
              if (processingInfo) {
                return {
                  ...dataset,
                  pipelineRunId: processingInfo.pipeline_run_id,
                  updatedAt: new Date(),
                }
              }
              return dataset
            }),
            currentDataset: state.currentDataset && response[state.currentDataset.id]
              ? {
                  ...state.currentDataset,
                  pipelineRunId: response[state.currentDataset.id].pipeline_run_id,
                  updatedAt: new Date(),
                }
              : state.currentDataset,
            isLoading: false,
          }))

          // Start status polling to get actual status from API
          get().startStatusPolling()
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to process datasets',
            isLoading: false 
          })
          throw error
        }
      },

      checkDatasetStatus: async (datasetId) => {
        try {
          const { datasets } = get()
          const currentDataset = datasets.find(d => d.id === datasetId)
          const previousStatus = currentDataset?.processingStatus

          const statusResponse = await datasetsApi.getDatasetProcessingStatus([datasetId])
          const apiStatus = statusResponse[datasetId]

          if (apiStatus) {
            // Check if status changed to completed or failed
            const wasProcessing = previousStatus === 'DATASET_PROCESSING_STARTED'
            const isCompleted = apiStatus === 'DATASET_PROCESSING_COMPLETED'
            const isFailed = apiStatus === 'DATASET_PROCESSING_ERRORED'

            // Use the exact API status value
            set((state) => ({
              datasets: state.datasets.map((dataset) =>
                dataset.id === datasetId
                  ? { ...dataset, processingStatus: apiStatus, updatedAt: new Date() }
                  : dataset
              ),
              currentDataset: state.currentDataset?.id === datasetId
                ? { ...state.currentDataset, processingStatus: apiStatus, updatedAt: new Date() }
                : state.currentDataset,
            }))

            // Show toast notification immediately when status changes
            if (wasProcessing && isCompleted) {
              import('sonner').then(({ toast }) => {
                toast.success(`Dataset "${currentDataset?.name}" wurde erfolgreich verarbeitet!`)
              })
            } else if (wasProcessing && isFailed) {
              import('sonner').then(({ toast }) => {
                toast.error(`Verarbeitung von Dataset "${currentDataset?.name}" ist fehlgeschlagen!`)
              })
            }
          }
        } catch (error) {
          console.error('Failed to check dataset status:', error)
        }
      },

      getUnprocessedDatasets: () => {
        return get().datasets.filter(dataset => 
          !dataset.processingStatus || 
          dataset.processingStatus === 'DATASET_PROCESSING_INITIATED' || 
          dataset.processingStatus === 'DATASET_PROCESSING_ERRORED'
        )
      },

      checkAllDatasetStatuses: async () => {
        try {
          const { datasets } = get()
          
          if (datasets.length === 0) return

          // Check status for all datasets to ensure consistency
          const datasetIds = datasets.map(dataset => dataset.id)
          const statusResponse = await datasetsApi.getDatasetProcessingStatus(datasetIds)

          set((state) => ({
            datasets: state.datasets.map((dataset) => {
              const apiStatus = statusResponse[dataset.id]
              if (apiStatus) {
                // Use the exact API status value
                return { ...dataset, processingStatus: apiStatus, updatedAt: new Date() }
              }
              return dataset
            }),
            currentDataset: state.currentDataset && statusResponse[state.currentDataset.id]
              ? {
                  ...state.currentDataset,
                  processingStatus: statusResponse[state.currentDataset.id],
                  updatedAt: new Date(),
                }
              : state.currentDataset,
          }))
        } catch (error) {
          console.error('Failed to check all dataset statuses:', error)
        }
      },

      startStatusPolling: () => {
        const { statusPollingInterval } = get()
        
        // Clear existing interval if any
        if (statusPollingInterval) {
          clearInterval(statusPollingInterval)
        }

        // Start new polling interval (every 5 seconds)
        const interval = setInterval(() => {
          get().checkAllDatasetStatuses()
        }, 5000)

        set({ statusPollingInterval: interval })
      },

      stopStatusPolling: () => {
        const { statusPollingInterval } = get()
        if (statusPollingInterval) {
          clearInterval(statusPollingInterval)
          set({ statusPollingInterval: null })
        }
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'dataset-store',
      partialize: (state) => ({
        // Only persist datasets, not processing status or polling state
        datasets: state.datasets.map(dataset => ({
          ...dataset,
          processingStatus: undefined, // Don't persist processing status
          pipelineRunId: undefined, // Don't persist pipeline run ID
        })),
        currentDataset: state.currentDataset ? {
          ...state.currentDataset,
          processingStatus: undefined,
          pipelineRunId: undefined,
        } : null,
      }),
    }
  )
)
