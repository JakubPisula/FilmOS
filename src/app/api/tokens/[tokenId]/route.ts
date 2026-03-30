import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { tokenId: string } }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'ROLE_ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { tokenId } = await params

  await prisma.apiToken.delete({
    where: { id: tokenId }
  })

  return new NextResponse(null, { status: 204 })
}
