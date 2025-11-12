import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePermissionsStore } from '@/stores/permissions-store'
import { useDatasetStore } from '@/stores/dataset-store'
import { useToast } from '@/hooks/use-sonner-toast'
import { Loader2 } from 'lucide-react'
import type { PermissionType, PrincipalType } from '@/types/permissions'

interface DatasetPermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DatasetPermissionsDialog({ open, onOpenChange }: DatasetPermissionsDialogProps) {
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<string[]>([])
  const [principalType, setPrincipalType] = useState<PrincipalType>('user')
  const [selectedPrincipalId, setSelectedPrincipalId] = useState<string>('')
  const [permissionType, setPermissionType] = useState<PermissionType>('read')
  const [isGranting, setIsGranting] = useState(false)
  const [actionType, setActionType] = useState<'grant' | 'revoke'>('grant')

  const users = usePermissionsStore((state) => state.users)
  const roles = usePermissionsStore((state) => state.roles)
  const giveDatasetPermission = usePermissionsStore((state) => state.giveDatasetPermission)
  const revokeDatasetPermission = usePermissionsStore((state) => state.revokeDatasetPermission)
  const datasets = useDatasetStore((state) => state.datasets)
  const { toast } = useToast()

  const principals = useMemo(() => {
    return principalType === 'user' ? users : roles
  }, [principalType, users, roles])

  const handleDatasetToggle = (datasetId: string) => {
    setSelectedDatasetIds((prev) => 
      prev.includes(datasetId)
        ? prev.filter((id) => id !== datasetId)
        : [...prev, datasetId]
    )
  }

  const handleSelectAll = () => {
    if (selectedDatasetIds.length === datasets.length) {
      setSelectedDatasetIds([])
    } else {
      setSelectedDatasetIds(datasets.map((d) => d.id))
    }
  }

  const handleGrant = async () => {
    if (selectedDatasetIds.length === 0 || !selectedPrincipalId) {
      toast({ 
        title: 'Fehler', 
        description: 'Bitte wählen Sie mindestens ein Dataset und einen Principal aus', 
        variant: 'error' 
      })
      return
    }

    setIsGranting(true)
    try {
      await giveDatasetPermission({
        dataset_ids: selectedDatasetIds,
        principal_id: selectedPrincipalId,
        principal_type: principalType,
        permission_type: permissionType,
      })

      const selectedDatasets = datasets.filter((d) => selectedDatasetIds.includes(d.id))
      const principal = principals.find((p) => p.id === selectedPrincipalId)
      const principalName = 'email' in principal! ? principal!.email : principal!.name

      const datasetNames = selectedDatasets.map((d) => d.name).join(', ')
      const datasetCount = selectedDatasets.length

      toast({ 
        title: 'Berechtigung erteilt', 
        description: `"${principalName}" hat jetzt ${permissionType}-Zugriff auf ${datasetCount} Dataset${datasetCount > 1 ? 's' : ''}: ${datasetNames}`, 
        variant: 'success' 
      })
      
      // Reset form
      setSelectedDatasetIds([])
      setSelectedPrincipalId('')
      setPrincipalType('user')
      setPermissionType('read')
      onOpenChange(false)
    } catch (error) {
      toast({ 
        title: 'Fehler', 
        description: error instanceof Error ? error.message : 'Berechtigung konnte nicht erteilt werden', 
        variant: 'error' 
      })
    } finally {
      setIsGranting(false)
    }
  }

  const handleRevoke = async () => {
    if (selectedDatasetIds.length === 0 || !selectedPrincipalId) {
      toast({ 
        title: 'Fehler', 
        description: 'Bitte wählen Sie mindestens ein Dataset und einen Principal aus', 
        variant: 'error' 
      })
      return
    }

    setIsGranting(true)
    try {
      await revokeDatasetPermission({
        dataset_ids: selectedDatasetIds,
        principal_id: selectedPrincipalId,
        principal_type: principalType,
        permission_type: permissionType,
      })

      const selectedDatasets = datasets.filter((d) => selectedDatasetIds.includes(d.id))
      const principal = principals.find((p) => p.id === selectedPrincipalId)
      const principalName = 'email' in principal! ? principal!.email : principal!.name

      const datasetNames = selectedDatasets.map((d) => d.name).join(', ')
      const datasetCount = selectedDatasets.length

      toast({ 
        title: 'Berechtigung entfernt', 
        description: `"${principalName}" hat keinen ${permissionType}-Zugriff mehr auf ${datasetCount} Dataset${datasetCount > 1 ? 's' : ''}: ${datasetNames}`, 
        variant: 'success' 
      })
      
      // Reset form
      setSelectedDatasetIds([])
      setSelectedPrincipalId('')
      setPrincipalType('user')
      setPermissionType('read')
      onOpenChange(false)
    } catch (error) {
      toast({ 
        title: 'Fehler', 
        description: error instanceof Error ? error.message : 'Berechtigung konnte nicht entfernt werden', 
        variant: 'error' 
      })
    } finally {
      setIsGranting(false)
    }
  }

  const handleSubmit = () => {
    if (actionType === 'grant') {
      handleGrant()
    } else {
      handleRevoke()
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when dialog closes
      setSelectedDatasetIds([])
      setSelectedPrincipalId('')
      setPrincipalType('user')
      setPermissionType('read')
      setActionType('grant')
    }
    onOpenChange(newOpen)
  }


  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!max-w-[18vw] !w-[18vw] sm:!max-w-[30vw] sm:!w-[30vw] md:!max-w-[28vw] md:!w-[28vw] lg:!max-w-[28vw] lg:!w-[28vw] xl:!max-w-[28vw] xl:!w-[28vw] max-h-[98vh]">
        <DialogHeader>
          <DialogTitle>Dataset-Berechtigung verwalten</DialogTitle>
          <DialogDescription>
            Erteilen oder entfernen Sie Berechtigungen für einen Benutzer oder eine Rolle auf ein oder mehrere Datasets.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Action Type Selection */}
          <Tabs value={actionType} onValueChange={(value) => setActionType(value as 'grant' | 'revoke')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grant">Berechtigung erteilen</TabsTrigger>
              <TabsTrigger value="revoke">Berechtigung entfernen</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Dataset Selection Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Dataset auswählen *</Label>
              {datasets.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isGranting}
                  className="h-7 text-xs"
                >
                  {selectedDatasetIds.length === datasets.length ? 'Alle abwählen' : 'Alle auswählen'}
                </Button>
              )}
            </div>
            <ScrollArea className="h-64 rounded-md border">
              {datasets.length === 0 ? (
                <div className="px-2 py-6 text-sm text-center text-muted-foreground">
                  Keine Datasets verfügbar
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 sm:w-12"></TableHead>
                      <TableHead className="w-[120px] sm:w-[150px] md:w-[180px] lg:w-[200px]">Dataset</TableHead>
                      <TableHead className="min-w-[200px]">Beschreibung</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datasets.map((dataset) => (
                      <TableRow key={dataset.id}>
                        <TableCell className="w-10 sm:w-12">
                          <Checkbox
                            id={`dataset-${dataset.id}`}
                            checked={selectedDatasetIds.includes(dataset.id)}
                            onCheckedChange={() => handleDatasetToggle(dataset.id)}
                            disabled={isGranting}
                          />
                        </TableCell>
                        <TableCell className="font-medium w-[120px] sm:w-[150px] md:w-[180px] lg:w-[200px]">
                          <Label
                            htmlFor={`dataset-${dataset.id}`}
                            className="cursor-pointer break-words"
                          >
                            {dataset.name}
                          </Label>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-pre-wrap min-w-[200px]">
                          {dataset.description || 'Keine Beschreibung verfügbar.'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
            {selectedDatasetIds.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedDatasetIds.length} Dataset{selectedDatasetIds.length > 1 ? 's' : ''} ausgewählt
              </p>
            )}
          </div>

          {/* Principal Type Selection */}
          <div className="space-y-3">
            <Label>Principal-Typ *</Label>
            <RadioGroup
              value={principalType}
              onValueChange={(value) => {
                setPrincipalType(value as PrincipalType)
                setSelectedPrincipalId('')
              }}
              disabled={isGranting}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="user" />
                <Label htmlFor="user" className="font-normal cursor-pointer">
                  Benutzer
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="role" id="role" />
                <Label htmlFor="role" className="font-normal cursor-pointer">
                  Rolle
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Principal Selection */}
          <div className="space-y-2">
            <Label htmlFor="principal">
              {principalType === 'user' ? 'Benutzer' : 'Rolle'} auswählen *
            </Label>
            <Select value={selectedPrincipalId} onValueChange={setSelectedPrincipalId} disabled={isGranting}>
              <SelectTrigger id="principal">
                <SelectValue 
                  placeholder={principalType === 'user' ? 'Benutzer wählen...' : 'Rolle wählen...'} 
                />
              </SelectTrigger>
              <SelectContent>
                {principals.length === 0 ? (
                  <div className="px-2 py-6 text-sm text-center text-muted-foreground">
                    Keine {principalType === 'user' ? 'Benutzer' : 'Rollen'} verfügbar
                  </div>
                ) : (
                  principals.map((principal) => (
                    <SelectItem key={principal.id} value={principal.id}>
                      {'email' in principal ? principal.email : principal.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Permission Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="permission">Berechtigungstyp *</Label>
            <Select 
              value={permissionType} 
              onValueChange={(value) => setPermissionType(value as PermissionType)} 
              disabled={isGranting}
            >
              <SelectTrigger id="permission">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">Lesen (Read)</SelectItem>
                <SelectItem value="write">Schreiben (Write)</SelectItem>
                <SelectItem value="delete">Löschen (Delete)</SelectItem>
                <SelectItem value="share">Teilen (Share)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {
                permissionType === 'read' && 'Nur Lesezugriff auf das Dataset'
              }
              {
                permissionType === 'write' && 'Lesen und Bearbeiten des Datasets'
              }
              {
                permissionType === 'delete' && 'Lesen, Bearbeiten und Löschen des Datasets'
              }
              {
                permissionType === 'share' && 'Alle Rechte inkl. Teilen mit anderen'
              }
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGranting}
          >
            Abbrechen
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isGranting || selectedDatasetIds.length === 0 || !selectedPrincipalId}
            variant={actionType === 'revoke' ? 'destructive' : 'secondary'}
          >
            {isGranting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {actionType === 'grant' ? 'Berechtigung erteilen' : 'Berechtigung entfernen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

