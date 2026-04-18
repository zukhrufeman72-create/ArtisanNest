import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import NavbarWrapper from '@/components/NavbarWrapper'
import Footer from '@/components/Footer'
import MessengerView from './MessengerView'

export default async function MessagesPage() {
  const session = await verifySession()

  // Existing conversations
  const rawMessages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.userId },
        { receiverId: session.userId },
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
        lastAt: msg.createdAt.toISOString(),
        unread: 0,
      })
    }
    if (!msg.isRead && msg.receiverId === session.userId) {
      convMap.get(other.id)!.unread++
    }
  }

  const conversations = Array.from(convMap.values())

  // All sellers (for "New Chat" panel — customers can browse and start new conversations)
  const sellers = session.role !== 'ADMIN'
    ? await prisma.user.findMany({
        where: { role: 'SELLER', id: { not: session.userId } },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, role: true, products: { take: 1, select: { id: true } } },
      })
    : []

  return (
    <>
      <NavbarWrapper />
      <main className="min-h-screen bg-[#FAF7F4]">
        <MessengerView
          conversations={conversations}
          currentUserId={session.userId}
          currentUserRole={session.role}
          sellers={sellers.map((s) => ({ id: s.id, name: s.name, role: s.role }))}
        />
      </main>
      <Footer />
    </>
  )
}
