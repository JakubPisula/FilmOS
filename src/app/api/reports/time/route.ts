import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { intervalToDuration } from 'date-fns'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!projectId) {
    return new NextResponse('Missing projectId', { status: 400 })
  }

  const where: any = {
    task: { projectId },
    endedAt: { not: null },
  }

  if (from || to) {
    where.startedAt = {}
    if (from) where.startedAt.gte = new Date(from)
    if (to) where.startedAt.lte = new Date(to)
  }

  const workLogs = await prisma.workLog.findMany({
    where,
    include: {
      task: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  const taskAggregation: Record<string, { taskId: string, taskTitle: string, totalSec: number, entries: any[] }> = {}
  let totalSec = 0

  workLogs.forEach((log) => {
    const taskId = log.taskId
    const duration = log.durationSec || 0
    totalSec += duration

    if (!taskAggregation[taskId]) {
      taskAggregation[taskId] = {
        taskId,
        taskTitle: log.task.title,
        totalSec: 0,
        entries: [],
      }
    }

    taskAggregation[taskId].totalSec += duration
    taskAggregation[taskId].entries.push({
      id: log.id,
      startedAt: log.startedAt,
      endedAt: log.endedAt,
      durationSec: duration,
      note: log.note,
      source: log.source,
    })
  })

  const response = {
    totalSec,
    formattedTotal: formatDuration(totalSec),
    byTask: Object.values(taskAggregation).map(task => ({
      ...task,
      formattedDuration: formatDuration(task.totalSec)
    })),
  }

  return NextResponse.json(response)
}

function formatDuration(seconds: number) {
  const duration = intervalToDuration({ start: 0, end: seconds * 1000 })
  const parts = []
  if (duration.hours) parts.push(`${duration.hours}h`)
  if (duration.minutes) parts.push(`${duration.minutes}m`)
  if (duration.seconds || parts.length === 0) parts.push(`${duration.seconds}s`)
  return parts.join(' ')
}
