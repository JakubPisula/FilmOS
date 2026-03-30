import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiToken } from '@/lib/auth-external'
import { createWorkLogSchema } from '@/lib/validations/worklog'
import { differenceInSeconds } from 'date-fns'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

export async function POST(request: Request) {
  const user = await verifyApiToken(request)
  if (!user) return new NextResponse('Unauthorized', { status: 401, headers: CORS_HEADERS })

  try {
    const body = await request.json()
    const validated = createWorkLogSchema.parse({
      ...body,
      source: 'PREMIERE_CEP'
    })

    const startedAt = new Date(validated.startedAt)
    let endedAt = validated.endedAt ? new Date(validated.endedAt) : null
    let durationSec = null

    if (endedAt) {
      durationSec = differenceInSeconds(endedAt, startedAt)
    }

    const workLog = await prisma.workLog.create({
      data: {
        taskId: validated.taskId,
        userId: user.id,
        startedAt,
        endedAt,
        durationSec,
        note: validated.note,
        source: 'PREMIERE_CEP',
        premiereSeq: validated.premiereSeq,
      },
    })

    return NextResponse.json(workLog, { status: 201, headers: CORS_HEADERS })
  } catch (error: any) {
    return new NextResponse(error.message, { status: 400, headers: CORS_HEADERS })
  }
}
