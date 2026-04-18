import { getOptionalSession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import SupportForm from './SupportForm'
import { MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default async function SupportPage() {
  const session = await getOptionalSession()

  const myComplaints = session?.userId
    ? await prisma.complaint.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, subject: true, status: true, createdAt: true },
      })
    : []

  return (
    <div className="min-h-screen bg-[#FAF7F4] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#C8896A]/10 flex items-center justify-center">
              <MessageSquare size={20} className="text-[#C8896A]" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Customer Support</h1>
          </div>
          <p className="text-sm text-[#9E8079] ml-13">
            Have a problem? Submit a complaint and we'll get back to you.
          </p>
        </div>

        {/* Complaint form */}
        <SupportForm isLoggedIn={!!session?.userId} />

        {/* My previous complaints */}
        {myComplaints.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-[#2D1F1A] mb-3">My Complaints</h2>
            <div className="space-y-3">
              {myComplaints.map((c) => {
                const Icon =
                  c.status === 'RESOLVED' ? CheckCircle :
                  c.status === 'REJECTED' ? AlertCircle : Clock
                const color =
                  c.status === 'RESOLVED' ? 'text-[#7D9B76]' :
                  c.status === 'REJECTED' ? 'text-rose-500' : 'text-amber-500'
                const bg =
                  c.status === 'RESOLVED' ? 'bg-[#7D9B76]/8' :
                  c.status === 'REJECTED' ? 'bg-rose-50' : 'bg-amber-50'
                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-xl border border-[#EAE3DC] px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#2D1F1A] truncate">{c.subject}</p>
                      <p className="text-xs text-[#9E8079] mt-0.5">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${color} ${bg}`}>
                      <Icon size={12} /> {c.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
