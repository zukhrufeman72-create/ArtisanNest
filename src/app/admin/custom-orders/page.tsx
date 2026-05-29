'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ChevronLeft, ChevronRight, DollarSign, Calendar, User } from 'lucide-react'

interface CustomOrder {
  id: number
  title: string
  description: string
  budget: number | null
  deadline: string | null
  status: string
  quotedPrice: number | null
  createdAt: string
  customer: { id: number; name: string; email: string }
  seller: { id: number; name: string; email: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/15 text-amber-600 border border-amber-500/30',
  REVIEWING: 'bg-blue-500/15 text-blue-600 border border-blue-500/30',
  QUOTED: 'bg-purple-500/15 text-purple-600 border border-purple-500/30',
  ACCEPTED: 'bg-[#7D9B76]/15 text-[#7D9B76] border border-[#7D9B76]/30',
  IN_PROGRESS: 'bg-[#C8896A]/15 text-[#C8896A] border border-[#C8896A]/30',
  COMPLETED: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30',
  REJECTED: 'bg-rose-500/15 text-rose-600 border border-rose-500/30',
  CANCELLED: 'bg-[#9E8079]/15 text-[#9E8079] border border-[#9E8079]/30',
}

export default function AdminCustomOrdersPage() {
  const [orders, setOrders] = useState<CustomOrder[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page) })
    if (status) params.set('status', status)
    Promise.resolve()
      .then(() => setLoading(true))
      .then(() => fetch(`/api/custom-orders?${params}`))
      .then((r) => r.json())
      .then((data: { orders?: CustomOrder[]; total?: number; pages?: number }) => {
        setOrders(data.orders ?? [])
        setTotal(data.total ?? 0)
        setPages(data.pages ?? 1)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page, status])

  useEffect(() => { load() }, [load])

  async function updateStatus(id: number, newStatus: string, sellerId?: number) {
    await fetch(`/api/custom-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, ...(sellerId ? { sellerId } : {}) }),
    })
    void load()
  }

  const statusOptions = ['PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED']

  return (
    <div className="min-h-screen bg-[#F5F0EB] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2D1F1A]">Custom Orders</h1>
            <p className="text-sm text-[#9E8079] mt-0.5">{total} custom order requests</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-[#EAE3DC] text-sm hover:bg-[#EAE3DC] transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {['', ...statusOptions].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                status === s ? 'bg-[#C8896A] text-white' : 'bg-white border border-[#EAE3DC] text-[#9E8079] hover:border-[#C8896A]'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-[#C8896A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#EAE3DC] p-12 text-center text-[#9E8079]">No custom orders found.</div>
          ) : orders.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
              <div
                className="p-5 cursor-pointer hover:bg-[#F5F0EB]/30 transition-colors"
                onClick={() => setExpanded(expanded === o.id ? null : o.id)}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-[#2D1F1A]">{o.title}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] ?? ''}`}>
                        {o.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-[#9E8079] flex-wrap">
                      <span className="flex items-center gap-1"><User size={11} /> {o.customer.name}</span>
                      {o.budget && <span className="flex items-center gap-1"><DollarSign size={11} /> PKR {o.budget.toLocaleString()}</span>}
                      {o.deadline && <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(o.deadline).toLocaleDateString()}</span>}
                      <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {o.quotedPrice && (
                    <div className="text-right">
                      <p className="text-xs text-[#9E8079]">Quoted</p>
                      <p className="font-bold text-[#C8896A]">PKR {o.quotedPrice.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {expanded === o.id && (
                <div className="border-t border-[#EAE3DC] p-5 bg-[#F5F0EB]/30 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-[#2D1F1A] mb-1">Description</p>
                    <p className="text-sm text-[#9E8079] bg-white rounded-xl p-3 border border-[#EAE3DC]">{o.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-medium text-[#2D1F1A]">Customer</p>
                      <p className="text-[#9E8079]">{o.customer.name} · {o.customer.email}</p>
                    </div>
                    {o.seller && (
                      <div>
                        <p className="font-medium text-[#2D1F1A]">Assigned Seller</p>
                        <p className="text-[#9E8079]">{o.seller.name}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {statusOptions.filter((s) => s !== o.status).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(o.id, s)}
                        className="px-3 py-1.5 text-xs border border-[#EAE3DC] rounded-xl text-[#2D1F1A] hover:bg-white hover:border-[#C8896A] transition-colors"
                      >
                        → {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-xl border border-[#EAE3DC] disabled:opacity-40 hover:bg-white transition-colors"><ChevronLeft size={16} /></button>
            <span className="text-sm text-[#9E8079]">Page {page} of {pages}</span>
            <button disabled={page === pages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-xl border border-[#EAE3DC] disabled:opacity-40 hover:bg-white transition-colors"><ChevronRight size={16} /></button>
          </div>
        )}
      </div>
    </div>
  )
}
