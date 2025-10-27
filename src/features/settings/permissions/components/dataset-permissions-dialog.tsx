import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('')
  const [principalType, setPrincipalType] = useState<PrincipalType>('user')
  const [selectedPrincipalId, setSelectedPrincipalId] = useState<string>('')
  const [permissionType, setPermissionType] = useState<PermissionType>('read')
  const [isGranting, setIsGranting] = useState(false)

  const { users, roles, giveDatasetPermission } = usePermissionsStore()
  const datasets = useDatasetStore((state) => state.datasets)
  const { toast } = useToast()

  const principals = principalType === 'user' ? users : roles

  const handleGrant = async () => {
    if (!selectedDatasetId || !selectedPrincipalId) {
      toast({ 
        title: 'Fehler', 
        description: 'Bitte wählen Sie ein Dataset und einen Principal aus', 
        variant: 'error' 
      })
      return
    }

    setIsGranting(true)
    try {
      await giveDatasetPermission({
        dataset_id: selectedDatasetId,
        principal_id: selectedPrincipalId,
        principal_type: principalType,
        permission_type: permissionType,
      })

      const dataset = datasets.find((d) => d.id === selectedDatasetId)
      const principal = principals.find((p) => p.id === selectedPrincipalId)
      const principalName = 'email' in principal! ? principal!.email : principal!.name

      toast({ 
        title: 'Berechtigung erteilt', 
        description: `"${principalName}" hat jetzt ${permissionType}-Zugriff auf "${dataset?.name || 'Dataset'}"`, 
        variant: 'success' 
      })
      
      // Reset form
      setSelectedDatasetId('')
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Dataset-Berechtigung vergeben</DialogTitle>
          <DialogDescription>
            Erteilen Sie einem Benutzer oder einer Rolle Zugriff auf ein Dataset.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dataset Selection */}
          <div className="space-y-2">
            <Label htmlFor="dataset">Dataset auswählen *</Label>
            <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId} disabled={isGranting}>
              <SelectTrigger id="dataset">
                <SelectValue placeholder="Dataset wählen..." />
              </SelectTrigger>
              <SelectContent>
                {datasets.length === 0 ? (
                  <div className="px-2 py-6 text-sm text-center text-muted-foreground">
                    Keine Datasets verfügbar
                  </div>
                ) : (
                  datasets.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
            onClick={handleGrant} 
            disabled={isGranting || !selectedDatasetId || !selectedPrincipalId}
          >
            {isGranting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Berechtigung erteilen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

