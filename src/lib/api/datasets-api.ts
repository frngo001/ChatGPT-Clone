/**
 * ============================================================================
 * DATASET MANAGEMENT API SERVICE
 * ============================================================================
 * 
 * @file datasets-api.ts
 * @description 
 * Vollständige API-Schnittstelle für Dataset-Verwaltung im ChatGPT-Clone Projekt.
 * Bietet CRUD-Operationen für Datasets, Daten-Upload, Cognify-Verarbeitung
 * und Graph-Visualisierung.
 * 
 * Verbindet mit Cognee API Server (Standard: http://imeso-ki-02:8000)
 * 
 * @author ChatGPT-Clone Team
 * @since 1.0.0
 */

import { useAuthStore } from '@/stores/auth-store'

/**
 * Basis URL für alle API-Requests
 */
const API_BASE_URL = '/api/v1'

/**
 * ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================
 */

/**
 * Request für Dataset-Erstellung
 * 
 * @interface CreateDatasetRequest
 */
export interface CreateDatasetRequest {
  /** Name des Datasets (wird automatisch sanitized) */
  name: string
  /** Beschreibung des Datasets */
  description: string
  /** Optionale Tags für Kategorisierung */
  tags?: string[]
}

/**
 * Request für Dataset-Updates
 * 
 * @interface UpdateDatasetRequest
 */
export interface UpdateDatasetRequest {
  /** Neuer Name (optional) */
  name?: string
  /** Neue Beschreibung (optional) */
  description?: string
  /** Neue Tags (optional) */
  tags?: string[]
}

/**
 * Response für Dataset-Informationen
 * 
 * @interface DatasetResponse
 */
export interface DatasetResponse {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  ownerId?: string
  tags?: string[]
  files?: DatasetFileResponse[]
}

export interface DatasetFileResponse {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  originalExtension: string
  originalMimeType: string
  datasetId: string
  rawDataLocation?: string
}

// New interface for the actual API response
export interface AddDataResponse {
  status: string
  pipeline_run_id: string
  dataset_id: string
  dataset_name: string
  payload: any
  data_ingestion_info: DataIngestionInfo[]
}

export interface DataIngestionInfo {
  run_info: {
    status: string
    pipeline_run_id: string
    dataset_id: string
    dataset_name: string
    payload: any
    data_ingestion_info: any
  }
  data_id: string
}

// Types for different data types that can be added
export type DataType = 'file' | 'text' | 'url' | 'github'

export interface AddDataRequest {
  data: string | File | string[] // Can be text, URL, file, or array of URLs
  datasetId: string
  node_set?: string[]
  metadata?: Record<string, any>
}

// New interface for bulk upload with separate arrays
export interface AddBulkDataRequest {
  data?: File[] // Array of files
  urls?: string[] // Array of URLs/paths
  text_data?: string[] // Array of text strings
  datasetId: string // Required UUID
  node_set?: string[]
}

export interface DatasetStatusResponse {
  id: string
  name: string
  status: string
  created_at: string
  updated_at: string
}

// Cognify API interfaces
export interface CognifyRequest {
  datasets?: string[]      // Dataset names
  datasetIds?: string[]    // Dataset IDs
  runInBackground?: boolean
  customPrompt?: string
}

export interface CognifyResponse {
  [datasetId: string]: {
    status: string
    pipeline_run_id: string
    dataset_id: string
    dataset_name: string
    payload: any[]
    data_ingestion_info: any
  }
}

/**
 * ============================================================================
 * API SERVICE CLASS
 * ============================================================================
 */

/**
 * Service-Klasse für Dataset-Management API Operationen
 * 
 * @class DatasetsApiService
 * @description 
 * Zentrale Klasse für alle Dataset-bezogenen API-Operationen.
 * Verwaltet Authentifizierung, Fehlerbehandlung und Daten-Mapping.
 * 
 * Alle Methoden sind asynchron und verwenden automatisch den Auth-Token
 * aus dem Auth Store für alle Requests.
 * 
 * @example
 * ```typescript
 * const api = new DatasetsApiService();
 * const datasets = await api.getDatasets();
 * const newDataset = await api.createDataset({ name: "Test", description: "..." });
 * ```
 */
export class DatasetsApiService {
  private baseUrl: string

  /**
   * Initialisiert den API Service
   * 
   * @param baseUrl - Basis-URL für API Requests (default: '/api/v1')
   */
  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Erstellt Authorization Headers mit Bearer Token
   * 
   * @private
   * @returns Headers mit Content-Type und Authorization
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Add Bearer token from auth store
    const token = useAuthStore.getState().auth.accessToken
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  }

  /**
   * Verarbeitet API Response und wirft Fehler bei HTTP-Status != 2xx
   * 
   * @private
   * @param response - Fetch Response Object
   * @returns Parsed JSON Response
   * @throws Error mit HTTP Status Code und Error Text
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }
    return response.json()
  }

  /**
   * Bereinigt Dataset-Namen für Backend-Kompatibilität
   * 
   * @private
   * @param name - Originaler Dataset-Name
   * @returns Sanitized Name (erlaubt: a-z, A-Z, 0-9, -, _)
   * 
   * Regeln:
   * - Leerzeichen -> Underscores
   * - Entfernt Dots
   * - Entfernt Sonderzeichen außer -, _
   * - Reduziert mehrfache Underscores
   * - Entfernt führende/trailing Underscores
   */
  private sanitizeDatasetName(name: string): string {
    // Replace spaces with underscores and remove dots
    return name
      .replace(/\s+/g, '_')  // Replace spaces with underscores
      .replace(/\./g, '')    // Remove dots
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace any other special characters with underscores
      .replace(/_+/g, '_')   // Replace multiple consecutive underscores with single underscore
      .replace(/^_|_$/g, '') // Remove leading and trailing underscores
  }

  /**
   * Ruft alle Datasets des aktuellen Benutzers ab
   * 
   * @returns Array von DatasetResponse Objekten
   * @throws Error bei HTTP-Fehlern
   */
  async getDatasets(): Promise<DatasetResponse[]> {
    const response = await fetch(`${this.baseUrl}/datasets`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return this.handleResponse<DatasetResponse[]>(response)
  }

  /**
   * Erstellt ein neues Dataset
   * 
   * @param data - Dataset-Erstellungsdaten
   * @returns Erstelltes Dataset mit ID und Timestamps
   * @throws Error bei HTTP-Fehlern oder ungültigen Daten
   * 
   * @example
   * ```typescript
   * const dataset = await api.createDataset({
   *   name: "My Dataset",
   *   description: "Dataset description",
   *   tags: ["tag1", "tag2"]
   * });
   * ```
   */
  async createDataset(data: CreateDatasetRequest): Promise<DatasetResponse> {
    // Sanitize dataset name before creating to prevent backend validation errors
    const sanitizedData = {
      ...data,
      name: this.sanitizeDatasetName(data.name)
    }
    
    const response = await fetch(`${this.baseUrl}/datasets`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(sanitizedData),
    })

    return this.handleResponse<DatasetResponse>(response)
  }

  /**
   * Aktualisiert Dataset-Metadaten
   * 
   * @param datasetId - UUID des Datasets
   * @param data - Zu aktualisierende Felder
   * @returns Aktualisierte Dataset-Informationen
   */
  async updateDataset(datasetId: string, data: UpdateDatasetRequest): Promise<DatasetResponse> {
    const sanitizedData: UpdateDatasetRequest = { ...data }
    
    // Sanitize dataset name if provided
    if (data.name) {
      sanitizedData.name = this.sanitizeDatasetName(data.name)
    }
    
    const response = await fetch(`${this.baseUrl}/datasets/${datasetId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(sanitizedData),
    })

    return this.handleResponse<DatasetResponse>(response)
  }

  /**
   * Löscht ein Dataset und alle zugehörigen Daten
   * 
   * @param datasetId - UUID des Datasets
   * @throws Error bei HTTP-Fehlern oder fehlenden Berechtigungen
   */
  async deleteDataset(datasetId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/datasets/${datasetId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }
  }

  /**
   * Ruft alle Daten eines Datasets ab
   * 
   * @param datasetId - UUID des Datasets
   * @returns Array von Dataset-Dateien
   */
  async getDatasetData(datasetId: string): Promise<DatasetFileResponse[]> {
    const response = await fetch(`${this.baseUrl}/datasets/${datasetId}/data`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return this.handleResponse<DatasetFileResponse[]>(response)
  }

  // DELETE /api/v1/datasets/{dataset_id}/data/{data_id} - Delete data from dataset
  async deleteDatasetData(datasetId: string, dataId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/datasets/${datasetId}/data/${dataId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }
  }

  // GET /api/v1/datasets/{dataset_id}/data/{data_id}/raw - Get raw data
  async getRawData(datasetId: string, dataId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/datasets/${datasetId}/data/${dataId}/raw`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    return response.blob()
  }

  // GET /api/v1/datasets/{dataset_id}/graph - Get dataset graph
  async getDatasetGraph(datasetId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/datasets/${datasetId}/graph`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return this.handleResponse<any>(response)
  }

  // GET /api/v1/datasets/status - Get dataset status
  async getDatasetStatus(): Promise<DatasetStatusResponse[]> {
    const response = await fetch(`${this.baseUrl}/datasets/status`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return this.handleResponse<DatasetStatusResponse[]>(response)
  }

  /**
   * Fügt Daten zu einem Dataset hinzu (Files, Text, URLs)
   * 
   * @param request - Request mit Daten und Dataset-ID
   * @returns Information über den Upload-Prozess
   * 
   * Unterstützt:
   * - File Uploads (FormData)
   * - Text Daten
   * - URLs (einzelne oder Array)
   * - Optionale node_set Konfiguration
   */
  async addDataToDataset(request: AddDataRequest): Promise<AddDataResponse> {
    const formData = new FormData()
    
    // Add the data (can be file, text, URL, or array of URLs)
    if (request.data instanceof File) {
      formData.append('data', request.data)
    } else if (Array.isArray(request.data)) {
      // For multiple URLs
      request.data.forEach((url) => {
        formData.append('data', url)
      })
    } else {
      // For text or single URL
      formData.append('data', request.data)
    }
    
    formData.append('datasetId', request.datasetId)
    
    if (request.node_set && request.node_set.length > 0) {
      request.node_set.forEach((node) => {
        formData.append('node_set', node)
      })
    }
    
    if (request.metadata) {
      formData.append('metadata', JSON.stringify(request.metadata))
    }

    // Create headers without Content-Type for FormData (browser will set it automatically)
    const headers: HeadersInit = {}
    const token = useAuthStore.getState().auth.accessToken
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseUrl}/add`, {
      method: 'POST',
      headers,
      body: formData,
    })

    return this.handleResponse<AddDataResponse>(response)
  }

  // POST /api/v1/add - Bulk add data to dataset (new API format with separate arrays)
  async addBulkDataToDataset(request: AddBulkDataRequest): Promise<AddDataResponse> {
    const formData = new FormData()
    
    // Add data (files)
    if (request.data && request.data.length > 0) {
      request.data.forEach((file) => {
        formData.append('data', file)
      })
    }
    
    // Add URLs
    if (request.urls && request.urls.length > 0) {
      request.urls.forEach((url) => {
        formData.append('urls', url)
      })
    }
    
    // Add text_data
    if (request.text_data && request.text_data.length > 0) {
      request.text_data.forEach((text) => {
        formData.append('text_data', text)
      })
    }
    
    // Add datasetId (required)
    formData.append('datasetId', request.datasetId)
    
    // Add node_set (optional)
    if (request.node_set && request.node_set.length > 0) {
      request.node_set.forEach((node) => {
        formData.append('node_set', node)
      })
    }

    // Create headers without Content-Type for FormData (browser will set it automatically)
    const headers: HeadersInit = {}
    const token = useAuthStore.getState().auth.accessToken
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseUrl}/add`, {
      method: 'POST',
      headers,
      body: formData,
    })

    return this.handleResponse<AddDataResponse>(response)
  }

  // Convenience method for file uploads (backward compatibility)
  async addFileToDataset(datasetId: string, file: File, metadata?: Record<string, any>): Promise<AddDataResponse> {
    return this.addDataToDataset({
      data: file,
      datasetId,
      metadata,
    })
  }

  // Convenience method for text data
  async addTextToDataset(datasetId: string, text: string, metadata?: Record<string, any>): Promise<AddDataResponse> {
    return this.addDataToDataset({
      data: text,
      datasetId,
      metadata,
    })
  }

  // Convenience method for URL data
  async addUrlToDataset(datasetId: string, url: string, metadata?: Record<string, any>): Promise<AddDataResponse> {
    return this.addDataToDataset({
      data: url,
      datasetId,
      metadata,
    })
  }

  // Convenience method for multiple URLs
  async addUrlsToDataset(datasetId: string, urls: string[], metadata?: Record<string, any>): Promise<AddDataResponse> {
    return this.addDataToDataset({
      data: urls,
      datasetId,
      metadata,
    })
  }

  // POST /api/v1/cognify - Process datasets
  async cognifyDatasets(request: CognifyRequest): Promise<CognifyResponse> {
    const response = await fetch(`${this.baseUrl}/cognify`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    })

    return this.handleResponse<CognifyResponse>(response)
  }

  // GET /api/v1/datasets/status - Check dataset processing status
  async getDatasetProcessingStatus(datasetIds: string[]): Promise<Record<string, string>> {
    const params = new URLSearchParams()
    datasetIds.forEach(id => params.append('dataset', id))
    
    const url = `${this.baseUrl}/datasets/status?${params.toString()}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    const result = await this.handleResponse<Record<string, string>>(response)
    
    return result
  }

  // Test method to verify API connectivity
  async testApiConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/datasets`, {
        method: 'GET',
        headers: this.getHeaders(),
      })
      return response.ok
    } catch (error) {
      console.error('API connection test failed:', error)
      return false
    }
  }
}

// Create a singleton instance
export const datasetsApi = new DatasetsApiService()

// Helper function to safely parse date strings
function safeParseDate(dateString: string | undefined): Date {
  if (!dateString) {
    return new Date()
  }
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString)
      return new Date()
    }
    return date
  } catch (error) {
    console.error('Date parsing error:', error, dateString)
    return new Date()
  }
}

// Helper function to convert API response to local Dataset format
export function convertApiResponseToDataset(apiResponse: DatasetResponse): any {
  return {
    id: apiResponse.id,
    name: apiResponse.name,
    description: apiResponse.description || '',
    createdAt: safeParseDate(apiResponse.createdAt),
    updatedAt: safeParseDate(apiResponse.updatedAt),
    ownerId: apiResponse.ownerId,
    tags: apiResponse.tags || [],
    files: apiResponse.files?.map(file => ({
      id: file.id,
      name: file.name,
      type: file.originalMimeType,
      size: 0, // Size not provided in new API format
      uploadDate: safeParseDate(file.createdAt),
      content: undefined, // Content not provided in new API format
      extension: file.originalExtension,
    })) || [],
  }
}

// Helper function to convert local Dataset format to API request
export function convertDatasetToApiRequest(dataset: any): CreateDatasetRequest {
  return {
    name: dataset.name,
    description: dataset.description,
    tags: dataset.tags || [],
  }
}

// Helper function to convert local Dataset format to API update request
export function convertDatasetToUpdateRequest(dataset: any): UpdateDatasetRequest {
  return {
    name: dataset.name,
    description: dataset.description,
    tags: dataset.tags || [],
  }
}
