import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { datasetsApi, convertApiResponseToDataset, convertDatasetToApiRequest, convertDatasetToUpdateRequest, AddDataResponse, DataType } from '@/lib/api/datasets-api'
import { cogneeApi } from '@/lib/api/cognee-api-client'
import type { DatasetPermission } from '@/types/permissions'

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
  checkAllDatasetStatuses: () => Promise<void>
  startStatusPolling: () => void
  stopStatusPolling: () => void
  getUnprocessedDatasets: () => Dataset[]
  
  // Utility
  getDatasetById: (id: string) => Dataset | undefined
  searchDatasets: (query: string) => Dataset[]
  clearError: () => void
  
  // Permissions actions
  shareDatasetWithTenant: (datasetId: string, tenantId: string) => Promise<void>
  fetchDatasetPermissions: (datasetId: string) => Promise<DatasetPermission[]>
  
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
          const apiRequest = convertDatasetToUpdateRequest(updates)
          const apiResponse = await datasetsApi.updateDataset(id, apiRequest)
          const updatedDataset = convertApiResponseToDataset(apiResponse)
          
          set((state) => ({
            datasets: state.datasets.map((dataset) =>
              dataset.id === id ? updatedDataset : dataset
            ),
            currentDataset: state.currentDataset?.id === id ? updatedDataset : state.currentDataset,
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
          
          // Invalidate cache after successful upload
          get().invalidateDatasetCache(datasetId)
          
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
              type = 'text/uri-list'
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
              type: file.originalMimeType,
              size: 0, // Size not provided in new API format
              uploadDate,
              content: undefined, // Content not provided in new API format
              extension: file.originalExtension,
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
          } else {
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

      fetchDatasetPermissions: async (_datasetId) => {
        // This would fetch actual permissions from Cognee
        // For now, return empty array as placeholder
        return []
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
