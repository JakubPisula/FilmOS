import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'test@filmos.pro' },
    update: {},
    create: { email: 'test@filmos.pro', name: 'Test User', role: 'ROLE_ADMIN' }
  })
  
  const client = await prisma.client.upsert({
    where: { email: 'client@test.com' },
    update: {},
    create: { email: 'client@test.com', name: 'Test Client' }
  })

  const project = await prisma.project.create({
    data: {
      name: 'Test Project',
      status: 'TODO',
      ownerId: user.id,
      clientId: client.id
    }
  })

  const token = await prisma.apiToken.create({
    data: {
      userId: user.id,
      label: 'Test Token',
      token: 'test-bearer-token-123'
    }
  })

  console.log(JSON.stringify({ userId: user.id, projectId: project.id, token: token.token }))
}

main().catch(console.error).finally(() => prisma.$disconnect())
