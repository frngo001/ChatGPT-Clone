import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Plus, Search, Filter, Grid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useDatasetStore } from '@/stores/dataset-store'
import { useToast } from '@/hooks/use-sonner-toast'
import { CreateDatasetDialog } from './components/create-dataset-dialog'
import { DeleteDatasetDialog } from './components/delete-dataset-dialog'
import { DatasetDetailPage } from './dataset-detail'
import { ProcessingStatusBadge } from './components/processing-status-badge'

export { DatasetDetailPage }

export function DatasetsPage() {
  const navigate = useNavigate()
  const { datasets, searchDatasets, fetchDatasets, isLoading, error, processDatasets, getUnprocessedDatasets, startStatusPolling, stopStatusPolling } = useDatasetStore()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [datasetToDelete, setDatasetToDelete] = useState<{
    id: string
    name: string
    filesCount: number
  } | null>(null)

  // Fetch datasets on component mount
  useEffect(() => {
    fetchDatasets().catch((error) => {
      console.error('Failed to fetch datasets:', error)
      // Don't show error to user if it's just a network issue
      // The error state will be handled by the store
    })
  }, [fetchDatasets])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopStatusPolling()
    }
  }, [stopStatusPolling])

  const filteredDatasets = searchQuery ? searchDatasets(searchQuery) : datasets

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (isNaN(dateObj.getTime())) {
        return 'Unbekannt'
      }
      return new Intl.DateTimeFormat('de-DE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(dateObj)
    } catch (error) {
      console.error('Date formatting error:', error, date)
      return 'Unbekannt'
    }
  }


  const handleDatasetClick = (datasetId: string) => {
    navigate({ to: `/library/datasets/${datasetId}` })
  }

  const handleDeleteDataset = (dataset: { id: string; name: string; filesCount: number }, event: React.MouseEvent) => {
    event.stopPropagation()
    setDatasetToDelete(dataset)
    setShowDeleteDialog(true)
  }

  const handleDeleteSuccess = () => {
    toast({
      title: "Dataset gelöscht",
      description: `Das Dataset "${datasetToDelete?.name}" wurde erfolgreich gelöscht.`,
      variant: "success",
    })
    setDatasetToDelete(null)
  }

  const handleProcessAll = async () => {
    const unprocessedDatasets = getUnprocessedDatasets()
    if (unprocessedDatasets.length === 0) {
      toast({
        title: "Keine Datasets zu verarbeiten",
        description: "Alle Datasets sind bereits verarbeitet oder werden gerade verarbeitet.",
        variant: "info",
      })
      return
    }

    setIsProcessing(true)
    try {
      const datasetIds = unprocessedDatasets.map(dataset => dataset.id)
      await processDatasets(datasetIds)
      
      toast({
        title: "Verarbeitung gestartet",
        description: `${unprocessedDatasets.length} Dataset${unprocessedDatasets.length !== 1 ? 's' : ''} werden verarbeitet.`,
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Verarbeitung fehlgeschlagen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "error",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const unprocessedDatasets = getUnprocessedDatasets()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Datasets</h1>
          <p className="text-sm text-muted-foreground">
            Verwalten Sie Ihre Datasets und Dateien
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unprocessedDatasets.length > 0 && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleProcessAll}
              disabled={isProcessing}
            >
              {isProcessing ? 'Wird verarbeitet...' : `Alle verarbeiten (${unprocessedDatasets.length})`}
            </Button>
          )}
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Neues Dataset
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Datasets durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-sm"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="mr-1 h-3 w-3" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Alle Datasets</DropdownMenuItem>
            <DropdownMenuItem>Zuletzt erstellt</DropdownMenuItem>
            <DropdownMenuItem>Meiste Dateien</DropdownMenuItem>
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

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
          <strong>Fehler:</strong> {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Lade Datasets...</div>
        </div>
      )}

      {/* Datasets Grid/List */}
      {!isLoading && filteredDatasets.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">Keine Datasets gefunden</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'Versuchen Sie, Ihre Suchbegriffe anzupassen.' : 'Erstellen Sie Ihr erstes Dataset, um zu beginnen.'}
            </p>
            {!searchQuery && (
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Dataset erstellen
              </Button>
            )}
          </div>
        </div>
      ) : !isLoading ? (
        <div className={
          viewMode === 'grid'
            ? 'grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'space-y-3'
        }>
          {filteredDatasets.map((dataset) => (
            <Card
              key={dataset.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => handleDatasetClick(dataset.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{dataset.name}</CardTitle>
                    <CardDescription className="mt-1 text-sm">
                      {dataset.description}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                        ⋯
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Bearbeiten</DropdownMenuItem>
                      <DropdownMenuItem>Duplizieren</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => handleDeleteDataset({
                          id: dataset.id,
                          name: dataset.name,
                          filesCount: dataset.files.length
                        }, e)}
                      >
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {/* Tags */}
                  {dataset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {dataset.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {dataset.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{dataset.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <Separator />

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{dataset.files.length} Dateien</span>
                    <span>{formatDate(dataset.createdAt)}</span>
                  </div>

                  {/* Processing Status */}
                  <div className="mt-2">
                    <ProcessingStatusBadge status={dataset.processingStatus} />
                  </div>

                  {/* File preview */}
                  {dataset.files.length > 0 && (
                    <div className="space-y-1">
                      {dataset.files.slice(0, 3).map((file) => (
                        <div key={file.id} className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="truncate text-xs">{file.name}</span>
                          <span className="text-xs">{file.extension?.toUpperCase() || 'UNKNOWN'}</span>
                        </div>
                      ))}
                      {dataset.files.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dataset.files.length - 3} weitere Dateien
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <CreateDatasetDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {datasetToDelete && (
        <DeleteDatasetDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          dataset={datasetToDelete}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  )
}
