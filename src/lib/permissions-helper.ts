import type { AuthUser } from '@/stores/auth-store'
import type { Dataset } from '@/stores/dataset-store'

export function canShareDataset(user: AuthUser | null, dataset: Dataset): boolean {
  if (!user) return false
  const isOwner = dataset.ownerId === user.id
  // Normale Nutzer können ihre eigenen Datasets teilen
  return isOwner
}

export function canDeleteDataset(user: AuthUser | null, dataset: Dataset): boolean {
  if (!user) return false
  return dataset.ownerId === user.id
}

export function canWriteDataset(user: AuthUser | null, dataset: Dataset): boolean {
  if (!user) return false
  return dataset.ownerId === user.id
}

export function canReadDataset(user: AuthUser | null, dataset: Dataset): boolean {
  if (!user) return false
  return dataset.isShared || dataset.ownerId === user.id
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.is_superuser || false
}

