import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import NavbarWrapper from '@/components/NavbarWrapper'
import Footer from '@/components/Footer'
import MessengerView from './MessengerView'
import { getCurrentChatUser, getOppositeChatRole } from '@/lib/chat-authorization'
import { redirect } from 'next/navigation'

export default async function MessagesPage() {
  const session = await verifySession()
  const currentUser = await getCurrentChatUser(session.userId)
  if (!currentUser) redirect('/')
  const otherRole = getOppositeChatRole(currentUser.role)
  const validOtherUser = otherRole === 'SELLER'
    ? { role: otherRole, isVerified: true, isApproved: true }
    : { role: otherRole, isVerified: true }

  // Existing conversations
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
        lastAt: msg.createdAt.toISOString(),
        unread: 0,
      })
    }
    if (!msg.isRead && msg.receiverId === currentUser.id) {
      convMap.get(other.id)!.unread++
    }
  }

  const conversations = Array.from(convMap.values())

  // All sellers (for "New Chat" panel — customers can browse and start new conversations)
  const sellers = currentUser.role === 'CUSTOMER'
    ? await prisma.user.findMany({
        where: { role: 'SELLER', isVerified: true, isApproved: true },
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
          currentUserId={currentUser.id}
          currentUserRole={currentUser.role}
          sellers={sellers.map((s) => ({ id: s.id, name: s.name, role: s.role }))}
        />
      </main>
      <Footer />
    </>
  )
}
