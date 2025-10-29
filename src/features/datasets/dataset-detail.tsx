import { useState, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Upload, Edit, Search, Filter, Grid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useDatasetStore } from '@/stores/dataset-store'
import { AddDataDialog } from './components/add-data-dialog'
import { ProcessingStatusBadge } from './components/processing-status-badge'
import { DeleteFileDialog } from './components/delete-file-dialog'
import { EditDatasetDialog } from './components/edit-dataset-dialog'
import { PdfPreviewSheet } from './components/pdf-preview-sheet'
import { FileCard } from './components/file-card'
import { 
  getFaviconUrl as getCachedFaviconUrl, 
  getUrlDescription as getCachedUrlDescription,
  setUrlDescription 
} from '@/lib/url-cache'

export function DatasetDetailPage() {
  const { datasetId } = useParams({ from: '/_authenticated/library/datasets/$datasetId' })
  const navigate = useNavigate()
  const { getDatasetById, fetchDatasetDataWithCache, processDatasets, checkDatasetStatus, isFetchingInBackground, downloadDatasetFile } = useDatasetStore()
  const [showAddDataDialog, setShowAddDataDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isProcessing, setIsProcessing] = useState(false)
  const [deleteFileDialog, setDeleteFileDialog] = useState<{
    open: boolean
    fileId: string
    fileName: string
  }>({
    open: false,
    fileId: '',
    fileName: ''
  })
  const [previewFile, setPreviewFile] = useState<{
    fileId: string
    fileName: string
  } | null>(null)
  const [urlDescriptions, setUrlDescriptions] = useState<Record<string, string>>({})

  const dataset = getDatasetById(datasetId)
  const isBackgroundFetching = datasetId ? isFetchingInBackground[datasetId] : false
  
  // Lade gecachte Beschreibungen beim Initialisieren
  useEffect(() => {
    if (!dataset) return
    
    const urlFiles = dataset.files.filter(file => 
      file.type === 'text/url' || file.type === 'text/uri-list' || file.extension === 'url'
    )
    
    const cachedDescriptions: Record<string, string> = {}
    urlFiles.forEach(file => {
      const cached = getCachedUrlDescription(file.name)
      if (cached) {
        cachedDescriptions[file.name] = cached
      }
    })
    
    if (Object.keys(cachedDescriptions).length > 0) {
      setUrlDescriptions(cachedDescriptions)
    }
  }, [dataset])

  // Always use cache-aware fetch
  useEffect(() => {
    if (datasetId) {
      fetchDatasetDataWithCache(datasetId).catch(() => {
        toast.error('Fehler beim Laden der Dataset-Dateien')
      })
    }
  }, [datasetId, fetchDatasetDataWithCache])

  // Check dataset status periodically if it's processing
  useEffect(() => {
    if (dataset?.processingStatus === 'DATASET_PROCESSING_STARTED') {
      const interval = setInterval(() => {
        checkDatasetStatus(datasetId)
      }, 5000) // Check every 5 seconds

      return () => clearInterval(interval)
    }
  }, [dataset?.processingStatus, datasetId, checkDatasetStatus])

  if (!dataset) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Dataset nicht gefunden</h3>
          <p className="text-muted-foreground mb-4">
            Das gesuchte Dataset existiert nicht.
          </p>
          <Button onClick={() => navigate({ to: '/library/datasets' })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu Datasets
          </Button>
        </div>
      </div>
    )
  }

  const filteredFiles = dataset.files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }


  const truncateFileName = (fileName: string, maxLength: number = 35) => {
    if (fileName.length <= maxLength) return fileName
    
    // For URLs, try to keep the domain and path visible
    if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
      try {
        const url = new URL(fileName)
        const domain = url.hostname
        const pathname = url.pathname
        
        // If just the domain + short path fits, show that
        const shortPath = pathname.length > 20 ? '...' + pathname.slice(-17) : pathname
        const displayUrl = domain + shortPath
        
        if (displayUrl.length <= maxLength) {
          return displayUrl
        }
        
        // Otherwise, show domain and truncated path
        const maxDomainLength = Math.min(domain.length, Math.floor(maxLength / 2))
        const maxPathLength = maxLength - maxDomainLength - 4
        return domain.substring(0, maxDomainLength) + '...' + pathname.slice(-maxPathLength)
      } catch {
        // If URL parsing fails, fall back to regular truncation
      }
    }
    
    // Regular truncation for non-URLs or if URL parsing fails
    const truncatedName = fileName.substring(0, maxLength - 3) + '...'
    return truncatedName
  }

  const getFaviconUrl = (url: string) => {
    return getCachedFaviconUrl(url)
  }

  const getUrlDescription = (url: string): string => {
    // Return cached description from state if available
    if (urlDescriptions[url]) {
      return urlDescriptions[url]
    }
    
    // Prüfe persistenten Cache
    const cached = getCachedUrlDescription(url)
    if (cached) {
      setUrlDescriptions(prev => ({ ...prev, [url]: cached }))
      return cached
    }
    
    // Return domain as fallback while fetching
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return url
    }
  }

  // Fetch OpenGraph descriptions for URLs
  useEffect(() => {
    const fetchUrlDescriptions = async () => {
      if (!dataset) return

      const urlFiles = dataset.files.filter(file => 
        file.type === 'text/url' || file.type === 'text/uri-list' || file.extension === 'url'
      )

      const urlsToFetch = urlFiles.filter(file => !urlDescriptions[file.name])

      if (urlsToFetch.length === 0) return

      for (const file of urlsToFetch) {
        try {
          const encodedUrl = encodeURIComponent(file.name)
          const response = await fetch(`/api/url/metadata?url=${encodedUrl}`)
          
          if (response.ok) {
            const data = await response.json()
            if (data.description) {
              // Speichere im persistenten Cache
              setUrlDescription(file.name, data.description)
              
              // Aktualisiere State für sofortige Anzeige
              setUrlDescriptions(prev => ({
                ...prev,
                [file.name]: data.description
              }))
            }
          }
        } catch (error) {
          console.error(`Failed to fetch metadata for ${file.name}:`, error)
        }
      }
    }

    fetchUrlDescriptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset?.files])

  const handleDeleteFile = (fileId: string, fileName: string) => {
    setDeleteFileDialog({
      open: true,
      fileId,
      fileName
    })
  }

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    if (!datasetId) return
    
    try {
      await downloadDatasetFile(datasetId, fileId, fileName)
      toast.success('Datei erfolgreich heruntergeladen')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Herunterladen der Datei'
      toast.error(errorMessage)
    }
  }

  const handlePreviewFile = (fileId: string, fileName: string, fileType?: string, fileExtension?: string) => {
    // Check if file is a PDF
    const isPdf = fileType === 'application/pdf' || fileExtension?.toLowerCase() === 'pdf'
    
    if (!isPdf) {
      toast.error('Nur PDF-Dateien können in der Vorschau angezeigt werden')
      return
    }
    
    setPreviewFile({ fileId, fileName })
  }

  const handleProcessDataset = async () => {
    if (!dataset) return

    setIsProcessing(true)
    try {
      await processDatasets([datasetId])
      toast.success(`Dataset "${dataset.name}" wird verarbeitet.`)
      
      // Check dataset status after 1 second to see if processing started
      setTimeout(() => {
        checkDatasetStatus(datasetId)
      }, 50)
    } catch (error) {
      toast.error(`Verarbeitung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const needsProcessing = !dataset?.processingStatus || 
                         dataset.processingStatus === 'DATASET_PROCESSING_INITIATED' || 
                         dataset.processingStatus === 'DATASET_PROCESSING_ERRORED'


  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/library/datasets' })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Zurück</span>
          </Button>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <div className="flex flex-col gap-2 flex-1 min-w-0 sm:flex-row sm:items-center sm:gap-3">
            <h1 className="text-lg sm:text-xl font-bold truncate">{dataset.name}</h1>
            <div className="flex items-center gap-2">
              <ProcessingStatusBadge status={dataset.processingStatus} />
              {isBackgroundFetching && (
                <Badge variant="outline" className="h-7 text-xs animate-pulse">
                  Aktualisiere...
                </Badge>
              )}
              <Button 
                variant="outline" 
                className="h-6 px-2 py-0.5 text-xs w-fit gap-1.5"
                onClick={() => setShowEditDialog(true)}
              >
                <Edit className="h-3 w-3" />
                <span className="hidden sm:inline">Bearbeiten</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {needsProcessing && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleProcessDataset}
                disabled={isProcessing}
                className="hidden sm:flex"
              >
                {isProcessing ? 'Wird verarbeitet...' : 'Dataset verarbeiten'}
              </Button>
            )}
            <Button size="sm" onClick={() => setShowAddDataDialog(true)}>
              <Upload className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Daten hinzufügen</span>
              <span className="sm:hidden">Hinzufügen</span>
            </Button>
          </div>
        </div>
        
        <div className="flex-1 min-w-0 sm:ml-[calc(2rem+1px)]">
          <p className="text-sm text-muted-foreground mt-1">{dataset.description}</p>
          {/* Tags */}
          {dataset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {dataset.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>



      {/* Files Section */}
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">Dateien</CardTitle>
              <CardDescription className="text-xs mt-1">
                {dataset.files.length} Dateien in diesem Dataset
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Search and Filters */}
          <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Dateien durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-8 text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 flex-1 sm:flex-none">
                    <Filter className="mr-1 h-3 w-3" />
                    <span className="hidden sm:inline">Filter</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Alle Dateien</DropdownMenuItem>
                  <DropdownMenuItem>Zuletzt hochgeladen</DropdownMenuItem>
                  <DropdownMenuItem>Größte Dateien</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex rounded-md border">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none h-8 px-2"
                >
                  <Grid className="h-3 w-3" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none h-8 px-2"
                >
                  <List className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {filteredFiles.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold">
                {searchQuery ? 'Keine Dateien gefunden' : 'Keine Dateien hochgeladen'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Versuchen Sie, Ihre Suchbegriffe anzupassen.' 
                  : 'Laden Sie Dateien hoch, um mit diesem Dataset zu beginnen.'
                }
              </p>
              {!searchQuery && (
                <Button size="sm" onClick={() => setShowAddDataDialog(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Daten hinzufügen
                </Button>
              )}
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid gap-4 sm:gap-5 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                : 'space-y-2 sm:space-y-3'
            }>
              {filteredFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onPreview={handlePreviewFile}
                  onDownload={handleDownloadFile}
                  onDelete={handleDeleteFile}
                  getFaviconUrl={getFaviconUrl}
                  getUrlDescription={getUrlDescription}
                  truncateFileName={truncateFileName}
                  variant={viewMode === 'list' ? 'list' : 'grid'}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddDataDialog
        open={showAddDataDialog}
        onOpenChange={setShowAddDataDialog}
        datasetId={datasetId}
      />

      <DeleteFileDialog
        open={deleteFileDialog.open}
        onOpenChange={(open) => setDeleteFileDialog(prev => ({ ...prev, open }))}
        datasetId={datasetId}
        fileId={deleteFileDialog.fileId}
        fileName={deleteFileDialog.fileName}
        onSuccess={() => {
          // Refresh dataset data after successful deletion
          fetchDatasetDataWithCache(datasetId).catch(() => {
            // Error handling already done in the store
          })
        }}
      />

      <EditDatasetDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        datasetId={datasetId}
        onSuccess={() => {
          // Dialog will close automatically
        }}
      />

      <PdfPreviewSheet
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        fileId={previewFile?.fileId ?? ''}
        fileName={previewFile?.fileName ?? ''}
        datasetId={datasetId}
      />
    </div>
  )
}
