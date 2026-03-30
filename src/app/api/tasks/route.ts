import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createTaskSchema } from '@/lib/validations/task'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return new NextResponse('Missing projectId', { status: 400 })
  }

  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: { workLogs: true },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json(tasks)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const body = await request.json()
    const validated = createTaskSchema.parse(body)

    const task = await prisma.task.create({
      data: {
        ...validated,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error: any) {
    return new NextResponse(error.message, { status: 400 })
  }
}
