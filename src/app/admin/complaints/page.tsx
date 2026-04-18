import { prisma } from '@/lib/prisma'
import { MessageSquare, CheckCircle, XCircle, Clock, User } from 'lucide-react'
import ComplaintActions from './ComplaintActions'

export default async function AdminComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams

  const complaints = await prisma.complaint.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      subject: true,
      message: true,
      status: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
      product: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
    },
  })

  const counts = await prisma.complaint.groupBy({ by: ['status'], _count: true })
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]))

  const FILTERS = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Rejected', value: 'REJECTED' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Complaints</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">
          {complaints.length} complaint{complaints.length !== 1 ? 's' : ''}
          {countMap['PENDING'] > 0 && (
            <span className="ml-2 text-amber-600 font-semibold">· {countMap['PENDING']} pending</span>
          )}
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] px-5 py-4 flex flex-wrap gap-3 items-center">
        {FILTERS.map((f) => {
          const count = f.value ? (countMap[f.value] ?? 0) : Object.values(countMap).reduce((a, b) => a + b, 0)
          const active = (status ?? '') === f.value
          return (
            <a
              key={f.value}
              href={f.value ? `/admin/complaints?status=${f.value}` : '/admin/complaints'}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                active ? 'bg-[#C8896A] text-white shadow-sm' : 'bg-[#F5F2EF] text-[#6B4C3B] hover:bg-[#EAE3DC]'
              }`}
            >
              {f.label}
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-[#EAE3DC]'}`}>
                {count}
              </span>
            </a>
          )
        })}
      </div>

      {/* List */}
      {complaints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#7D9B76]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-[#7D9B76]" />
          </div>
          <p className="font-semibold text-[#2D1F1A]">No complaints found</p>
          <p className="text-sm text-[#9E8079] mt-1">All clear!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => {
            const StatusIcon = c.status === 'RESOLVED' ? CheckCircle : c.status === 'REJECTED' ? XCircle : Clock
            const statusColor =
              c.status === 'RESOLVED' ? 'text-[#7D9B76] bg-[#7D9B76]/8' :
              c.status === 'REJECTED' ? 'text-rose-500 bg-rose-50' :
              'text-amber-600 bg-amber-50'

            return (
              <div key={c.id} className="bg-white rounded-2xl border border-[#EAE3DC] p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-[#2D1F1A] text-sm">{c.subject}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
                        <StatusIcon size={11} /> {c.status}
                      </span>
                    </div>
                    <p className="text-sm text-[#6B4C3B] leading-relaxed line-clamp-3 mt-1">{c.message}</p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-[#9E8079]">
                      <span className="flex items-center gap-1">
                        <User size={11} /> {c.user.name} · {c.user.email}
                      </span>
                      {c.product && <span className="flex items-center gap-1"><MessageSquare size={11} /> {c.product.name}</span>}
                      {c.seller && <span>Seller: {c.seller.name}</span>}
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {c.status === 'PENDING' && <ComplaintActions complaintId={c.id} />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
