import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getOptionalSession } from '@/lib/dal'
import { getAuthorizedChatPair } from '@/lib/chat-authorization'
import { isRateLimited, retryAfterMs } from '@/lib/rate-limit'

const userIdSchema = z.coerce.number().int().positive()
const messageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty.').max(1000, 'Message is too long.'),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getOptionalSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsedUserId = userIdSchema.safeParse((await params).userId)
  if (!parsedUserId.success) {
    return NextResponse.json({ error: 'Invalid user.' }, { status: 400 })
  }

  const pair = await getAuthorizedChatPair(session.userId, parsedUserId.data)
  if (!pair) {
    return NextResponse.json(
      { error: 'Chat is only available between a customer and a seller.' },
      { status: 403 }
    )
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: pair.currentUser.id, receiverId: pair.otherUser.id },
        { senderId: pair.otherUser.id, receiverId: pair.currentUser.id },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
    select: { id: true, content: true, createdAt: true, senderId: true, receiverId: true, isRead: true },
  })

  // Mark incoming messages as read
  await prisma.message.updateMany({
    where: { senderId: pair.otherUser.id, receiverId: pair.currentUser.id, isRead: false },
    data: { isRead: true },
  })

  return NextResponse.json({
    messages,
    other: {
      id: pair.otherUser.id,
      name: pair.otherUser.name,
      role: pair.otherUser.role,
    },
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getOptionalSession()
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsedUserId = userIdSchema.safeParse((await params).userId)
  if (!parsedUserId.success) {
    return NextResponse.json({ error: 'Invalid user.' }, { status: 400 })
  }

  const pair = await getAuthorizedChatPair(session.userId, parsedUserId.data)
  if (!pair) {
    return NextResponse.json(
      { error: 'Chat is only available between a customer and a seller.' },
      { status: 403 }
    )
  }

  const rateLimitKey = `chat-send:${pair.currentUser.id}`
  if (isRateLimited(rateLimitKey, 30, 60_000)) {
    const retryAfter = Math.max(1, Math.ceil(retryAfterMs(rateLimitKey) / 1000))
    return NextResponse.json(
      { error: 'Too many messages. Please wait before sending another.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsedMessage = messageSchema.safeParse(body)
  if (!parsedMessage.success) {
    return NextResponse.json(
      { error: parsedMessage.error.issues[0]?.message ?? 'Invalid message.' },
      { status: 400 }
    )
  }

  const message = await prisma.message.create({
    data: {
      content: parsedMessage.data.content,
      senderId: pair.currentUser.id,
      receiverId: pair.otherUser.id,
    },
    select: { id: true, content: true, createdAt: true, senderId: true, receiverId: true, isRead: true },
  })

  // Notify receiver (best-effort)
  try {
    await prisma.notification.create({
      data: {
        userId: pair.otherUser.id,
        type: 'NEW_MESSAGE',
        title: `New message from ${pair.currentUser.name}`,
        body: parsedMessage.data.content.slice(0, 100),
      },
    })
  } catch { /* notification table may not be ready */ }

  return NextResponse.json({ message })
}
