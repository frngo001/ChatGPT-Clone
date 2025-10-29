import { useMemo, useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { Dataset } from '@/stores/dataset-store'
import { useDatasetStore } from '@/stores/dataset-store'

interface UseDatasetFiltersParams {
  datasets: Dataset[]
  users: Array<{ id: string; email: string }>
}

export const useDatasetFilters = ({ datasets, users }: UseDatasetFiltersParams) => {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as Record<string, unknown>
  
  // Get filter state from store
  const { filterState, setFilterState } = useDatasetStore()
  
  // Extract filter values from URL (URL takes precedence if present)
  const searchQuery = (search.q as string) || filterState.searchQuery
  const selectedTags = (Array.isArray(search.tags) ? search.tags as string[] : filterState.selectedTags)
  const statusFilter = (search.status as string) || filterState.statusFilter
  const ownerFilter = (search.owner as string) || filterState.ownerFilter
  
  // Extract date filters from URL (as ISO strings)
  const createdFrom = search.createdFrom ? new Date(search.createdFrom as string) : (filterState.createdFrom ? new Date(filterState.createdFrom) : null)
  const createdTo = search.createdTo ? new Date(search.createdTo as string) : (filterState.createdTo ? new Date(filterState.createdTo) : null)
  const updatedFrom = search.updatedFrom ? new Date(search.updatedFrom as string) : (filterState.updatedFrom ? new Date(filterState.updatedFrom) : null)
  const updatedTo = search.updatedTo ? new Date(search.updatedTo as string) : (filterState.updatedTo ? new Date(filterState.updatedTo) : null)
  
  // Sync filter state to store
  useEffect(() => {
    const urlSearchQuery = (search.q as string) || ''
    const urlSelectedTags = Array.isArray(search.tags) ? search.tags as string[] : []
    const urlStatusFilter = (search.status as string) || null
    const urlOwnerFilter = (search.owner as string) || null
    const urlCreatedFrom = search.createdFrom as string || null
    const urlCreatedTo = search.createdTo as string || null
    const urlUpdatedFrom = search.updatedFrom as string || null
    const urlUpdatedTo = search.updatedTo as string || null
    
    setFilterState({
      searchQuery: urlSearchQuery,
      selectedTags: urlSelectedTags,
      statusFilter: urlStatusFilter,
      ownerFilter: urlOwnerFilter,
      createdFrom: urlCreatedFrom,
      createdTo: urlCreatedTo,
      updatedFrom: urlUpdatedFrom,
      updatedTo: urlUpdatedTo,
    })
  }, [search.q, search.tags, search.status, search.owner, search.createdFrom, search.createdTo, search.updatedFrom, search.updatedTo, setFilterState])
  
  // Get all unique tags from all datasets
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    datasets.forEach(dataset => {
      dataset.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [datasets])
  
  // Get all unique processing statuses
  const allStatuses = useMemo(() => {
    const statusSet = new Set<string>()
    datasets.forEach(dataset => {
      if (dataset.processingStatus) {
        statusSet.add(dataset.processingStatus)
      }
    })
    return Array.from(statusSet).sort()
  }, [datasets])
  
  // Get all unique owners
  const allOwners = useMemo(() => {
    const ownerMap = new Map<string, string>()
    datasets.forEach(dataset => {
      if (dataset.ownerId) {
        const user = users.find(u => u.id === dataset.ownerId)
        if (user) {
          ownerMap.set(dataset.ownerId, user.email)
        }
      }
    })
    return Array.from(ownerMap.entries()).map(([id, email]) => ({ id, email }))
  }, [datasets, users])
  
  // Apply filters
  const filteredDatasets = useMemo(() => {
    return datasets.filter(dataset => {
      // Search filter (name, description, tags)
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase()
        const matchesName = dataset.name.toLowerCase().includes(queryLower)
        const matchesDescription = dataset.description?.toLowerCase().includes(queryLower)
        const matchesTags = dataset.tags?.some(tag => tag.toLowerCase().includes(queryLower))
        
        if (!matchesName && !matchesDescription && !matchesTags) {
          return false
        }
      }
      
      // Tag filter (AND logic - all selected tags must be present)
      if (selectedTags.length > 0) {
        const hasAllTags = selectedTags.every(tag => dataset.tags?.includes(tag))
        if (!hasAllTags) {
          return false
        }
      }
      
      // Status filter
      if (statusFilter) {
        if (dataset.processingStatus !== statusFilter) {
          return false
        }
      }
      
      // Owner filter
      if (ownerFilter) {
        if (dataset.ownerId !== ownerFilter) {
          return false
        }
      }
      
      // Created date filter
      if (createdFrom && dataset.createdAt) {
        const datasetDate = new Date(dataset.createdAt)
        const filterDate = new Date(createdFrom)
        // Reset to start of day for comparison
        datasetDate.setHours(0, 0, 0, 0)
        filterDate.setHours(0, 0, 0, 0)
        if (datasetDate < filterDate) {
          return false
        }
      }
      if (createdTo && dataset.createdAt) {
        const datasetDate = new Date(dataset.createdAt)
        const filterDate = new Date(createdTo)
        // Set to end of day for "to" comparison
        filterDate.setHours(23, 59, 59, 999)
        if (datasetDate > filterDate) {
          return false
        }
      }
      
      // Updated date filter
      if (updatedFrom && dataset.updatedAt) {
        const datasetDate = new Date(dataset.updatedAt)
        const filterDate = new Date(updatedFrom)
        // Reset to start of day for comparison
        datasetDate.setHours(0, 0, 0, 0)
        filterDate.setHours(0, 0, 0, 0)
        if (datasetDate < filterDate) {
          return false
        }
      }
      if (updatedTo && dataset.updatedAt) {
        const datasetDate = new Date(dataset.updatedAt)
        const filterDate = new Date(updatedTo)
        // Set to end of day for "to" comparison
        filterDate.setHours(23, 59, 59, 999)
        if (datasetDate > filterDate) {
          return false
        }
      }
      
      return true
    })
  }, [datasets, searchQuery, selectedTags, statusFilter, ownerFilter, createdFrom, createdTo, updatedFrom, updatedTo])
  
  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return searchQuery.length > 0 || selectedTags.length > 0 || statusFilter !== null || ownerFilter !== null ||
           createdFrom !== null || createdTo !== null || updatedFrom !== null || updatedTo !== null
  }, [searchQuery, selectedTags.length, statusFilter, ownerFilter, createdFrom, createdTo, updatedFrom, updatedTo])
  
  // Update functions
  const setSearchQuery = (q: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        q: q || undefined
      })
    })
  }
  
  const setSelectedTags = (tags: string[]) => {
    navigate({
      search: (prev) => ({
        ...prev,
        tags: tags.length > 0 ? tags : undefined
      })
    })
  }
  
  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]
    setSelectedTags(newTags)
  }
  
  const setStatusFilter = (status: string | null) => {
    navigate({
      search: (prev) => ({
        ...prev,
        status: status || undefined
      })
    })
  }
  
  const handleStatusChange = (value: string) => {
    setStatusFilter(value === 'all' ? null : value)
  }
  
  const setOwnerFilter = (owner: string | null) => {
    navigate({
      search: (prev) => ({
        ...prev,
        owner: owner || undefined
      })
    })
  }
  
  const handleOwnerChange = (value: string) => {
    setOwnerFilter(value === 'all' ? null : value)
  }
  
  const setCreatedFrom = (date: Date | null) => {
    navigate({
      search: (prev) => ({
        ...prev,
        createdFrom: date ? date.toISOString() : undefined
      })
    })
  }
  
  const setCreatedTo = (date: Date | null) => {
    navigate({
      search: (prev) => ({
        ...prev,
        createdTo: date ? date.toISOString() : undefined
      })
    })
  }
  
  const setUpdatedFrom = (date: Date | null) => {
    navigate({
      search: (prev) => ({
        ...prev,
        updatedFrom: date ? date.toISOString() : undefined
      })
    })
  }
  
  const setUpdatedTo = (date: Date | null) => {
    navigate({
      search: (prev) => ({
        ...prev,
        updatedTo: date ? date.toISOString() : undefined
      })
    })
  }
  
  const clearFilters = () => {
    navigate({
      search: (prev) => ({
        ...prev,
        q: undefined,
        tags: undefined,
        status: undefined,
        owner: undefined,
        createdFrom: undefined,
        createdTo: undefined,
        updatedFrom: undefined,
        updatedTo: undefined
      })
    })
  }
  
  return {
    // State
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
    hasActiveFilters,
    
    // Actions
    setSearchQuery,
    setSelectedTags,
    toggleTag,
    setStatusFilter,
    handleStatusChange,
    setOwnerFilter,
    handleOwnerChange,
    setCreatedFrom,
    setCreatedTo,
    setUpdatedFrom,
    setUpdatedTo,
    clearFilters
  }
}

