import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import NavbarWrapper from '@/components/NavbarWrapper'
import Footer from '@/components/Footer'
import ChatWindow from '@/components/ChatWindow'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { z } from 'zod'
import { getAuthorizedChatPair } from '@/lib/chat-authorization'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const session = await verifySession()
  const parsedUserId = z.coerce.number().int().positive().safeParse((await params).userId)
  if (!parsedUserId.success) redirect('/messages')

  const pair = await getAuthorizedChatPair(session.userId, parsedUserId.data)
  if (!pair) redirect('/messages')

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

  await prisma.message.updateMany({
    where: { senderId: pair.otherUser.id, receiverId: pair.currentUser.id, isRead: false },
    data: { isRead: true },
  })

  return (
    <>
      <NavbarWrapper />
      <main className="min-h-screen bg-[#FAF7F4] py-6 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <Link
            href="/messages"
            className="inline-flex items-center gap-2 text-sm text-[#9E8079] hover:text-[#C8896A] transition-colors"
          >
            <ArrowLeft size={15} /> All Messages
          </Link>

          <div style={{ height: '600px' }}>
            <ChatWindow
              currentUserId={pair.currentUser.id}
              otherUserId={pair.otherUser.id}
              initialMessages={messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
              otherUser={{
                id: pair.otherUser.id,
                name: pair.otherUser.name,
                role: pair.otherUser.role,
              }}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
