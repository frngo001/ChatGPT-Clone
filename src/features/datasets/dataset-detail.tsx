import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Upload, Edit, Search, Filter, Grid, List, Loader2 } from 'lucide-react'
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
// Lazy load PDF Preview Sheet (sehr schwer: ~500KB) - nur laden wenn nötig
const PdfPreviewSheet = lazy(() => import('./components/pdf-preview-sheet').then(module => ({ default: module.PdfPreviewSheet })))
// Lazy load Text/Markdown Preview Sheet
const TextMarkdownPreviewSheet = lazy(() => import('./components/text-markdown-preview-sheet').then(module => ({ default: module.TextMarkdownPreviewSheet })))
// Lazy load Image Preview Sheet
const ImagePreviewSheet = lazy(() => import('./components/image-preview-sheet').then(module => ({ default: module.ImagePreviewSheet })))
import { FileCard } from './components/file-card'
import { 
  getFaviconUrl as getCachedFaviconUrl, 
  getUrlDescription as getCachedUrlDescription,
  setUrlDescription 
} from '@/lib/url-cache'
import { truncateFileName } from '@/lib/utils'

export function DatasetDetailPage() {
  const { datasetId } = useParams({ from: '/_authenticated/library/datasets/$datasetId' })
  const navigate = useNavigate()
  // Selektive Selektoren für optimale Performance - verhindert unnötige Re-renders
  // Reaktiver Selektor für dataset - aktualisiert sich automatisch bei Store-Änderungen
  const dataset = useDatasetStore((state) => 
    state.currentDataset?.id === datasetId 
      ? state.currentDataset 
      : state.datasets.find(d => d.id === datasetId)
  )
  const fetchDatasetDataWithCache = useDatasetStore((state) => state.fetchDatasetDataWithCache)
  const processDatasets = useDatasetStore((state) => state.processDatasets)
  const checkDatasetStatus = useDatasetStore((state) => state.checkDatasetStatus)
  const setDatasetProcessingStatus = useDatasetStore((state) => state.setDatasetProcessingStatus)
  const downloadDatasetFile = useDatasetStore((state) => state.downloadDatasetFile)
  // isFetchingInBackground ist ein Objekt, daher selektiver Selektor
  const isFetchingInBackground = useDatasetStore((state) => state.isFetchingInBackground)
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
    fileType?: string
    fileExtension?: string
  } | null>(null)
  const isBackgroundFetching = datasetId ? isFetchingInBackground[datasetId] : false
  
  // Ref für gefetchte URL-Descriptions (kein State-Update während Rendering)
  const fetchedDescriptionsRef = useRef<Record<string, string>>({})
  // State-Trigger nur für Re-Renders (wird nur in useEffect geändert)
  const [descriptionUpdateTrigger, setDescriptionUpdateTrigger] = useState(0)
  
  // Berechne URL-Descriptions aus persistentem Cache + gefetchten Beschreibungen
  const urlDescriptions = useMemo(() => {
    if (!dataset) return {}
    
    const urlFiles = dataset.files.filter(file => 
      file.type === 'url' || file.type === 'text/url' || file.type === 'text/uri-list' || file.extension === 'url'
    )
    
    const descriptions: Record<string, string> = {}
    urlFiles.forEach(file => {
      // Zuerst aus gefetchtem Ref-Cache (wird in useEffect aktualisiert)
      if (fetchedDescriptionsRef.current[file.name]) {
        descriptions[file.name] = fetchedDescriptionsRef.current[file.name]
      } 
      // Dann aus persistentem Cache
      else {
        const cached = getCachedUrlDescription(file.name)
        if (cached) {
          descriptions[file.name] = cached
        }
      }
    })
    
    return descriptions
  }, [dataset?.files, descriptionUpdateTrigger]) // Trigger als Dependency für Re-Renders

  // Lade initial gecachte Beschreibungen in Ref (nur einmal beim Mount/Dataset-Change)
  useEffect(() => {
    if (!dataset) return
    
    const urlFiles = dataset.files.filter(file => 
      file.type === 'url' || file.type === 'text/url' || file.type === 'text/uri-list' || file.extension === 'url'
    )
    
    // Lade alle gecachten Beschreibungen in den Ref
    urlFiles.forEach(file => {
      const cached = getCachedUrlDescription(file.name)
      if (cached && !fetchedDescriptionsRef.current[file.name]) {
        fetchedDescriptionsRef.current[file.name] = cached
      }
    })
    
    // Trigger initial Re-Render wenn Beschreibungen gefunden wurden
    const hasCached = urlFiles.some(file => getCachedUrlDescription(file.name))
    if (hasCached) {
      setDescriptionUpdateTrigger(prev => prev + 1)
    }
  }, [dataset?.id]) // Nur wenn Dataset-ID ändert

  // Always use cache-aware fetch
  useEffect(() => {
    if (datasetId) {
      fetchDatasetDataWithCache(datasetId).catch(() => {
        toast.error('Fehler beim Laden der Dataset-Dateien')
      })
    }
  }, [datasetId, fetchDatasetDataWithCache])

  // Check dataset status periodically if it's processing
  // Note: Das globale Polling in datasets-list.tsx übernimmt dies bereits
  // Lokales Polling nur als Fallback wenn globales Polling nicht aktiv ist
  useEffect(() => {
    const isProcessing = dataset?.processingStatus === 'DATASET_PROCESSING_STARTED'
    
    if (!isProcessing) return
    
    // Lokales Polling mit 3 Sekunden Intervall für schnelle Status-Updates
    // Das globale Polling in datasets-list.tsx läuft alle 5 Sekunden für alle Datasets
    const interval = setInterval(() => {
      checkDatasetStatus(datasetId)
    }, 3000) // Check every 3 seconds

    return () => clearInterval(interval)
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

  // useMemo für filteredFiles um teure Berechnung nur bei Änderungen neu durchzuführen
  const filteredFiles = useMemo(() => {
    if (!dataset) return []
    return dataset.files.filter(file =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [dataset?.files, searchQuery])


  // Wrapper für truncateFileName mit useCallback um Referenz-Stabilität zu gewährleisten
  const truncateFileNameCallback = useCallback((fileName: string, maxLength: number = 35) => {
    return truncateFileName(fileName, { maxLength })
  }, [])

  // useCallback für getFaviconUrl um Referenz-Stabilität zu gewährleisten
  const getFaviconUrl = useCallback((url: string) => {
    return getCachedFaviconUrl(url)
  }, [])

  // useCallback für getUrlDescription - Reine Funktion ohne Side-Effects
  const getUrlDescription = useCallback((url: string): string => {
    // Zuerst aus memoized urlDescriptions (bereits aus Cache geladen)
    if (urlDescriptions[url]) {
      return urlDescriptions[url]
    }
    
    // Dann aus persistentem Cache
    const cached = getCachedUrlDescription(url)
    if (cached) {
      return cached
    }
    
    // Fallback: Domain extrahieren
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return url
    }
  }, [urlDescriptions]) // Dependency auf urlDescriptions da es dort nachgeschlagen wird

  // Fetch OpenGraph descriptions for URLs (nur in useEffect, nie während Rendering)
  useEffect(() => {
    const fetchUrlDescriptions = async () => {
      if (!dataset) return

      const urlFiles = dataset.files.filter(file => 
        file.type === 'url' || file.type === 'text/url' || file.type === 'text/uri-list' || file.extension === 'url'
      )

      // Prüfe welche URLs noch nicht gefetcht wurden
      const urlsToFetch = urlFiles.filter(file => {
        const actualUrl = file.content || file.name
        // Prüfe ob bereits im persistenten Cache
        const cached = getCachedUrlDescription(actualUrl)
        // Prüfe ob bereits im Ref-Cache
        const inRefCache = fetchedDescriptionsRef.current[actualUrl]
        return !cached && !inRefCache
      })

      if (urlsToFetch.length === 0) return

      // Fetch alle URLs parallel mit Promise.allSettled (robust gegen einzelne Fehler)
      const fetchPromises = urlsToFetch.map(async (file) => {
        try {
          const actualUrl = file.content || file.name
          const encodedUrl = encodeURIComponent(actualUrl)
          const response = await fetch(`/api/url/metadata?url=${encodedUrl}`)
          
          if (response.ok) {
            const data = await response.json()
            if (data.description) {
              // Speichere im persistenten Cache
              setUrlDescription(actualUrl, data.description)
              
              return { url: actualUrl, description: data.description }
            }
          }
        } catch (error) {
          console.error(`Failed to fetch metadata for ${file.name}:`, error)
        }
        return null
      })

      // Promise.allSettled verhindert dass ein Fehler alle anderen Requests abbricht
      const results = await Promise.allSettled(fetchPromises)
      
      // Verarbeite Results: nur fulfilled promises mit gültigen Daten
      const newDescriptions = results
        .filter((result): result is PromiseFulfilledResult<{ url: string; description: string } | null> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value)
        .filter((r): r is { url: string; description: string } => r !== null)
      
      // Wenn neue Beschreibungen gefetcht wurden, aktualisiere Ref und triggere Re-Render
      if (newDescriptions.length > 0) {
        // Aktualisiere Ref-Cache (kann während async Operation gemacht werden)
        newDescriptions.forEach(({ url, description }) => {
          fetchedDescriptionsRef.current[url] = description
        })
        
        // Trigger Re-Render durch State-Update (nur in useEffect, nie während Rendering)
        setDescriptionUpdateTrigger(prev => prev + 1)
      }
    }

    fetchUrlDescriptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset?.files])

  // useCallback für Event-Handler um Referenz-Stabilität zu gewährleisten
  const handleDeleteFile = useCallback((fileId: string, fileName: string) => {
    setDeleteFileDialog({
      open: true,
      fileId,
      fileName
    })
  }, []) // Keine Dependencies, da nur State-Setter verwendet werden

  const handleDownloadFile = useCallback(async (fileId: string, fileName: string) => {
    if (!datasetId) return
    
    try {
      await downloadDatasetFile(datasetId, fileId, fileName)
      toast.success('Datei erfolgreich heruntergeladen')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Herunterladen der Datei'
      toast.error(errorMessage)
    }
  }, [datasetId, downloadDatasetFile]) // Dependencies: datasetId und downloadDatasetFile

  const handlePreviewFile = useCallback((fileId: string, fileName: string, fileType?: string, fileExtension?: string) => {
    // Check if file is a PDF
    const isPdf = fileType === 'application/pdf' || fileExtension?.toLowerCase() === 'pdf'
    
    // Check if file is an image
    const ext = fileExtension?.toLowerCase() || fileName.split('.').pop()?.toLowerCase() || ''
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff']
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'ico']
    const isImage = imageTypes.includes(fileType || '') || imageExtensions.includes(ext)
    
    // Check if file is a text or markdown file
    const isTextOrMarkdown = 
      fileType?.startsWith('text/') ||
      fileType === 'application/json' ||
      fileType === 'application/javascript' ||
      fileType === 'application/typescript' ||
      ['txt', 'md', 'markdown', 'json', 'jsonl', 'xml', 'html', 'css', 'js', 'jsx', 'ts', 'tsx', 'csv', 'log', 'sh', 'bash', 'yaml', 'yml'].includes(ext)
    
    if (!isPdf && !isTextOrMarkdown && !isImage) {
      toast.error('Nur PDF-, Bild-, Text- und Markdown-Dateien können in der Vorschau angezeigt werden')
      return
    }
    
    setPreviewFile({ fileId, fileName, fileType, fileExtension })
  }, []) // Keine Dependencies, da nur State-Setter verwendet werden

  const handleProcessDataset = useCallback(async () => {
    if (!dataset) return

    setIsProcessing(true)
    
    // Set status immediately (optimistic update) before API call
    const previousStatus = dataset.processingStatus
    setDatasetProcessingStatus(datasetId, 'DATASET_PROCESSING_STARTED')
    
    try {
      await processDatasets([datasetId])
      toast.success(`Dataset "${dataset.name}" wird verarbeitet.`)
      
      // Check dataset status immediately to get actual API status
      await checkDatasetStatus(datasetId)
    } catch (error) {
      // Revert status on error
      setDatasetProcessingStatus(datasetId, previousStatus || 'DATASET_PROCESSING_INITIATED')
      toast.error(`Verarbeitung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [datasetId, dataset, processDatasets, checkDatasetStatus, setDatasetProcessingStatus]) // Dependencies: datasetId, dataset, processDatasets, checkDatasetStatus, setDatasetProcessingStatus

  // useCallback für weitere Event-Handler um Referenz-Stabilität zu gewährleisten
  const handleNavigateBack = useCallback(() => {
    navigate({ to: '/library/datasets' })
  }, [navigate])

  const handleShowEditDialog = useCallback(() => {
    setShowEditDialog(true)
  }, []) // Keine Dependencies, da nur State-Setter verwendet wird

  const handleShowAddDataDialog = useCallback(() => {
    setShowAddDataDialog(true)
  }, []) // Keine Dependencies, da nur State-Setter verwendet wird

  const needsProcessing = !dataset?.processingStatus || 
                         dataset.processingStatus === 'DATASET_PROCESSING_INITIATED' || 
                         dataset.processingStatus === 'DATASET_PROCESSING_ERRORED'


  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-3 p-4 md:p-3 lg:p-4">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNavigateBack}
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
                onClick={handleShowEditDialog}
              >
                <Edit className="h-3 w-3" />
                <span className="hidden sm:inline">Bearbeiten</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto md:gap-1.5">
            {needsProcessing && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleProcessDataset}
                disabled={isProcessing}
                className="hidden sm:flex md:h-8 md:px-3 md:text-xs"
              >
                {isProcessing ? 'Wird verarbeitet...' : 'Dataset verarbeiten'}
              </Button>
            )}
            <Button size="sm" onClick={handleShowAddDataDialog} className="md:h-7 md:px-2.5 md:text-xs">
              <Upload className="mr-2 h-4 w-4 md:mr-1 md:h-3 md:w-3" />
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
          <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center md:gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground md:h-3 md:w-3" />
              <Input
                placeholder="Dateien durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-8 text-sm md:h-8 md:text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2 md:gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 flex-1 sm:flex-none md:h-8 md:px-3 md:text-xs">
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

              <div className="flex rounded-md border md:h-8">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none h-8 px-2 md:h-8 md:px-2"
                >
                  <Grid className="h-3 w-3" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none h-8 px-2 md:h-8 md:px-2"
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
                <Button size="sm" onClick={() => setShowAddDataDialog(true)} className="md:h-7 md:px-2.5 md:text-xs">
                  <Upload className="mr-2 h-4 w-4 md:mr-1 md:h-3 md:w-3" />
                  Daten hinzufügen
                </Button>
              )}
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid gap-4 sm:gap-5 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
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
                  truncateFileName={truncateFileNameCallback}
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

      {/* Lazy load Preview Sheets nur wenn geöffnet */}
      {previewFile && (() => {
        const isPdf = previewFile.fileType === 'application/pdf' || previewFile.fileExtension?.toLowerCase() === 'pdf'
        
        const ext = previewFile.fileExtension?.toLowerCase() || previewFile.fileName.split('.').pop()?.toLowerCase() || ''
        const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff']
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'ico']
        const isImage = imageTypes.includes(previewFile.fileType || '') || imageExtensions.includes(ext)
        
        if (isPdf) {
          return (
            <Suspense fallback={
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">PDF-Viewer wird geladen...</p>
                </div>
              </div>
            }>
              <PdfPreviewSheet
                open={!!previewFile}
                onOpenChange={(open) => !open && setPreviewFile(null)}
                fileId={previewFile?.fileId ?? ''}
                fileName={previewFile?.fileName ?? ''}
                datasetId={datasetId}
              />
            </Suspense>
          )
        } else if (isImage) {
          return (
            <Suspense fallback={
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Bild-Vorschau wird geladen...</p>
                </div>
              </div>
            }>
              <ImagePreviewSheet
                open={!!previewFile}
                onOpenChange={(open) => !open && setPreviewFile(null)}
                fileId={previewFile?.fileId ?? ''}
                fileName={previewFile?.fileName ?? ''}
                datasetId={datasetId}
              />
            </Suspense>
          )
        } else {
          return (
            <Suspense fallback={
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Vorschau wird geladen...</p>
                </div>
              </div>
            }>
              <TextMarkdownPreviewSheet
                open={!!previewFile}
                onOpenChange={(open) => !open && setPreviewFile(null)}
                fileId={previewFile?.fileId ?? ''}
                fileName={previewFile?.fileName ?? ''}
                datasetId={datasetId}
                fileType={previewFile?.fileType}
                fileExtension={previewFile?.fileExtension}
              />
            </Suspense>
          )
        }
      })()}
    </div>
  )
}
