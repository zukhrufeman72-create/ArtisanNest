import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOptionalSession } from '@/lib/dal'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getOptionalSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId } = await params
  const otherId = parseInt(userId)
  if (isNaN(otherId)) return NextResponse.json({ error: 'Invalid user' }, { status: 400 })

  const [messages, other] = await Promise.all([
    prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.userId, receiverId: otherId },
          { senderId: otherId, receiverId: session.userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
      select: { id: true, content: true, createdAt: true, senderId: true, receiverId: true, isRead: true },
    }),
    prisma.user.findUnique({
      where: { id: otherId },
      select: { id: true, name: true, role: true },
    }),
  ])

  // Mark incoming messages as read
  await prisma.message.updateMany({
    where: { senderId: otherId, receiverId: session.userId, isRead: false },
    data: { isRead: true },
  })

  return NextResponse.json({ messages, other })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getOptionalSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId } = await params
  const receiverId = parseInt(userId)
  if (isNaN(receiverId)) return NextResponse.json({ error: 'Invalid user' }, { status: 400 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  const [message, sender] = await Promise.all([
    prisma.message.create({
      data: { content: content.trim(), senderId: session.userId, receiverId },
      select: { id: true, content: true, createdAt: true, senderId: true, receiverId: true, isRead: true },
    }),
    prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } }),
  ])

  // Notify receiver (best-effort)
  try {
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'NEW_MESSAGE',
        title: `New message from ${sender?.name ?? 'Someone'}`,
        body: content.trim().slice(0, 100),
      },
    })
  } catch { /* notification table may not be ready */ }

  return NextResponse.json({ message })
}
