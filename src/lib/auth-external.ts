import { prisma } from './prisma'

export async function verifyApiToken(request: Request) {
  const header = request.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice(7)
  const record = await prisma.apiToken.findUnique({
    where: { token },
    include: { user: true }
  })
  if (!record) return null
  await prisma.apiToken.update({ 
    where: { id: record.id }, 
    data: { lastUsed: new Date() } 
  })
  return record.user
}
