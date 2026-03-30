import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { differenceInSeconds } from 'date-fns'

export async function POST(
  request: Request,
  { params }: { params: { logId: string } }
) {
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { logId } = await params

  const workLog = await prisma.workLog.findUnique({
    where: { id: logId },
  })

  if (!workLog) {
    return new NextResponse('WorkLog not found', { status: 404 })
  }

  if (workLog.endedAt) {
    return new NextResponse('Timer already stopped', { status: 400 })
  }

  const endedAt = new Date()
  const durationSec = differenceInSeconds(endedAt, workLog.startedAt)

  const updatedLog = await prisma.workLog.update({
    where: { id: logId },
    data: {
      endedAt,
      durationSec,
    },
  })

  return NextResponse.json(updatedLog)
}
