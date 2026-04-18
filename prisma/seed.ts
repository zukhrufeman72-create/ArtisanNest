import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin1010', 10)

  await prisma.user.upsert({
    where: { email: 'admin@hc.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@hc.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('Seeded admin user: admin@hc.com')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
