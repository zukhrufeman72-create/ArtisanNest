'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, DollarSign, Calendar, ChevronDown, ChevronUp } from 'lucide-react'

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
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-600',
  ACCEPTED: 'bg-blue-500/10 text-blue-600',
  IN_PROGRESS: 'bg-purple-500/10 text-purple-600',
  COMPLETED: 'bg-emerald-500/10 text-emerald-600',
  REJECTED: 'bg-rose-500/10 text-rose-600',
  CANCELLED: 'bg-[#9E8079]/10 text-[#9E8079]',
}

export default function SellerCustomOrdersPage() {
  const [orders, setOrders] = useState<CustomOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [quoteMap, setQuoteMap] = useState<Record<number, string>>({})
  const [processing, setProcessing] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/custom-orders')
    const data = await res.json()
    setOrders(data.orders ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function respond(id: number, status: string, quotedPrice?: number) {
    setProcessing(id)
    await fetch(`/api/custom-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...(quotedPrice ? { quotedPrice } : {}) }),
    })
    setProcessing(null)
    void load()
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#2D1F1A]">Custom Order Requests</h1>
            <p className="text-sm text-[#9E8079]">Review and respond to customer requests</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-[#EAE3DC] text-sm hover:bg-[#EAE3DC] transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-[#C8896A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-12 text-center text-[#9E8079]">
            No custom order requests yet.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
                <div
                  className="p-5 cursor-pointer hover:bg-[#F5F0EB]/30 transition-colors"
                  onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-[#2D1F1A]">{o.title}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] ?? ''}`}>
                          {o.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-[#9E8079] line-clamp-1">{o.description}</p>
                      <div className="flex gap-3 mt-1 text-xs text-[#9E8079]">
                        {o.budget && <span>Budget: PKR {o.budget.toLocaleString()}</span>}
                        {o.deadline && <span>By {new Date(o.deadline).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {o.quotedPrice && (
                        <span className="font-bold text-[#C8896A] text-sm">PKR {o.quotedPrice.toLocaleString()}</span>
                      )}
                      {expanded === o.id ? <ChevronUp size={16} className="text-[#9E8079]" /> : <ChevronDown size={16} className="text-[#9E8079]" />}
                    </div>
                  </div>
                </div>

                {expanded === o.id && (
                  <div className="border-t border-[#EAE3DC] p-5 space-y-4 bg-[#F5F0EB]/20">
                    <div>
                      <p className="text-sm font-medium text-[#2D1F1A] mb-1">Full Description</p>
                      <p className="text-sm text-[#9E8079] bg-white rounded-xl p-3 border border-[#EAE3DC]">{o.description}</p>
                    </div>
                    <p className="text-sm text-[#9E8079]">From: <span className="text-[#2D1F1A] font-medium">{o.customer.name}</span> ({o.customer.email})</p>

                    {o.status === 'PENDING' && (
                      <div className="flex gap-3 flex-wrap items-end">
                        <div className="flex-1 min-w-40">
                          <label className="text-sm font-medium text-[#2D1F1A]">Your Quote (PKR)</label>
                          <input
                            type="number"
                            value={quoteMap[o.id] ?? ''}
                            onChange={(e) => setQuoteMap((prev) => ({ ...prev, [o.id]: e.target.value }))}
                            placeholder="Enter your price..."
                            className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C8896A]"
                          />
                        </div>
                        <button
                          disabled={processing === o.id}
                          onClick={() => respond(o.id, 'ACCEPTED', quoteMap[o.id] ? Number(quoteMap[o.id]) : undefined)}
                          className="px-5 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          disabled={processing === o.id}
                          onClick={() => respond(o.id, 'REJECTED')}
                          className="px-5 py-2 bg-rose-500/10 text-rose-600 rounded-xl text-sm font-medium hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                    {o.status === 'ACCEPTED' && (
                      <button
                        disabled={processing === o.id}
                        onClick={() => respond(o.id, 'IN_PROGRESS')}
                        className="px-5 py-2 bg-[#C8896A] text-white rounded-xl text-sm font-medium hover:bg-[#B8795A] disabled:opacity-50 transition-colors"
                      >
                        Mark In Progress
                      </button>
                    )}
                    {o.status === 'IN_PROGRESS' && (
                      <button
                        disabled={processing === o.id}
                        onClick={() => respond(o.id, 'COMPLETED')}
                        className="px-5 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
