import { loadEnvConfig } from '@next/env'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

loadEnvConfig(process.cwd())

const prisma = new PrismaClient()

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL ?? 'superadmin@hc.com'
  const password = process.env.SUPER_ADMIN_PASSWORD ?? 'Qwerty1234'
  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.upsert({
    where: { email },
    update: {
      name: 'Super Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isVerified: true,
      isApproved: true,
    },
    create: {
      name: 'Super Admin',
      email,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isVerified: true,
      isApproved: true,
    },
  })

  console.log(`Seeded super-admin user: ${email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
