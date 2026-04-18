import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import NavbarWrapper from '@/components/NavbarWrapper'
import Footer from '@/components/Footer'
import ChatWindow from '@/components/ChatWindow'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const session = await verifySession()
  const { userId } = await params
  const otherId = parseInt(userId)

  if (isNaN(otherId) || otherId === session.userId) redirect('/')

  const [other, messages] = await Promise.all([
    prisma.user.findUnique({
      where: { id: otherId },
      select: { id: true, name: true, role: true },
    }),
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
  ])

  if (!other) redirect('/')

  await prisma.message.updateMany({
    where: { senderId: otherId, receiverId: session.userId, isRead: false },
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
              currentUserId={session.userId}
              otherUserId={otherId}
              initialMessages={messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
              otherUser={other}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
