import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ROLE_ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const tokens = await prisma.apiToken.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      label: true,
      lastUsed: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(tokens)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session || !session.user?.id || (session.user as any).role !== 'ROLE_ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const body = await request.json()
  const { label } = body

  const token = await prisma.apiToken.create({
    data: {
      userId: session.user.id,
      label: label || 'Premiere Plugin',
    }
  })

  // Zwracamy token tylko raz przy utworzeniu
  return NextResponse.json(token, { status: 201 })
}
