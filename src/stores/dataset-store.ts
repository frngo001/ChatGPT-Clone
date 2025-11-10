import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { datasetsApi, convertApiResponseToDataset, convertDatasetToApiRequest, convertDatasetToUpdateRequest, AddDataResponse, DataType } from '@/lib/api/datasets-api'
import { cogneeApi } from '@/lib/api/cognee-api-client'
import type { DatasetPermission } from '@/types/permissions'
import { retry, CRITICAL_API_RETRY_CONFIG, FILE_UPLOAD_RETRY_CONFIG } from '@/lib/utils/retry'
import { getFileExtension, getMimeTypeFromExtension } from '@/lib/utils/file-utils'
import { v4 as uuidv4 } from 'uuid'

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
  
  // Neu: Permissions
  ownerId?: string
  isShared?: boolean  // Shared with tenant
  permissions?: {
    read: boolean
    write: boolean
    delete: boolean
    share: boolean
  }
}

interface DatasetStore {
  datasets: Dataset[]
  currentDataset: Dataset | null
  isLoading: boolean
  error: string | null
  statusPollingInterval: NodeJS.Timeout | null
  currentPollInterval: number // Für Exponential Backoff
  pendingFetchDatasets: Promise<void> | null // Request-Deduplizierung
  
  // Cache fields
  documentsCacheTimestamp: Record<string, number>
  isFetchingInBackground: Record<string, boolean>
  
  // Filter fields
  filterState: {
    searchQuery: string
    selectedTags: string[]
    statusFilter: string | null
    ownerFilter: string | null
    createdFrom: string | null
    createdTo: string | null
    updatedFrom: string | null
    updatedTo: string | null
  }
  
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
  addBulkDataToDataset: (datasetId: string, data?: File[], urls?: string[], texts?: string[], nodeSet?: string[]) => Promise<{ successful: number; failed: number }>
  removeFileFromDataset: (datasetId: string, fileId: string) => Promise<void>
  updateFileInDataset: (datasetId: string, fileId: string, updates: Partial<DatasetFile>) => Promise<void>
  downloadDatasetFile: (datasetId: string, fileId: string, fileName: string) => Promise<void>
  
  // API actions
  fetchDatasets: () => Promise<void>
  fetchDatasetData: (datasetId: string) => Promise<void>
  fetchDatasetDataWithCache: (datasetId: string) => Promise<void>
  
  // Cache actions
  invalidateDatasetCache: (datasetId: string) => void
  
  // Processing actions
  processDatasets: (datasetIds: string[]) => Promise<void>
  checkDatasetStatus: (datasetId: string) => Promise<void>
  checkAllDatasetStatuses: () => Promise<boolean> // Gibt zurück ob sich Status geändert hat
  setDatasetProcessingStatus: (datasetId: string, status: string) => void // Setzt Status sofort ohne API-Call
  startStatusPolling: () => void
  stopStatusPolling: () => void
  getUnprocessedDatasets: () => Dataset[]
  
  // Utility
  getDatasetById: (id: string) => Dataset | undefined
  searchDatasets: (query: string) => Dataset[]
  clearError: () => void
  
  // Permissions actions
  shareDatasetWithTenant: (datasetId: string, tenantId: string) => Promise<void>
  shareDatasetWithUser: (datasetId: string, userId: string) => Promise<void>
  fetchDatasetPermissions: (datasetId: string) => Promise<string[]>
  revokeDatasetPermission: (datasetId: string, userId: string) => Promise<void>
  
  // Filter actions
  setFilterState: (filters: Partial<DatasetStore['filterState']>) => void
  clearFilterState: () => void
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
      currentPollInterval: 5000, // Start mit 5s für Exponential Backoff
      pendingFetchDatasets: null as Promise<void> | null,
      
      // Cache initialization
      documentsCacheTimestamp: {},
      isFetchingInBackground: {},
      
      // Filter state initialization
      filterState: {
        searchQuery: '',
        selectedTags: [],
        statusFilter: null,
        ownerFilter: null,
        createdFrom: null,
        createdTo: null,
        updatedFrom: null,
        updatedTo: null,
      },

      createDataset: async (name, description, tags = []) => {
        set({ isLoading: true, error: null })
        
        // Optimistic Update: Füge Dataset sofort hinzu mit temporärer ID
        const tempId = uuidv4()
        // Optimistic Dataset erstellt direkt (nicht über API-Format)
        const optimisticDataset: Dataset = {
          id: tempId,
          name,
          description,
          tags: tags || [],
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: undefined, // Wird vom Backend gesetzt
          processingStatus: undefined,
          files: [],
        }
        
        set((state) => ({
          datasets: [...state.datasets, optimisticDataset],
        }))
        
        try {
          const apiRequest = convertDatasetToApiRequest({ name, description, tags })
          // ✅ Added: Retry-Logik für kritische Dataset-Erstellung
          const apiResponse = await retry(
            () => datasetsApi.createDataset(apiRequest),
            CRITICAL_API_RETRY_CONFIG
          )
          const newDataset = convertApiResponseToDataset(apiResponse)
          
          // Ersetze optimistic Dataset mit echten Daten
          set((state) => ({
            datasets: state.datasets.map(d => d.id === tempId ? newDataset : d),
            isLoading: false,
          }))
        } catch (error) {
          // Rollback: Entferne optimistic Dataset bei Fehler
          set((state) => ({
            datasets: state.datasets.filter(d => d.id !== tempId),
            error: error instanceof Error ? error.message : 'Failed to create dataset',
            isLoading: false 
          }))
          throw error
        }
      },

      updateDataset: async (id, updates) => {
        set({ isLoading: true, error: null })
        try {
          const apiRequest = convertDatasetToUpdateRequest(updates)
          // ✅ Added: Retry-Logik für Dataset-Updates
          const apiResponse = await retry(
            () => datasetsApi.updateDataset(id, apiRequest),
            CRITICAL_API_RETRY_CONFIG
          )
          const updatedDataset = convertApiResponseToDataset(apiResponse)
          
          set((state) => ({
            datasets: state.datasets.map((dataset) =>
              dataset.id === id ? updatedDataset : dataset
            ),
            currentDataset: state.currentDataset?.id === id ? updatedDataset : state.currentDataset,
            isLoading: false,
          }))
          
          // ✅ Improved: Invalidate cache after dataset update
          get().invalidateDatasetCache(id)
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
          // ✅ Added: Retry-Logik für Dataset-Löschung
          await retry(
            () => datasetsApi.deleteDataset(id),
            CRITICAL_API_RETRY_CONFIG
          )
          set((state) => ({
            datasets: state.datasets.filter((dataset) => dataset.id !== id),
            currentDataset: state.currentDataset?.id === id ? null : state.currentDataset,
            isLoading: false,
          }))
          
          // ✅ Improved: Invalidate cache after dataset deletion
          get().invalidateDatasetCache(id)
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
            id: uuidv4(),
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
        
        // Optimistic Update: Füge Datei sofort hinzu mit temporärer ID
        const tempFileId = uuidv4()
        const optimisticFile: DatasetFile = {
          id: tempFileId,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadDate: new Date(),
          extension: file.name.split('.').pop() || 'unknown',
        }
        
        set((state) => ({
          datasets: state.datasets.map((dataset) =>
            dataset.id === datasetId
              ? {
                  ...dataset,
                  files: [...dataset.files, optimisticFile],
                  updatedAt: new Date(),
                }
              : dataset
          ),
          currentDataset: state.currentDataset?.id === datasetId
            ? {
                ...state.currentDataset,
                files: [...state.currentDataset.files, optimisticFile],
                updatedAt: new Date(),
              }
            : state.currentDataset,
        }))
        
        try {
          // Upload file to API using dataset ID only
          // ✅ Added: Retry-Logik für File-Uploads (längere Retries wegen großer Dateien)
          const apiResponse: AddDataResponse = await retry(
            () => datasetsApi.addDataToDataset({
              data: file,
              datasetId,
              metadata
            }),
            FILE_UPLOAD_RETRY_CONFIG
          )

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

          // Ersetze optimistic File mit echten Daten
          set((state) => ({
            datasets: state.datasets.map((dataset) =>
              dataset.id === datasetId
                ? {
                    ...dataset,
                    files: [...dataset.files.filter(f => f.id !== tempFileId), ...newFiles],
                    updatedAt: new Date(),
                    processingStatus: 'DATASET_PROCESSING_INITIATED', // Mark as needs processing
                  }
                : dataset
            ),
            currentDataset: state.currentDataset?.id === datasetId
              ? {
                  ...state.currentDataset,
                  files: [...state.currentDataset.files.filter(f => f.id !== tempFileId), ...newFiles],
                  updatedAt: new Date(),
                  processingStatus: 'DATASET_PROCESSING_INITIATED',
                }
              : state.currentDataset,
            isLoading: false,
          }))
          
          // Invalidate cache after successful upload
          get().invalidateDatasetCache(datasetId)
        } catch (error) {
          // Rollback: Entferne optimistic File bei Fehler
          set((state) => ({
            datasets: state.datasets.map((dataset) =>
              dataset.id === datasetId
                ? {
                    ...dataset,
                    files: dataset.files.filter(f => f.id !== tempFileId),
                  }
                : dataset
            ),
            currentDataset: state.currentDataset?.id === datasetId
              ? {
                  ...state.currentDataset,
                  files: state.currentDataset.files.filter(f => f.id !== tempFileId),
                }
              : state.currentDataset,
            error: error instanceof Error ? error.message : 'Failed to upload file',
            isLoading: false 
          }))
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
          
          // Invalidate cache after successful upload
          get().invalidateDatasetCache(datasetId)
          
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
            type: 'url',
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
          
          // Invalidate cache after successful upload
          get().invalidateDatasetCache(datasetId)
          
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
            type: 'url',
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
          
          // Invalidate cache after successful upload
          get().invalidateDatasetCache(datasetId)
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add URLs to dataset',
            isLoading: false 
          })
          throw error
        }
      },

      addBulkDataToDataset: async (datasetId, data, urls, texts, nodeSet) => {
        set({ isLoading: true, error: null })
        
        const totalItems = (data?.length || 0) + (urls?.length || 0) + (texts?.length || 0)
        if (totalItems === 0) {
          set({ isLoading: false, error: 'Keine Daten zum Hochladen' })
          return { successful: 0, failed: 0 }
        }

        try {
          const apiResponse: AddDataResponse = await datasetsApi.addBulkDataToDataset({
            data: data,
            urls: urls,
            text_data: texts,
            datasetId,
            node_set: nodeSet,
          })

          if (apiResponse.status !== 'PipelineRunCompleted') {
            set({ isLoading: false, error: `Upload fehlgeschlagen mit Status: ${apiResponse.status}` })
            return { successful: 0, failed: totalItems }
          }

          // Create file entries from data_ingestion_info
          const newFiles: DatasetFile[] = apiResponse.data_ingestion_info.map((info, index) => {
            // Try to match with original files/urls/texts
            let name = `Item ${index + 1}`
            let type = 'unknown'
            let size = 0
            let extension = ''
            let dataType: DataType = 'file'

            // Determine which type based on the order
            if (data && index < data.length) {
              name = data[index].name
              type = data[index].type
              size = data[index].size
              extension = data[index].name.split('.').pop() || 'unknown'
              dataType = 'file'
            } else if (urls && index < (data?.length || 0) + urls.length) {
              const urlIndex = index - (data?.length || 0)
              const url = urls[urlIndex] || ''
              name = `URL - ${new URL(url).hostname}`
              type = 'url'
              size = url.length
              extension = 'url'
              dataType = 'url'
            } else if (texts) {
              const textIndex = index - (data?.length || 0) - (urls?.length || 0)
              name = `Text Input - ${new Date().toLocaleString()}`
              type = 'text/plain'
              size = texts[textIndex]?.length || 0
              extension = 'txt'
              dataType = 'text'
            }

            return {
              id: info.data_id,
              name,
              type,
              size,
              uploadDate: new Date(),
              extension,
              dataType,
              // Store the full URL in content for navigation
              content: urls && index >= (data?.length || 0) && index < (data?.length || 0) + urls.length 
                ? urls[index - (data?.length || 0)] 
                : undefined,
            }
          })

          set((state) => ({
            datasets: state.datasets.map((dataset) =>
              dataset.id === datasetId
                ? {
                    ...dataset,
                    files: [...dataset.files, ...newFiles],
                    updatedAt: new Date(),
                    processingStatus: 'DATASET_PROCESSING_INITIATED',
                  }
                : dataset
            ),
            currentDataset: state.currentDataset?.id === datasetId
              ? {
                  ...state.currentDataset,
                  files: [...state.currentDataset.files, ...newFiles],
                  updatedAt: new Date(),
                  processingStatus: 'DATASET_PROCESSING_INITIATED',
                }
              : state.currentDataset,
            isLoading: false,
          }))
          
          // Invalidate cache after successful upload
          get().invalidateDatasetCache(datasetId)
          
          return { successful: totalItems, failed: 0 }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add bulk data to dataset',
            isLoading: false 
          })
          // Return information about failure
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          throw new Error(`Bulk upload failed: ${errorMessage}`)
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
          
          // Invalidate cache after successful delete
          get().invalidateDatasetCache(datasetId)
          
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
          
          // ✅ Improved: Invalidate cache after file update
          get().invalidateDatasetCache(datasetId)
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update file in dataset',
            isLoading: false 
          })
          throw error
        }
      },

      downloadDatasetFile: async (datasetId, fileId, fileName) => {
        try {
          // Fetch the raw data as Blob
          const blob = await datasetsApi.getRawData(datasetId, fileId)
          
          // Create a temporary URL for the blob
          const url = URL.createObjectURL(blob)
          
          // Create a temporary anchor element to trigger download
          const link = document.createElement('a')
          link.href = url
          link.download = fileName
          document.body.appendChild(link)
          link.click()
          
          // Cleanup
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        } catch (error) {
          // Handle specific error cases
          if (error instanceof Error) {
            if (error.message.includes('404')) {
              throw new Error('Datei nicht gefunden')
            } else if (error.message.includes('403')) {
              throw new Error('Keine Berechtigung zum Herunterladen')
            } else if (error.message.includes('500')) {
              throw new Error('Serverfehler beim Herunterladen')
            } else if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
              throw new Error('Verbindungsfehler beim Herunterladen')
            }
          }
          
          // Generic error
          throw new Error('Fehler beim Herunterladen der Datei')
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
        const state = get()
        
        // Request-Deduplizierung: Wenn bereits ein Fetch läuft, warte darauf
        if (state.pendingFetchDatasets) {
          return state.pendingFetchDatasets
        }
        
        // Prüfe ob Datasets vollständig geladen sind (haben processingStatus)
        // Nach einem Reload können Datasets aus dem persistierten Zustand kommen,
        // aber ohne processingStatus (wird nicht persistiert)
        const hasDatasetsWithoutStatus = state.datasets.length > 0 && 
          state.datasets.some(d => !d.processingStatus)
        
        // Wenn Datasets bereits vorhanden, vollständig geladen (haben Status) und nicht im Loading-State, skip Fetch
        if (state.datasets.length > 0 && !hasDatasetsWithoutStatus && !state.isLoading) {
          return Promise.resolve()
        }
        
        // Setze isLoading und erstelle Promise für Deduplizierung
        set({ isLoading: true, error: null })
        
        const fetchPromise = (async () => {
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
              
              // Merge new datasets with existing cached data to preserve file details
              set((state) => {
                const mergedDatasets = datasetsWithStatus.map(newDataset => {
                  const existingDataset = state.datasets.find(d => d.id === newDataset.id)
                  if (existingDataset && existingDataset.files.length > 0) {
                    // Keep cached file details if they exist
                    return {
                      ...newDataset,
                      files: existingDataset.files,
                      updatedAt: existingDataset.updatedAt
                    }
                  }
                  return newDataset
                })
                
                return {
                  datasets: mergedDatasets,
                  isLoading: false
                }
              })
              
              // Start polling after fetching datasets
              get().startStatusPolling()
              
              // Note: Dataset details are now loaded lazily when needed
            } catch (statusError) {
              console.error('Failed to fetch dataset statuses:', statusError)
              // If status fetch fails, merge datasets with existing cached data
              set((state) => {
                const mergedDatasets = datasets.map(newDataset => {
                  const existingDataset = state.datasets.find(d => d.id === newDataset.id)
                  if (existingDataset && existingDataset.files.length > 0) {
                    // Keep cached file details if they exist
                    return {
                      ...newDataset,
                      files: existingDataset.files,
                      updatedAt: existingDataset.updatedAt
                    }
                  }
                  return newDataset
                })
                
                return {
                  datasets: mergedDatasets,
                  isLoading: false
                }
              })
            }
          } else {
            // No datasets, but preserve existing cached data if any
            set((state) => ({
              datasets: state.datasets.length > 0 ? state.datasets : [],
              isLoading: false
            }))
          }
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch datasets',
              isLoading: false,
              pendingFetchDatasets: null // Clear pending promise on error
            })
            throw error
          } finally {
            // Clear pending promise after completion
            set({ pendingFetchDatasets: null })
          }
        })()
        
        // Speichere Promise für Deduplizierung
        set({ pendingFetchDatasets: fetchPromise })
        
        return fetchPromise
      },

      fetchDatasetData: async (datasetId) => {
        set({ isLoading: true, error: null })
        try {
          
          // Fetch both dataset data and status
          // ✅ Added: Retry-Logik für kritische Daten-Abfragen
          const [apiResponse, statusResponse] = await retry(
            () => Promise.all([
              datasetsApi.getDatasetData(datasetId),
              datasetsApi.getDatasetProcessingStatus([datasetId])
            ]),
            CRITICAL_API_RETRY_CONFIG
          )
          
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
            
            // Extract extension and MIME type from filename instead of using API values
            // Pass filename as second parameter to enable URL detection
            const extension = getFileExtension(file.name)
            const mimeType = getMimeTypeFromExtension(extension, file.name)
            
            return {
              id: file.id,
              name: file.name,
              type: mimeType,
              size: 0, // Size not provided in new API format
              uploadDate,
              content: undefined, // Content not provided in new API format
              extension: extension.startsWith('.') ? extension.substring(1) : extension,
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

      fetchDatasetDataWithCache: async (datasetId) => {
        const dataset = get().getDatasetById(datasetId)
        const hasCachedData = dataset && dataset.files.length > 0
        
        if (hasCachedData) {
          // Cache vorhanden: Sofort zurückgeben + Background-Refresh starten
          set((state) => ({
            isFetchingInBackground: { ...state.isFetchingInBackground, [datasetId]: true }
          }))
          
          // Im Hintergrund aktualisieren
          get().fetchDatasetData(datasetId).finally(() => {
            set((state) => ({
              isFetchingInBackground: { ...state.isFetchingInBackground, [datasetId]: false },
              documentsCacheTimestamp: { ...state.documentsCacheTimestamp, [datasetId]: Date.now() }
            }))
          })
        } else {
          // Kein Cache: Normal laden mit Loading-State
          await get().fetchDatasetData(datasetId)
          set((state) => ({
            documentsCacheTimestamp: { ...state.documentsCacheTimestamp, [datasetId]: Date.now() }
          }))
        }
      },

      invalidateDatasetCache: (datasetId) => {
        set((state) => {
          const newTimestamps = { ...state.documentsCacheTimestamp }
          delete newTimestamps[datasetId]
          return { documentsCacheTimestamp: newTimestamps }
        })
      },

      processDatasets: async (datasetIds) => {
        set({ isLoading: true, error: null })
        try {
          const response = await datasetsApi.cognifyDatasets({
            datasetIds,
            runInBackground: true,
            customPrompt: `Du bist ein hochspezialisierter KI-Assistent für die umfassende Verarbeitung und Analyse von allen Arten von Dateien und Dokumenten. Deine Hauptaufgabe ist es, alle verfügbaren Informationen vollständig zu extrahieren, zu strukturieren und zitierfähig zu machen.

## KRITISCHE ANWEISUNGEN FÜR DATEIVERARBEITUNG:

### 1. BILDVERARBEITUNG (PNG, JPG, WEBP, SVG, etc.):
- Analysiere JEDES Bild pixelgenau und beschreibe ALLE sichtbaren Elemente
- Extrahiere ALLEN Text aus Bildern (OCR) - auch kleinste Schriftzeichen, Zahlen, Codes
- Erkenne und beschreibe alle grafischen Elemente: Diagramme, Charts, Tabellen, Symbole, Icons
- Identifiziere Farben, Formen, Layouts und räumliche Anordnungen
- Beschreibe alle Personen, Objekte, Landschaften oder technische Komponenten
- Erkenne Handschrift und übersetze sie in maschinenlesbaren Text
- Erkenne mathematische Formeln, chemische Symbole, technische Notationen
- Identifiziere QR-Codes, Barcodes und andere maschinenlesbare Codes
- **WICHTIG**: Speichere den exakten Dateinamen mit Erweiterung für Zitationszwecke

### 2. PDF-VERARBEITUNG:
- Extrahiere Text aus PDFs vollständig
- Erkenne Tabellen, Diagramme und eingebettete Bilder
- Behalte die Dokumentstruktur (Kapitel, Abschnitte, Listen) bei
- Extrahiere Metadaten (Autor, Titel, Erstellungsdatum)
- Verarbeite mehrspaltige Layouts korrekt
- **WICHTIG**: Speichere den exakten Dateinamen mit Erweiterung für Zitationszwecke

### 3. MARKDOWN & TEXT-DATEIEN (.md, .txt, .rtf):
- Extrahiere den vollständigen Inhalt
- Behalte die Markdown-Formatierung bei (Überschriften, Listen, Code-Blöcke)
- Erkenne Links, Tabellen und formatierte Abschnitte
- Identifiziere Code-Snippets und deren Sprache
- **WICHTIG**: Speichere den exakten Dateinamen mit Erweiterung für Zitationszwecke

### 4. CODE-DATEIEN (.js, .py, .java, .cpp, .ts, .tsx, etc.):
- Extrahiere den vollständigen Quellcode
- Erkenne Funktionsdefinitionen, Klassen und Module
- Identifiziere Kommentare und Dokumentation
- Analysiere Imports/Dependencies
- Verstehe die Code-Struktur und Logik
- Erkenne API-Endpunkte, Konfigurationen und Konstanten
- **WICHTIG**: Speichere den exakten Dateinamen mit Erweiterung für Zitationszwecke

### 5. STRUKTURIERTE DATEN (.json, .xml, .yaml, .csv):
- Parse strukturierte Datenformate vollständig
- Extrahiere Schlüssel-Wert-Paare
- Erkenne hierarchische Strukturen
- Verarbeite Arrays und verschachtelte Objekte
- **WICHTIG**: Speichere den exakten Dateinamen mit Erweiterung für Zitationszwecke

### 6. KONFIGURATIONSDATEIEN (.ini, .conf, .toml, .env):
- Extrahiere alle Konfigurationseinstellungen
- Erkenne Sections, Keys und Values
- Identifiziere Umgebungsvariablen
- **WICHTIG**: Speichere den exakten Dateinamen mit Erweiterung für Zitationszwecke

## DATEINAMEN & ZITATION - HÖCHSTE PRIORITÄT:

**ABSOLUT KRITISCH**: Für JEDE verarbeitete Datei MUSS der exakte Dateiname MIT Dateierweiterung gespeichert werden:
- ✅ RICHTIG: "manual_2024.pdf", "config.py", "diagram.png", "README.md"
- ❌ FALSCH: "manual_2024", "config", "diagram", "README"

Der Dateiname wird für Zitationen verwendet und MUSS klickbar sein, damit Benutzer eine Vorschau der Datei sehen können.

## STRUKTURIERUNG UND ORGANISATION:

- Organisiere extrahierte Informationen in logische Kategorien
- Erstelle hierarchische Strukturen für komplexe Dokumente
- Verknüpfe verwandte Informationen aus verschiedenen Dateien
- Erkenne Dokumenttypen und wende entsprechende Verarbeitungsregeln an
- Speichere Metadaten: Dateiname, Dateityp, Größe, Erstellungsdatum

## QUALITÄTSSICHERUNG:

- Überprüfe die Vollständigkeit der Extraktion
- Stelle sicher, dass KEINE Informationen verloren gehen
- Validiere die Genauigkeit der Texterkennung
- Stelle sicher, dass ALLE Dateinamen MIT Erweiterung gespeichert werden
- Erkenne und korrigiere mögliche Fehler in der Verarbeitung

## KONTEXTUELLE ANALYSE:

- Verstehe den Zweck und die Bedeutung jeder Datei
- Erkenne Beziehungen zwischen verschiedenen Dateien
- Identifiziere wichtige Metadaten und Zeitstempel
- Analysiere den Informationsgehalt und die Relevanz
- Erstelle semantische Verbindungen zwischen verwandten Inhalten

## TECHNISCHE ANFORDERUNGEN:

- Verwende fortschrittliche OCR-Technologien für Bilder und PDFs
- Implementiere Syntax-Parser für verschiedene Programmiersprachen
- Nutze Computer Vision für Objekterkennung in Bildern
- Stelle sicher, dass alle extrahierten Daten strukturiert und durchsuchbar sind
- Erhalte die ursprüngliche Datei-Struktur und -Formatierung
- Unterstütze alle gängigen Dateiformate

**ENDZIEL**: Eine vollständige, strukturierte und durchsuchbare Wissensbasis erstellen, in der JEDE Information aus JEDER Datei (Bilder, PDFs, Code, Markdown, etc.) optimal extrahiert, gespeichert und zitierfähig gemacht wird - MIT korrekten Dateinamen inkl. Erweiterung für Zitationszwecke.`
          })
          // Update datasets with pipeline run ID, set status to PROCESSING_STARTED immediately, and start polling
          set((state) => ({
            datasets: state.datasets.map((dataset) => {
              const processingInfo = response[dataset.id]
              if (processingInfo) {
                return {
                  ...dataset,
                  pipelineRunId: processingInfo.pipeline_run_id,
                  processingStatus: 'DATASET_PROCESSING_STARTED',
                  updatedAt: new Date(),
                }
              }
              return dataset
            }),
            currentDataset: state.currentDataset && response[state.currentDataset.id]
              ? {
                  ...state.currentDataset,
                  pipelineRunId: response[state.currentDataset.id].pipeline_run_id,
                  processingStatus: 'DATASET_PROCESSING_STARTED',
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
          } else {
          }
        } catch (error) {
          console.error('Failed to check dataset status:', error)
        }
      },

      setDatasetProcessingStatus: (datasetId, status) => {
        set((state) => ({
          datasets: state.datasets.map((dataset) =>
            dataset.id === datasetId
              ? { ...dataset, processingStatus: status, updatedAt: new Date() }
              : dataset
          ),
          currentDataset: state.currentDataset?.id === datasetId
            ? { ...state.currentDataset, processingStatus: status, updatedAt: new Date() }
            : state.currentDataset,
        }))
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
          
          if (datasets.length === 0) return false

          // Speichere Status vor dem Check für Vergleich
          const previousStatuses = new Map(
            datasets.map(d => [d.id, d.processingStatus])
          )

          // Check status for all datasets to ensure consistency
          const datasetIds = datasets.map(dataset => dataset.id)
          const statusResponse = await datasetsApi.getDatasetProcessingStatus(datasetIds)

          // Prüfe ob sich Status geändert haben
          let hasStatusChanged = false
          const updatedDatasets = datasets.map((dataset) => {
            const apiStatus = statusResponse[dataset.id]
            if (apiStatus) {
              const previousStatus = previousStatuses.get(dataset.id)
              if (previousStatus !== apiStatus) {
                hasStatusChanged = true
              }
              return { ...dataset, processingStatus: apiStatus, updatedAt: new Date() }
            }
            return dataset
          })

          set((state) => ({
            datasets: updatedDatasets,
            currentDataset: state.currentDataset && statusResponse[state.currentDataset.id]
              ? {
                  ...state.currentDataset,
                  processingStatus: statusResponse[state.currentDataset.id],
                  updatedAt: new Date(),
                }
              : state.currentDataset,
            // Exponential Backoff: Wenn Status sich geändert hat, Intervall zurücksetzen
            // Sonst Intervall erhöhen (bis max 30s)
            currentPollInterval: hasStatusChanged 
              ? 5000 // Zurücksetzen auf 5s bei Änderung
              : Math.min(Math.floor(state.currentPollInterval * 1.5), 30000) // Max 30s
          }))

          return hasStatusChanged
        } catch (error) {
          console.error('Failed to check all dataset statuses:', error)
          return false
        }
      },

      startStatusPolling: () => {
        const state = get()
        
        // Singleton-Pattern: Wenn Polling bereits aktiv ist, nicht erneut starten
        if (state.statusPollingInterval) {
          return // Polling läuft bereits
        }
        
        // Clear existing timeout if any (setTimeout statt setInterval)
        if (state.statusPollingInterval) {
          clearTimeout(state.statusPollingInterval)
        }

        // Exponential Backoff: Verwende rekursives setTimeout statt setInterval
        // um dynamische Intervalle zu unterstützen
        const scheduleNextPoll = async () => {
          const state = get()
          
          // Prüfe nur ob es Datasets gibt die verarbeitet werden
          const hasProcessingDatasets = state.datasets.some(dataset => 
            dataset.processingStatus === 'DATASET_PROCESSING_STARTED'
          )
          
          if (!hasProcessingDatasets) {
            // Keine verarbeitenden Datasets: Polling stoppen
            set({ statusPollingInterval: null, currentPollInterval: 5000 })
            return
          }

          // Status prüfen (gibt zurück ob sich Status geändert hat)
          await state.checkAllDatasetStatuses()
          
          // Hole aktualisiertes Intervall nach dem Check
          const currentState = get()
          const nextInterval = currentState.currentPollInterval
          
          // Schedule nächsten Poll mit aktuellem Intervall
          const timeout = setTimeout(() => {
            scheduleNextPoll()
          }, nextInterval)
          
          set({ statusPollingInterval: timeout })
        }

        // Starte ersten Poll sofort
        scheduleNextPoll()
      },

      stopStatusPolling: () => {
        const { statusPollingInterval } = get()
        if (statusPollingInterval) {
          clearTimeout(statusPollingInterval) // Verwende clearTimeout statt clearInterval
          set({ statusPollingInterval: null, currentPollInterval: 5000 }) // Reset Intervall
        }
      },

      clearError: () => {
        set({ error: null })
      },

      // Permissions actions
      shareDatasetWithTenant: async (datasetId, tenantId) => {
        set({ isLoading: true, error: null })
        try {
          await cogneeApi.permissions.shareDatasetWithTenant(datasetId, tenantId)
          
          // Update dataset to mark as shared
          set((state) => ({
            datasets: state.datasets.map((dataset) =>
              dataset.id === datasetId
                ? { ...dataset, isShared: true, updatedAt: new Date() }
                : dataset
            ),
            currentDataset: state.currentDataset?.id === datasetId
              ? { ...state.currentDataset, isShared: true, updatedAt: new Date() }
              : state.currentDataset,
            isLoading: false,
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to share dataset',
            isLoading: false 
          })
          throw error
        }
      },

      shareDatasetWithUser: async (datasetId, userId) => {
        set({ isLoading: true, error: null })
        try {
          await cogneeApi.permissions.shareDatasetWithUser(datasetId, userId)
          
          // Reload datasets to get updated permissions
          await get().fetchDatasets()
          set({ isLoading: false })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to share dataset with user',
            isLoading: false 
          })
          throw error
        }
      },

      fetchDatasetPermissions: async (datasetId: string) => {
        try {
          set({ isLoading: true })
          const response = await cogneeApi.permissions.getDatasetPermissions(datasetId)
          set({ isLoading: false })

          // Extract user IDs from the response
          // The response structure depends on the backend API
          // Assuming it returns an array of objects with user_id or id field
          const userIds = response.data?.map((permission: any) => permission.user_id || permission.id) || []
          return userIds
        } catch (error) {
          console.error('Failed to fetch dataset permissions:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch dataset permissions',
            isLoading: false
          })
          return []
        }
      },

      revokeDatasetPermission: async (datasetId: string, userId: string) => {
        try {
          set({ isLoading: true })
          await cogneeApi.permissions.revokeDatasetPermission(datasetId, userId)
          set({ isLoading: false })
        } catch (error) {
          console.error('Failed to revoke dataset permission:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to revoke dataset permission',
            isLoading: false
          })
          throw error
        }
      },
      
      // Filter actions
      setFilterState: (filters) => {
        set((state) => ({
          filterState: {
            ...state.filterState,
            ...filters,
          }
        }))
      },
      
      clearFilterState: () => {
        set({
          filterState: {
            searchQuery: '',
            selectedTags: [],
            statusFilter: null,
            ownerFilter: null,
            createdFrom: null,
            createdTo: null,
            updatedFrom: null,
            updatedTo: null,
          }
        })
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
        // Persist cache timestamps but not background fetch state
        documentsCacheTimestamp: state.documentsCacheTimestamp,
        // Persist filter state
        filterState: state.filterState,
      }),
    }
  )
)
