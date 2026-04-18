import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOptionalSession } from '@/lib/dal'

export async function GET() {
  const session = await getOptionalSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // All messages involving this user
  const rawMessages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: session.userId }, { receiverId: session.userId }],
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      content: true,
      createdAt: true,
      senderId: true,
      receiverId: true,
      isRead: true,
      sender: { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } },
    },
  })

  // Deduplicate into conversation map
  const convMap = new Map<number, {
    user: { id: number; name: string; role: string }
    lastMessage: string
    lastAt: string
    unread: number
  }>()

  for (const msg of rawMessages) {
    const other = msg.senderId === session.userId ? msg.receiver : msg.sender
    if (!convMap.has(other.id)) {
      convMap.set(other.id, {
        user: other,
        lastMessage: msg.content,
        lastAt: (msg.createdAt as Date).toISOString(),
        unread: 0,
      })
    }
    if (!msg.isRead && msg.receiverId === session.userId) {
      convMap.get(other.id)!.unread++
    }
  }

  const conversations = Array.from(convMap.values())
  const unreadTotal = conversations.reduce((s, c) => s + c.unread, 0)

  // Sellers list for new chats
  const sellers = session.role !== 'ADMIN'
    ? await prisma.user.findMany({
        where: { role: 'SELLER', id: { not: session.userId } },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, role: true },
      })
    : []

  return NextResponse.json({ conversations, sellers, unreadTotal })
}
