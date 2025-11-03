import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePermissionsStore } from '@/stores/permissions-store'

export function UserFilters() {
  const { 
    searchQuery, 
    roleFilter, 
    statusFilter, 
    tenantFilter,
    tenants,
    setSearchQuery, 
    setRoleFilter, 
    setStatusFilter,
    setTenantFilter
  } = usePermissionsStore()
  
  const hasActiveFilters = searchQuery || roleFilter || statusFilter !== 'all' || tenantFilter
  
  const clearFilters = () => {
    setSearchQuery('')
    setRoleFilter(null)
    setStatusFilter('all')
    setTenantFilter(null)
  }
  
  return (
    <div className="space-y-3 md:space-y-2">
      <div className="flex flex-col gap-3 md:gap-2">
        {/* Search Bar - Full width on all screens */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground md:h-3 md:w-3" />
          <Input
            placeholder="User nach E-Mail durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 md:h-9 md:text-sm"
          />
        </div>
        
        {/* Filters - Responsive layout */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-2 w-full">
          <Select value={roleFilter || 'all'} onValueChange={(v) => setRoleFilter(v === 'all' ? null : v)}>
            <SelectTrigger className="w-full sm:w-[140px] md:h-8 md:text-xs md:px-2">
              <SelectValue placeholder="Rolle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Rollen</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="user">Users</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? 'all' : v as 'active' | 'inactive')}>
            <SelectTrigger className="w-full sm:w-[140px] md:h-8 md:text-xs md:px-2">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="inactive">Inaktiv</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tenantFilter || 'all'} onValueChange={(v) => setTenantFilter(v === 'all' ? null : v)}>
            <SelectTrigger className="w-full sm:w-[160px] md:h-8 md:text-xs md:px-2">
              <SelectValue placeholder="Tenant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Tenants</SelectItem>
              <SelectItem value="none">Kein Tenant</SelectItem>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="w-full sm:w-auto md:h-8 md:px-3 md:text-xs"
            >
              <X className="h-4 w-4 mr-1" />
              Zurücksetzen
            </Button>
          )}
        </div>
      </div>
      
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Aktive Filter:</span>
          {searchQuery && (
            <Badge variant="secondary" className="text-xs">
              Suche: "{searchQuery}"
            </Badge>
          )}
          {roleFilter && (
            <Badge variant="secondary" className="text-xs">
              Rolle: {roleFilter === 'admin' ? 'Admin' : 'User'}
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Status: {statusFilter === 'active' ? 'Aktiv' : 'Inaktiv'}
            </Badge>
          )}
          {tenantFilter && (
            <Badge variant="secondary" className="text-xs">
              Tenant: {tenantFilter === 'none' ? 'Kein Tenant' : tenants.find(t => t.id === tenantFilter)?.name || 'Unbekannt'}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

