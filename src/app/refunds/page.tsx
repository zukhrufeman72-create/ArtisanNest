'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react'

interface Order {
  id: number
  totalPrice: number
  status: string
  createdAt: string
}

interface Refund {
  id: number
  amount: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED'
  adminNote: string | null
  createdAt: string
  order: { id: number; total: number; createdAt: string }
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  PENDING: { color: 'text-amber-500 bg-amber-500/10', icon: Clock, label: 'Pending Review' },
  APPROVED: { color: 'text-emerald-600 bg-emerald-500/10', icon: CheckCircle, label: 'Approved' },
  REJECTED: { color: 'text-rose-600 bg-rose-500/10', icon: XCircle, label: 'Rejected' },
  PROCESSED: { color: 'text-blue-600 bg-blue-500/10', icon: DollarSign, label: 'Processed' },
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ orderId: '', reason: '', amount: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [refRes, orderRes] = await Promise.all([
      fetch('/api/refunds'),
      fetch('/api/orders?status=DELIVERED&limit=20'),
    ])
    const [refData, orderData] = await Promise.all([refRes.json(), orderRes.json()])
    setRefunds(refData.refunds ?? [])
    setOrders(orderData.orders ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function submit() {
    setError('')
    if (!form.orderId || !form.reason || !form.amount) {
      setError('All fields are required.')
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/refunds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: Number(form.orderId),
        reason: form.reason,
        amount: Number(form.amount),
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to submit.'); setSubmitting(false); return }
    setForm({ orderId: '', reason: '', amount: '' })
    setShowForm(false)
    setSubmitting(false)
    void load()
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB] p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#2D1F1A]">Refund Requests</h1>
            <p className="text-sm text-[#9E8079]">Request a refund for a delivered order</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#C8896A] text-white rounded-xl text-sm font-medium hover:bg-[#B8795A] transition-colors"
          >
            <Plus size={16} />
            New Request
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#2D1F1A]">Request Refund</h3>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-[#9E8079]" /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#2D1F1A]">Select Order</label>
                <select
                  value={form.orderId}
                  onChange={(e) => {
                    const order = orders.find((o) => String(o.id) === e.target.value)
                    setForm({ ...form, orderId: e.target.value, amount: order ? String(order.totalPrice) : '' })
                  }}
                  className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C8896A]"
                >
                  <option value="">Choose a delivered order...</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      Order #{o.id} — PKR {o.totalPrice.toLocaleString()} ({new Date(o.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#2D1F1A]">Refund Amount (PKR)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C8896A]"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#2D1F1A]">Reason for Refund</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  rows={4}
                  className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#C8896A]"
                  placeholder="Please describe why you are requesting a refund..."
                />
              </div>
              <button
                onClick={submit}
                disabled={submitting}
                className="w-full py-3 bg-[#C8896A] text-white rounded-xl font-medium hover:bg-[#B8795A] disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Refund Request'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-2 border-[#C8896A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : refunds.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-12 text-center text-[#9E8079]">
            No refund requests yet.
          </div>
        ) : (
          <div className="space-y-3">
            {refunds.map((r) => {
              const cfg = STATUS_CONFIG[r.status]
              const Icon = cfg.icon
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-[#EAE3DC] p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-[#2D1F1A] text-sm">Order #{r.order.id}</h4>
                        <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                          <Icon size={11} />
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-[#9E8079]">{r.reason}</p>
                      {r.adminNote && (
                        <p className="text-xs text-[#C8896A] mt-2 bg-[#C8896A]/5 px-3 py-1.5 rounded-lg">
                          Admin note: {r.adminNote}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-[#2D1F1A]">PKR {r.amount.toLocaleString()}</p>
                      <p className="text-xs text-[#9E8079]">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
