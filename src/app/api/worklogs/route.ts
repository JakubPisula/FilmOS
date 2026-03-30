import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createWorkLogSchema } from '@/lib/validations/worklog'
import { differenceInSeconds } from 'date-fns'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId')
  const userId = searchParams.get('userId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (taskId) {
    const workLogs = await prisma.workLog.findMany({
      where: { taskId },
      orderBy: { startedAt: 'desc' },
    })
    return NextResponse.json(workLogs)
  }

  if (userId && from && to) {
    const workLogs = await prisma.workLog.findMany({
      where: {
        userId,
        startedAt: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      orderBy: { startedAt: 'desc' },
    })
    return NextResponse.json(workLogs)
  }

  return new NextResponse('Missing query parameters', { status: 400 })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session || !session.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const body = await request.json()
    const validated = createWorkLogSchema.parse(body)

    const startedAt = new Date(validated.startedAt)
    let endedAt = validated.endedAt ? new Date(validated.endedAt) : null
    let durationSec = null

    if (endedAt) {
      durationSec = differenceInSeconds(endedAt, startedAt)
    } else {
      // Check for active timer
      const activeTimer = await prisma.workLog.findFirst({
        where: {
          userId: session.user.id,
          endedAt: null,
        },
      })

      if (activeTimer) {
        return NextResponse.json(
          { error: 'active_timer_exists', activeLogId: activeTimer.id },
          { status: 409 }
        )
      }
    }

    const workLog = await prisma.workLog.create({
      data: {
        taskId: validated.taskId,
        userId: session.user.id,
        startedAt,
        endedAt,
        durationSec,
        note: validated.note,
        source: validated.source,
        premiereSeq: validated.premiereSeq,
      },
    })

    return NextResponse.json(workLog, { status: 201 })
  } catch (error: any) {
    return new NextResponse(error.message, { status: 400 })
  }
}
