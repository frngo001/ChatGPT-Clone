import { useState, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Upload, Download, Trash2, Eye, Edit, Search, Filter, Grid, List } from 'lucide-react'
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

export function DatasetDetailPage() {
  const { datasetId } = useParams({ from: '/_authenticated/library/datasets/$datasetId' })
  const navigate = useNavigate()
  const { getDatasetById, fetchDatasetData, processDatasets, checkDatasetStatus } = useDatasetStore()
  const [showAddDataDialog, setShowAddDataDialog] = useState(false)
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

  const dataset = getDatasetById(datasetId)

  // Fetch dataset data when component mounts
  useEffect(() => {
    if (datasetId) {
      fetchDatasetData(datasetId).catch((error) => {
        console.error('Failed to fetch dataset data:', error)
        toast.error('Fehler beim Laden der Dataset-Dateien')
      })
    }
  }, [datasetId, fetchDatasetData])

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


  const truncateFileName = (fileName: string, maxLength: number = 30) => {
    if (fileName.length <= maxLength) return fileName
    const extension = fileName.split('.').pop()
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'))
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension!.length - 4) + '...'
    return `${truncatedName}.${extension}`
  }

  const handleDeleteFile = (fileId: string, fileName: string) => {
    setDeleteFileDialog({
      open: true,
      fileId,
      fileName
    })
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <h1 className="text-lg sm:text-xl font-bold truncate">{dataset.name}</h1>
            <div className="flex items-center gap-2">
              <ProcessingStatusBadge status={dataset.processingStatus} />
              <Button variant="outline" size="sm" className="h-7 text-xs w-fit">
                <Edit className="mr-1 h-3 w-3" />
                <span className="hidden sm:inline">Bearbeiten</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            </div>
          </div>
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
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {needsProcessing && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleProcessDataset}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              {isProcessing ? 'Wird verarbeitet...' : 'Dataset verarbeiten'}
            </Button>
          )}
          <Button size="sm" onClick={() => setShowAddDataDialog(true)} className="w-full sm:w-auto">
            <Upload className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Daten hinzufügen</span>
            <span className="sm:hidden">Hinzufügen</span>
          </Button>
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
                ? 'grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : 'space-y-2'
            }>
              {filteredFiles.map((file) => (
                viewMode === 'grid' ? (
                  <Card
                    key={file.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm" title={file.name}>{truncateFileName(file.name)}</CardTitle>
                          <CardDescription className="mt-1 text-xs">
                            {file.type}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                                ⋯
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-3 w-3" />
                                Herunterladen
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteFile(file.id, file.name)}>
                                <Trash2 className="mr-2 h-3 w-3" />
                                Löschen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{file.extension?.toUpperCase() || 'UNKNOWN'}</span>
                        <span>{formatDate(file.uploadDate)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" title={file.name}>{truncateFileName(file.name)}</div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Download className="h-3 w-3" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            ⋯
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteFile(file.id, file.name)}>
                            <Trash2 className="mr-2 h-3 w-3" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
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
          fetchDatasetData(datasetId).catch((error) => {
            console.error('Failed to refresh dataset data:', error)
          })
        }}
      />
    </div>
  )
}
