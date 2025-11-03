import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { DatasetsPage } from '@/features/datasets'

const searchSchema = z.object({
  q: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.string().optional(),
  owner: z.string().optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
  updatedFrom: z.string().optional(),
  updatedTo: z.string().optional(),
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/library/datasets/')({
  component: DatasetsPage,
  validateSearch: searchSchema,
})
