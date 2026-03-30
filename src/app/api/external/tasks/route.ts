import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyApiToken } from '@/lib/auth-external'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

export async function GET(request: Request) {
  const user = await verifyApiToken(request)
  if (!user) return new NextResponse('Unauthorized', { status: 401, headers: CORS_HEADERS })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return new NextResponse('Missing projectId', { status: 400, headers: CORS_HEADERS })
  }

  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
    }
  })

  return NextResponse.json(tasks, { headers: CORS_HEADERS })
}
