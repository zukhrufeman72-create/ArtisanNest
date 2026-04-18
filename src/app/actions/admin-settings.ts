'use server'

import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export async function updateAdminProfile(formData: FormData) {
  const session = await verifySession()
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const currentPassword = String(formData.get('currentPassword') ?? '').trim()
  const newPassword = String(formData.get('newPassword') ?? '').trim()

  if (name && email) {
    await prisma.user.update({
      where: { id: session.userId },
      data: { name, email },
    })
  }

  if (currentPassword && newPassword) {
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { password: true } })
    if (user) {
      const valid = await bcrypt.compare(currentPassword, user.password)
      if (valid) {
        const hashed = await bcrypt.hash(newPassword, 12)
        await prisma.user.update({ where: { id: session.userId }, data: { password: hashed } })
      }
    }
  }

  revalidatePath('/admin/settings')
}
