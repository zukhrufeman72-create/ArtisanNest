import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOptionalSession } from '@/lib/dal'
import { getCurrentChatUser, getOppositeChatRole } from '@/lib/chat-authorization'

export async function GET() {
  const session = await getOptionalSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const currentUser = await getCurrentChatUser(session.userId)
  if (!currentUser) {
    return NextResponse.json({ error: 'Messaging is only available to customers and sellers.' }, { status: 403 })
  }
  const otherRole = getOppositeChatRole(currentUser.role)
  const validOtherUser = otherRole === 'SELLER'
    ? { role: otherRole, isVerified: true, isApproved: true }
    : { role: otherRole, isVerified: true }

  // All messages involving this user
  const rawMessages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: currentUser.id, receiver: validOtherUser },
        { receiverId: currentUser.id, sender: validOtherUser },
      ],
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
    const other = msg.senderId === currentUser.id ? msg.receiver : msg.sender
    if (!convMap.has(other.id)) {
      convMap.set(other.id, {
        user: other,
        lastMessage: msg.content,
        lastAt: (msg.createdAt as Date).toISOString(),
        unread: 0,
      })
    }
    if (!msg.isRead && msg.receiverId === currentUser.id) {
      convMap.get(other.id)!.unread++
    }
  }

  const conversations = Array.from(convMap.values())
  const unreadTotal = conversations.reduce((s, c) => s + c.unread, 0)

  // Sellers list for new chats
  const sellers = currentUser.role === 'CUSTOMER'
    ? await prisma.user.findMany({
        where: { role: 'SELLER', isVerified: true, isApproved: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, role: true },
      })
    : []

  return NextResponse.json({ conversations, sellers, unreadTotal })
}
