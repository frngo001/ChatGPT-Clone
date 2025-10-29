import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useDatasetStore } from '@/stores/dataset-store'
import { usePermissionsStore } from '@/stores/permissions-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FolderOpen, Plus, Grid, List, Search } from 'lucide-react'
import { CreateDatasetDialog } from './components/create-dataset-dialog'
import { DeleteDatasetDialog } from './components/delete-dataset-dialog'
import { useDatasetFilters } from './hooks/use-dataset-filters'
import { DatasetFilters } from './components/dataset-filters'
import { DatasetCard } from './components/dataset-card'

export function DatasetsPage() {
  const navigate = useNavigate()
  const { datasets, fetchDatasets, startStatusPolling, stopStatusPolling } = useDatasetStore()
  const { users, fetchAllUsers } = usePermissionsStore()
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

  const handleDeleteDataset = (datasetId: string, datasetName: string, filesCount: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteDialog({
      open: true,
      datasetId,
      datasetName,
      filesCount
    })
  }

  // Lade Datasets beim Start
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchDatasets()
        startStatusPolling() // Starte Status-Polling
      } catch (error) {
        console.error('Failed to fetch datasets:', error)
      }
    }
    
    loadData()
    
    // Cleanup beim Unmount
    return () => {
      stopStatusPolling()
    }
  }, [fetchDatasets, startStatusPolling, stopStatusPolling])

  // Lade User-Daten beim Start
  useEffect(() => {
    if (users.length === 0) {
      fetchAllUsers().catch(error => {
        console.error('Failed to fetch users:', error)
      })
    }
  }, [users.length, fetchAllUsers])

  // Hilfsfunktion: Finde Owner-Namen basierend auf ownerId
  const getOwnerName = (ownerId: string | undefined) => {
    if (!ownerId) return 'Unbekannt'
    const owner = users.find(user => user.id === ownerId)
    return owner ? owner.email : 'Unbekannt'
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Unbekannt'
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      
      // Prüfen, ob das Datum gültig ist
      if (isNaN(dateObj.getTime())) {
        return 'Unbekannt'
      }
      
      return new Intl.DateTimeFormat('de-DE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(dateObj)
    } catch {
      return 'Unbekannt'
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Datasets
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Verwalten Sie Ihre Datasets und Dateien
          </p>
          {datasets.length > 0 && (
            <p className="text-xs sm:text-sm text-muted-foreground pt-1">
              {filteredDatasets.length} von {datasets.length} {datasets.length === 1 ? 'Dataset' : 'Datasets'}
              {hasActiveFilters && ' gefunden'}
            </p>
          )}
        </div>
        <Button 
          onClick={() => setCreateDialogOpen(true)} 
          className="w-full sm:w-auto shrink-0"
          size="default"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Neues Dataset</span>
          <span className="sm:hidden">Dataset erstellen</span>
        </Button>
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
          <div className="flex rounded-lg border">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
          {filteredDatasets.map((dataset) => {
            const ownerName = getOwnerName(dataset.ownerId)
            
            return (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                ownerName={ownerName}
                onClick={() => navigate({ to: `/library/datasets/${dataset.id}` })}
                onDelete={(e) => handleDeleteDataset(dataset.id, dataset.name, dataset.files.length, e)}
              />
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDatasets.map((dataset) => {
            const ownerName = getOwnerName(dataset.ownerId)
            
            return (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                ownerName={ownerName}
                onClick={() => navigate({ to: `/library/datasets/${dataset.id}` })}
                onDelete={(e) => handleDeleteDataset(dataset.id, dataset.name, dataset.files.length, e)}
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
    </div>
  )
}

