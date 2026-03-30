import { z } from 'zod'
import { WorkLogSource } from '@prisma/client'

export const createWorkLogSchema = z.object({
  taskId: z.string().cuid(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  note: z.string().max(500).optional(),
  source: z.nativeEnum(WorkLogSource).default('MANUAL'),
  premiereSeq: z.string().regex(/^\d{2}:\d{2}:\d{2}:\d{2}$/).optional(),
})
