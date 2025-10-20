// API service for datasets management
// Connects to the Cognee API at http://imeso-ki-02:8000

const API_BASE_URL = '/api/v1'

// Types for API requests and responses
export interface CreateDatasetRequest {
  name: string
  description: string
  tags?: string[]
}

export interface DatasetResponse {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  tags?: string[]
  files?: DatasetFileResponse[]
}

export interface DatasetFileResponse {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  extension: string
  mimeType: string
  datasetId: string
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
  datasetName?: string
  node_set?: string[]
  metadata?: Record<string, any>
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

// API service class
export class DatasetsApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  // Get authorization headers
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Add Bearer token if available (you might need to get this from your auth store)
    const token = localStorage.getItem('auth_token')
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  }

  // Handle API errors
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }
    return response.json()
  }

  // Sanitize dataset name to comply with backend requirements
  private sanitizeDatasetName(name: string): string {
    // Replace spaces with underscores and remove dots
    return name
      .replace(/\s+/g, '_')  // Replace spaces with underscores
      .replace(/\./g, '')    // Remove dots
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace any other special characters with underscores
      .replace(/_+/g, '_')   // Replace multiple consecutive underscores with single underscore
      .replace(/^_|_$/g, '') // Remove leading and trailing underscores
  }

  // GET /api/v1/datasets - Get all datasets
  async getDatasets(): Promise<DatasetResponse[]> {
    const response = await fetch(`${this.baseUrl}/datasets`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return this.handleResponse<DatasetResponse[]>(response)
  }

  // POST /api/v1/datasets - Create new dataset
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

  // DELETE /api/v1/datasets/{dataset_id} - Delete dataset
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

  // GET /api/v1/datasets/{dataset_id}/data - Get dataset data
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
  async getRawData(datasetId: string, dataId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/datasets/${datasetId}/data/${dataId}/raw`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    return response.text()
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

  // POST /api/v1/add - Add data to dataset (files, text, URLs, etc.)
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
    
    // Add optional parameters
    if (request.datasetName) {
      // Sanitize dataset name to prevent backend validation errors
      const sanitizedDatasetName = this.sanitizeDatasetName(request.datasetName)
      formData.append('datasetName', sanitizedDatasetName)
    }
    
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
    const token = localStorage.getItem('auth_token')
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
    description: apiResponse.description,
    createdAt: safeParseDate(apiResponse.created_at),
    updatedAt: safeParseDate(apiResponse.updated_at),
    tags: apiResponse.tags || [],
    files: apiResponse.files?.map(file => ({
      id: file.id,
      name: file.name,
      type: file.mimeType,
      size: 0, // Size not provided in new API format
      uploadDate: safeParseDate(file.createdAt),
      content: undefined, // Content not provided in new API format
      extension: file.extension,
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
