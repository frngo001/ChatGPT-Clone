import { Search, X, Check } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { DatePicker } from '@/components/date-picker'

interface DatasetFiltersProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedTags: string[]
  toggleTag: (tag: string) => void
  allTags: string[]
  statusFilter: string | null
  handleStatusChange: (value: string) => void
  allStatuses: string[]
  ownerFilter: string | null
  handleOwnerChange: (value: string) => void
  allOwners: Array<{ id: string; email: string }>
  createdFrom: Date | null
  createdTo: Date | null
  updatedFrom: Date | null
  updatedTo: Date | null
  setCreatedFrom: (date: Date | null) => void
  setCreatedTo: (date: Date | null) => void
  setUpdatedFrom: (date: Date | null) => void
  setUpdatedTo: (date: Date | null) => void
  hasActiveFilters: boolean
  clearFilters: () => void
}

export function DatasetFilters({
  searchQuery,
  setSearchQuery,
  selectedTags,
  toggleTag,
  allTags,
  statusFilter,
  handleStatusChange,
  allStatuses,
  ownerFilter,
  handleOwnerChange,
  allOwners,
  createdFrom,
  createdTo,
  updatedFrom,
  updatedTo,
  setCreatedFrom,
  setCreatedTo,
  setUpdatedFrom,
  setUpdatedTo,
  hasActiveFilters,
  clearFilters
}: DatasetFiltersProps) {
  
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'DATASET_PROCESSING_INITIATED': 'Initiert',
      'DATASET_PROCESSING_STARTED': 'In Verarbeitung',
      'DATASET_PROCESSING_COMPLETED': 'Abgeschlossen',
      'DATASET_PROCESSING_ERRORED': 'Fehlgeschlagen'
    }
    return statusMap[status] || status
  }
  
  const getOwnerName = (ownerId: string) => {
    const owner = allOwners.find(o => o.id === ownerId)
    return owner ? owner.email : 'Unbekannt'
  }
  
  return (
    <div className="space-y-3 md:space-y-2">
      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground md:h-3 md:w-3" />
        <Input
          placeholder="Datasets durchsuchen (Name, Beschreibung, Tags)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 md:h-9 md:text-sm"
        />
      </div>
      
      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-2 w-full">
        {/* Tag Multi-Select (Popover with Checkboxes) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full sm:w-auto md:h-8 md:px-3 md:text-xs">
              Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Tags suchen..." />
              <CommandEmpty>Keine Tags gefunden</CommandEmpty>
              <CommandGroup>
                {allTags.map(tag => (
                  <CommandItem 
                    key={tag} 
                    onSelect={() => toggleTag(tag)}
                    className="cursor-pointer"
                  >
                    <Check 
                      className={`mr-2 h-4 w-4 ${selectedTags.includes(tag) ? 'opacity-100' : 'opacity-0'}`} 
                    />
                    {tag}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        
        {/* Status Filter */}
        <Select value={statusFilter || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px] md:h-8 md:text-xs md:px-2">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            {allStatuses.map(status => (
              <SelectItem key={status} value={status}>
                {getStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Owner Filter */}
        <Select value={ownerFilter || 'all'} onValueChange={handleOwnerChange}>
          <SelectTrigger className="w-full sm:w-[180px] md:h-8 md:text-xs md:px-2">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Owners</SelectItem>
            {allOwners.map(owner => (
              <SelectItem key={owner.id} value={owner.id}>
                {owner.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Date Filters - Collapsible in Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full sm:w-auto md:h-8 md:px-3 md:text-xs">
              Datum
              {(createdFrom || createdTo || updatedFrom || updatedTo) && (
                <Badge variant="secondary" className="ml-1 h-4 px-1">
                  {[createdFrom, createdTo, updatedFrom, updatedTo].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-4 md:p-3" align="start">
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium mb-2 block">Erstellt</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <DatePicker
                    selected={createdFrom || undefined}
                    onSelect={(date) => setCreatedFrom(date || null)}
                    placeholder="Von"
                  />
                  <DatePicker
                    selected={createdTo || undefined}
                    onSelect={(date) => setCreatedTo(date || null)}
                    placeholder="Bis"
                  />
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-xs font-medium mb-2 block">Aktualisiert</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <DatePicker
                    selected={updatedFrom || undefined}
                    onSelect={(date) => setUpdatedFrom(date || null)}
                    placeholder="Von"
                  />
                  <DatePicker
                    selected={updatedTo || undefined}
                    onSelect={(date) => setUpdatedTo(date || null)}
                    placeholder="Bis"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full sm:w-auto md:h-8 md:px-3 md:text-xs">
            <X className="h-4 w-4 mr-1" />
            Zurücksetzen
          </Button>
        )}
      </div>
      
      {/* Active Filters Badges */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Aktive Filter:</span>
          {searchQuery && (
            <Badge variant="secondary" className="text-xs">
              Suche: "{searchQuery}"
            </Badge>
          )}
          {selectedTags.map(tag => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="text-xs cursor-pointer" 
              onClick={() => toggleTag(tag)}
            >
              {tag} ×
            </Badge>
          ))}
          {statusFilter && (
            <Badge variant="secondary" className="text-xs">
              Status: {getStatusLabel(statusFilter)}
            </Badge>
          )}
          {ownerFilter && (
            <Badge variant="secondary" className="text-xs">
              Owner: {getOwnerName(ownerFilter)}
            </Badge>
          )}
          {createdFrom && (
            <Badge variant="secondary" className="text-xs">
              Erstellt ab: {format(createdFrom, 'dd.MM.yyyy', { locale: de })}
            </Badge>
          )}
          {createdTo && (
            <Badge variant="secondary" className="text-xs">
              Erstellt bis: {format(createdTo, 'dd.MM.yyyy', { locale: de })}
            </Badge>
          )}
          {updatedFrom && (
            <Badge variant="secondary" className="text-xs">
              Aktualisiert ab: {format(updatedFrom, 'dd.MM.yyyy', { locale: de })}
            </Badge>
          )}
          {updatedTo && (
            <Badge variant="secondary" className="text-xs">
              Aktualisiert bis: {format(updatedTo, 'dd.MM.yyyy', { locale: de })}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

