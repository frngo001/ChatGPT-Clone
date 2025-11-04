import type { AuthUser } from '@/stores/auth-store'
import type { Dataset } from '@/stores/dataset-store'

export function canShareDataset(user: AuthUser | null, dataset: Dataset): boolean {
  if (!user) return false
  // Owner kann immer teilen
  if (dataset.ownerId === user.id) return true
  // Prüfe ob User Share-Berechtigung hat
  if (dataset.permissions?.share) return true
  // Admin kann immer teilen
  if (user.is_superuser) return true
  return false
}

export function canDeleteDataset(user: AuthUser | null, dataset: Dataset): boolean {
  if (!user) return false
  // Owner kann immer löschen
  if (dataset.ownerId === user.id) return true
  // Prüfe ob User Delete-Berechtigung hat
  if (dataset.permissions?.delete) return true
  // Admin kann immer löschen
  if (user.is_superuser) return true
  return false
}

export function canWriteDataset(user: AuthUser | null, dataset: Dataset): boolean {
  if (!user) return false
  // Owner kann immer schreiben
  if (dataset.ownerId === user.id) return true
  // Prüfe ob User Write-Berechtigung hat
  if (dataset.permissions?.write) return true
  // Admin kann immer schreiben
  if (user.is_superuser) return true
  return false
}

export function canReadDataset(user: AuthUser | null, dataset: Dataset): boolean {
  if (!user) return false
  return dataset.isShared || dataset.ownerId === user.id
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.is_superuser || false
}

