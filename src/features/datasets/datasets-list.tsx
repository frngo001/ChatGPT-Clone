import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useCallback } from 'react'
import { useDatasetStore } from '@/stores/dataset-store'
import { usePermissionsStore } from '@/stores/permissions-store'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FolderOpen, Plus, Grid, List, Search } from 'lucide-react'
import { CreateDatasetDialog } from './components/create-dataset-dialog'
import { DeleteDatasetDialog } from './components/delete-dataset-dialog'
import { ShareDatasetDialog } from './components/share-dataset-dialog'
import { useDatasetFilters } from './hooks/use-dataset-filters'
import { DatasetFilters } from './components/dataset-filters'
import { DatasetCard } from './components/dataset-card'
import { canShareDataset } from '@/lib/permissions-helper'

export function DatasetsPage() {
  const navigate = useNavigate()
  // Selektive Selektoren für optimale Performance - verhindert unnötige Re-renders
  const datasets = useDatasetStore((state) => state.datasets)
  const fetchDatasets = useDatasetStore((state) => state.fetchDatasets)
  const startStatusPolling = useDatasetStore((state) => state.startStatusPolling)
  const stopStatusPolling = useDatasetStore((state) => state.stopStatusPolling)
  const { users, fetchAllUsers } = usePermissionsStore()
  const { auth } = useAuthStore()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    datasetId: string
    datasetName: string
    filesCount: number
  }>({
    open: false,
    datasetId: '',
    datasetName: '',
    filesCount: 0
  })
  const [shareDialog, setShareDialog] = useState<{
    open: boolean
    datasetId: string
    datasetName: string
  }>({
    open: false,
    datasetId: '',
    datasetName: ''
  })

  // Use filter hook
  const {
    searchQuery,
    selectedTags,
    statusFilter,
    ownerFilter,
    createdFrom,
    createdTo,
    updatedFrom,
    updatedTo,
    allTags,
    allStatuses,
    allOwners,
    filteredDatasets,
    setSearchQuery,
    toggleTag,
    handleStatusChange,
    handleOwnerChange,
    setCreatedFrom,
    setCreatedTo,
    setUpdatedFrom,
    setUpdatedTo,
    clearFilters,
    hasActiveFilters
  } = useDatasetFilters({ datasets, users })

  // useCallback für Event-Handler um unnötige Re-renders zu vermeiden
  const handleDeleteDataset = useCallback((datasetId: string, datasetName: string, filesCount: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteDialog({
      open: true,
      datasetId,
      datasetName,
      filesCount
    })
  }, []) // Keine Dependencies, da nur State-Setter verwendet werden

  const handleShareDataset = useCallback((datasetId: string, datasetName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setShareDialog({
      open: true,
      datasetId,
      datasetName
    })
  }, []) // Keine Dependencies, da nur State-Setter verwendet werden

  // Lade Datasets beim Start
  // Request-Deduplizierung: Nur fetchen wenn noch keine Datasets vorhanden sind
  useEffect(() => {
    const loadData = async () => {
      // Skip Fetch wenn bereits Datasets vorhanden (verhindert duplizierte Calls)
      if (datasets.length > 0) {
        // Starte Polling falls nötig, aber skip Fetch
        startStatusPolling()
        return
      }
      
      try {
        await fetchDatasets()
        // Starte Status-Polling (läuft nur wenn Datasets verarbeitet werden)
        startStatusPolling()
      } catch (error) {
        console.error('Failed to fetch datasets:', error)
      }
    }
    
    loadData()
    
    // Cleanup beim Unmount
    return () => {
      stopStatusPolling()
    }
  }, [datasets.length, fetchDatasets, startStatusPolling, stopStatusPolling])

  // Starte/Stoppe Polling basierend auf verarbeitenden Datasets
  useEffect(() => {
    const hasProcessingDatasets = datasets.some(dataset => 
      dataset.processingStatus === 'DATASET_PROCESSING_STARTED'
    )
    
    if (hasProcessingDatasets) {
      startStatusPolling()
    } else {
      // Optional: Polling stoppen wenn keine Datasets verarbeitet werden
      // stopStatusPolling()
    }
  }, [datasets, startStatusPolling, stopStatusPolling])

  // Lade User-Daten beim Start
  useEffect(() => {
    if (users.length === 0) {
      fetchAllUsers().catch(error => {
        console.error('Failed to fetch users:', error)
      })
    }
  }, [users.length, fetchAllUsers])

  // useMemo für Hilfsfunktionen die in vielen DatasetCards verwendet werden
  const getOwnerName = useCallback((ownerId: string | undefined) => {
    if (!ownerId) return 'Unbekannt'
    const owner = users.find(user => user.id === ownerId)
    return owner ? owner.email : 'Unbekannt'
  }, [users])

  // formatDate is now imported from '@/lib/utils'

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-5 md:p-4 lg:p-8">
      {/* Header */}
      <div className="flex-none mb-4 md:mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <h1 className="text-base md:text-lg font-semibold">
            Datasets
          </h1>
          <Button 
            onClick={() => setCreateDialogOpen(true)} 
            className="shrink-0 md:h-8 md:px-3 md:text-xs"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2 md:h-3 md:w-3 md:mr-1" />
            <span className="hidden sm:inline">Neues Dataset</span>
            <span className="sm:hidden">Dataset erstellen</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Verwalten Sie Ihre Datasets und Dateien
        </p>
        {datasets.length > 0 && (
          <p className="text-xs text-muted-foreground pt-1">
            {filteredDatasets.length} von {datasets.length} {datasets.length === 1 ? 'Dataset' : 'Datasets'}
            {hasActiveFilters && ' gefunden'}
          </p>
        )}
      </div>

      {/* Suchleiste und Filter */}
      {datasets.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <DatasetFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedTags={selectedTags}
              toggleTag={toggleTag}
              allTags={allTags}
              statusFilter={statusFilter}
              handleStatusChange={handleStatusChange}
              allStatuses={allStatuses}
              ownerFilter={ownerFilter}
              handleOwnerChange={handleOwnerChange}
              allOwners={allOwners}
              createdFrom={createdFrom}
              createdTo={createdTo}
              updatedFrom={updatedFrom}
              updatedTo={updatedTo}
              setCreatedFrom={setCreatedFrom}
              setCreatedTo={setCreatedTo}
              setUpdatedFrom={setUpdatedFrom}
              setUpdatedTo={setUpdatedTo}
              hasActiveFilters={hasActiveFilters}
              clearFilters={clearFilters}
            />
          </div>
          
          {/* View Toggle */}
        <div className="flex rounded-lg border md:h-8">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
            <Grid className="h-4 w-4 md:h-3 md:w-3" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
            <List className="h-4 w-4 md:h-3 md:w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Datasets Grid/List */}
      {datasets.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20 px-4">
            <div className="mx-auto mb-6 h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted flex items-center justify-center">
              <FolderOpen className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center">
              Keine Datasets vorhanden
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 text-center max-w-sm px-4">
              Erstellen Sie Ihr erstes Dataset, um Dateien hochzuladen und zu organisieren
            </p>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              size="lg"
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Dataset erstellen
            </Button>
          </CardContent>
        </Card>
      ) : filteredDatasets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Ergebnisse gefunden</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              Keine Datasets entsprechen Ihren Such- und Filterkriterien
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Filter zurücksetzen
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 md:gap-5">
          {filteredDatasets.map((dataset) => {
            const ownerName = getOwnerName(dataset.ownerId)
            const canShare = canShareDataset(auth.user, dataset)
            
            return (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                ownerName={ownerName}
                onClick={() => navigate({ to: `/library/datasets/${dataset.id}` })}
                onDelete={(e) => handleDeleteDataset(dataset.id, dataset.name, dataset.files.length, e)}
                onShare={canShare ? (e) => handleShareDataset(dataset.id, dataset.name, e) : undefined}
                showShareButton={canShare}
              />
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDatasets.map((dataset) => {
            const ownerName = getOwnerName(dataset.ownerId)
            const canShare = canShareDataset(auth.user, dataset)
            
            return (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                ownerName={ownerName}
                onClick={() => navigate({ to: `/library/datasets/${dataset.id}` })}
                onDelete={(e) => handleDeleteDataset(dataset.id, dataset.name, dataset.files.length, e)}
                onShare={canShare ? (e) => handleShareDataset(dataset.id, dataset.name, e) : undefined}
                showShareButton={canShare}
                variant="list"
              />
            )
          })}
        </div>
      )}

      <CreateDatasetDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <DeleteDatasetDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        dataset={{
          id: deleteDialog.datasetId,
          name: deleteDialog.datasetName,
          filesCount: deleteDialog.filesCount
        }}
      />

      <ShareDatasetDialog
        open={shareDialog.open}
        onOpenChange={(open) => setShareDialog(prev => ({ ...prev, open }))}
        datasetId={shareDialog.datasetId}
        datasetName={shareDialog.datasetName}
      />
    </div>
  )
}

