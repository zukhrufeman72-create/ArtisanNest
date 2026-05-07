import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ ok: false }, { status: 401 })

  const { id } = await params
  const notifId = Number(id)
  if (isNaN(notifId)) return NextResponse.json({ ok: false }, { status: 400 })

  await prisma.notification.updateMany({
    where: {
      id: notifId,
      OR: [{ userId: session.userId }, { userId: null }],
    },
    data: { isRead: true },
  })

  return NextResponse.json({ ok: true })
}
