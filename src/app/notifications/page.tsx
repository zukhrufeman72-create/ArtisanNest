import { requireCustomer } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { Bell, CheckCircle, ShoppingBag, Package, Tag, Info } from 'lucide-react'
import Link from 'next/link'

const TYPE_ICON: Record<string, React.ElementType> = {
  ORDER: ShoppingBag,
  PRODUCT: Package,
  DEAL: Tag,
}

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.floor(hrs / 24)} days ago`
}

export default async function NotificationsPage() {
  const session = await requireCustomer()

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const unread = notifications.filter((n) => !n.isRead).length

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#2D1F1A] flex items-center gap-2">
              <Bell size={22} className="text-[#C8896A]" /> Notifications
            </h1>
            {unread > 0 && (
              <p className="text-sm text-[#9E8079] mt-0.5">{unread} unread</p>
            )}
          </div>
          {unread > 0 && (
            <form action={async () => {
              'use server'
              await prisma.notification.updateMany({
                where: { userId: session.userId, isRead: false },
                data: { isRead: true },
              })
            }}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-[#EAE3DC] text-sm text-[#6B4C3B] hover:bg-[#EAE3DC] transition-colors"
              >
                <CheckCircle size={14} className="text-[#7D9B76]" /> Mark all read
              </button>
            </form>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EAE3DC] py-20 text-center">
            <Bell size={40} className="mx-auto text-[#EAE3DC] mb-4" />
            <p className="text-[#9E8079]">No notifications yet</p>
            <Link href="/" className="mt-4 inline-block text-sm text-[#C8896A] hover:text-[#A8694A] font-medium">
              Continue Shopping →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden divide-y divide-[#F5EFE6]">
            {notifications.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Info
              const inner = (
                <div className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                  n.isRead ? 'hover:bg-[#FAFAF8]' : 'bg-[#FDF8F4] hover:bg-[#F5EFE6]'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    n.isRead ? 'bg-[#F5F0EB] text-[#9E8079]' : 'bg-[#C8896A]/10 text-[#C8896A]'
                  }`}>
                    {n.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.imageUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <Icon size={18} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold ${n.isRead ? 'text-[#9E8079]' : 'text-[#2D1F1A]'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-[#9E8079] shrink-0">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-sm text-[#9E8079] mt-0.5 leading-relaxed">{n.body}</p>
                  </div>

                  {!n.isRead && (
                    <div className="w-2 h-2 bg-[#C8896A] rounded-full mt-2 shrink-0" />
                  )}
                </div>
              )

              return n.link ? (
                <Link key={n.id} href={n.link}>{inner}</Link>
              ) : (
                <div key={n.id}>{inner}</div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
