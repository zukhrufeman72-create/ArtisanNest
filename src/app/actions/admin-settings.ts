'use server'

import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { revalidatePath } from 'next/cache'
import { nameSchema } from '@/lib/validations'

/**
 * Update admin display name.
 * Email and password changes go through the OTP flow in profile.ts.
 */
export async function updateAdminProfile(formData: FormData) {
  const session = await verifySession()
  if (session.role !== 'ADMIN') return { error: 'Unauthorized.' }

  const rawName = String(formData.get('name') ?? '').trim()
  if (!rawName) return { error: 'Name is required.' }

  // Must contain at least one letter — no all-numeric names
  const parsed = nameSchema.safeParse(rawName)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid name.' }
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { name: parsed.data },
  })

  revalidatePath('/admin/settings')
  return { success: true }
}
