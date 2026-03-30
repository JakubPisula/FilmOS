import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { updateTaskSchema } from '@/lib/validations/task'
import { syncNotionStatus } from '@/lib/notion-sync'

export async function PATCH(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { taskId } = await params

  try {
    const body = await request.json()
    const validated = updateTaskSchema.parse(body)

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...validated,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
      },
    })

    if (validated.status) {
      await syncNotionStatus(task.notionId, task.status)
    }

    return NextResponse.json(task)
  } catch (error: any) {
    return new NextResponse(error.message, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ROLE_ADMIN') {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { taskId } = await params

  await prisma.task.delete({
    where: { id: taskId },
  })

  return new NextResponse(null, { status: 204 })
}
