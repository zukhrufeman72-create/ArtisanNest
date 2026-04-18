import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json([], { status: 401 })

  let notifications
  if (session.role === 'ADMIN') {
    notifications = await prisma.notification.findMany({
      where: { userId: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  } else {
    notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  }

  return NextResponse.json(notifications)
}

export async function PATCH() {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ ok: false }, { status: 401 })

  if (session.role === 'ADMIN') {
    await prisma.notification.updateMany({
      where: { userId: null, isRead: false },
      data: { isRead: true },
    })
  } else {
    await prisma.notification.updateMany({
      where: { userId: session.userId, isRead: false },
      data: { isRead: true },
    })
  }

  return NextResponse.json({ ok: true })
}
