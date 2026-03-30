import { z } from 'zod'
import { TaskStatus } from '@prisma/client'

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  projectId: z.string().cuid(),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.string().cuid().optional(),
})

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.nativeEnum(TaskStatus).optional(),
  order: z.number().int().min(0).optional(),
})
