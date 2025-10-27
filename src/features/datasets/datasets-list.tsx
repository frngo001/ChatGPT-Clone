import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useDatasetStore } from '@/stores/dataset-store'
import { usePermissionsStore } from '@/stores/permissions-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { FolderOpen, Plus, FileText, User, Calendar, Clock, Search, Filter, Grid, List } from 'lucide-react'
import { CreateDatasetDialog } from './components/create-dataset-dialog'
import { ProcessingStatusBadge } from './components/processing-status-badge'

export function DatasetsPage() {
  const navigate = useNavigate()
  const { datasets, fetchDatasets, startStatusPolling, stopStatusPolling } = useDatasetStore()
  const { users, fetchAllUsers } = usePermissionsStore()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

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

  // Filtere Datasets basierend auf Suchbegriff
  const filteredDatasets = datasets.filter(dataset => {
    const searchLower = searchQuery.toLowerCase()
    return (
      dataset.name.toLowerCase().includes(searchLower) ||
      (dataset.description && dataset.description.toLowerCase().includes(searchLower)) ||
      getOwnerName(dataset.ownerId).toLowerCase().includes(searchLower)
    )
  })

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
              {searchQuery && ' gefunden'}
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
        <div className="flex items-center gap-2">
          {/* Suchfeld */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Dateien durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter Button */}
          <Button variant="outline" size="default">
            <Filter className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Filter</span>
          </Button>

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
              Keine Datasets entsprechen Ihrer Suche nach "{searchQuery}"
            </p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Suche zurücksetzen
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
          {filteredDatasets.map((dataset) => {
            const ownerName = getOwnerName(dataset.ownerId)
            
            return (
              <Card
                key={dataset.id}
                className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200 relative"
                onClick={() => navigate({ to: `/library/datasets/${dataset.id}` })}
              >
                <div className="p-3">
                  {/* Header: Icon, Titel und Status */}
                  <div className="flex items-start gap-2 mb-2">
                    <div className="h-8 w-8 rounded bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 group-hover:from-primary/30 group-hover:to-primary/20 transition-colors">
                      <FolderOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate leading-tight mb-0.5" title={dataset.name}>
                        {dataset.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground truncate" title={dataset.description || 'Keine Beschreibung'}>
                        {dataset.description || 'Keine Beschreibung'}
                      </p>
                    </div>
                    {dataset.processingStatus && (
                      <div className="shrink-0">
                        <ProcessingStatusBadge status={dataset.processingStatus} className="text-[9px] px-1.5 py-0.5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Dateien-Count */}
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2">
                    <FileText className="h-3 w-3 shrink-0" />
                    <span>{dataset.files.length} {dataset.files.length === 1 ? 'Datei' : 'Dateien'}</span>
                  </div>

                  {/* Owner */}
                  <div className="flex items-center gap-1 mb-2">
                    <User className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground truncate" title={ownerName}>
                      {ownerName}
                    </span>
                  </div>

                  {/* Datums-Informationen */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t pt-2 gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span className="truncate">{formatDate(dataset.createdAt)}</span>
                    </div>
                    {dataset.updatedAt && (
                      <div className="flex items-center gap-1 min-w-0">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="truncate">{formatDate(dataset.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDatasets.map((dataset) => {
            const ownerName = getOwnerName(dataset.ownerId)
            
            return (
              <Card
                key={dataset.id}
                className="group cursor-pointer hover:shadow-md hover:border-primary/50 transition-all duration-200"
                onClick={() => navigate({ to: `/library/datasets/${dataset.id}` })}
              >
                <div className="p-3 flex items-center gap-3">
                  {/* Icon */}
                  <div className="h-10 w-10 rounded bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 group-hover:from-primary/30 group-hover:to-primary/20 transition-colors">
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>

                  {/* Name & Beschreibung */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate" title={dataset.name}>
                      {dataset.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate" title={dataset.description || 'Keine Beschreibung'}>
                      {dataset.description || 'Keine Beschreibung'}
                    </p>
                  </div>

                  {/* Statistik */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">{dataset.files.length} {dataset.files.length === 1 ? 'Datei' : 'Dateien'}</span>
                    <span className="sm:hidden">{dataset.files.length}</span>
                  </div>

                  {/* Owner */}
                  <Badge variant="outline" className="text-xs px-2 py-0.5 max-w-[150px] shrink-0 hidden md:flex">
                    <User className="h-3 w-3 mr-1 shrink-0" />
                    <span className="truncate" title={ownerName}>{ownerName}</span>
                  </Badge>

                  {/* Datum */}
                  <div className="text-xs text-muted-foreground shrink-0 hidden lg:block">
                    {formatDate(dataset.createdAt)}
                  </div>

                  {/* Status Badge */}
                  {dataset.processingStatus && (
                    <div className="shrink-0">
                      <ProcessingStatusBadge status={dataset.processingStatus} className="text-[10px]" />
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <CreateDatasetDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}

