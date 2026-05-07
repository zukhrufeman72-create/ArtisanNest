import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'

export async function POST() {
  const session = await verifySession()
  await prisma.notification.updateMany({
    where: { userId: session.userId, isRead: false },
    data: { isRead: true },
  })
  return NextResponse.json({ success: true })
}
