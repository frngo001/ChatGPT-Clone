import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Tasks } from '@/features/tasks'

const taskSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  status: z
    .array(z.enum(['backlog', 'todo', 'in progress', 'done', 'canceled'] as const))
    .optional()
    .catch([]),
  priority: z
    .array(z.enum(['low', 'medium', 'high', 'critical'] as const))
    .optional()
    .catch([]),
  filter: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/tasks/')({
  validateSearch: taskSearchSchema,
  component: Tasks,
})
