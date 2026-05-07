'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Calendar, DollarSign, Clock, CheckCircle, Sparkles } from 'lucide-react'

interface CustomOrder {
  id: number
  title: string
  description: string
  budget: number | null
  deadline: string | null
  status: string
  quotedPrice: number | null
  createdAt: string
  seller: { id: number; name: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-600',
  ACCEPTED: 'bg-blue-500/10 text-blue-600',
  IN_PROGRESS: 'bg-purple-500/10 text-purple-600',
  COMPLETED: 'bg-emerald-500/10 text-emerald-600',
  REJECTED: 'bg-rose-500/10 text-rose-600',
  CANCELLED: 'bg-[#9E8079]/10 text-[#9E8079]',
}

const EMPTY_FORM = {
  title: '', description: '', budget: '', deadline: '', attachments: '',
}

export default function CustomOrdersPage() {
  const [orders, setOrders] = useState<CustomOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/custom-orders')
    const data = await res.json()
    setOrders(data.orders ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function submit() {
    setError('')
    if (!form.title || !form.description) {
      setError('Title and description are required.')
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/custom-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        budget: form.budget ? Number(form.budget) : undefined,
        deadline: form.deadline || undefined,
        attachments: form.attachments ? form.attachments.split(',').map((u) => u.trim()).filter(Boolean) : undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to submit.'); setSubmitting(false); return }
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSubmitting(false)
    void load()
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB] p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#2D1F1A]">Custom Orders</h1>
            <p className="text-sm text-[#9E8079]">Request a custom handcrafted item</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#C8896A] text-white rounded-xl text-sm font-medium hover:bg-[#B8795A] transition-colors"
          >
            <Plus size={16} />
            New Request
          </button>
        </div>

        {/* Hero banner */}
        <div className="bg-gradient-to-r from-[#C8896A] to-[#B8795A] rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles size={20} />
            <h3 className="font-bold text-lg">Request Something Unique</h3>
          </div>
          <p className="text-white/80 text-sm">
            Have a specific design in mind? Describe your vision and our skilled artisans will bring it to life.
          </p>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-[#2D1F1A]">Describe Your Custom Order</h3>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-[#9E8079]" /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#2D1F1A]">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C8896A]"
                  placeholder="e.g. Custom embroidered wall art"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#2D1F1A]">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={5}
                  className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#C8896A]"
                  placeholder="Describe the item you want — size, colors, materials, design details, etc."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#2D1F1A]">Budget (PKR, optional)</label>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C8896A]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#2D1F1A]">Deadline (optional)</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C8896A]"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#2D1F1A]">Reference Image URLs (comma-separated)</label>
                <input
                  value={form.attachments}
                  onChange={(e) => setForm({ ...form, attachments: e.target.value })}
                  className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C8896A]"
                  placeholder="https://..., https://..."
                />
              </div>
              <button
                onClick={submit}
                disabled={submitting}
                className="w-full py-3 bg-[#C8896A] text-white rounded-xl font-medium hover:bg-[#B8795A] disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Custom Order'}
              </button>
            </div>
          </div>
        )}

        {/* Orders list */}
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-2 border-[#C8896A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-12 text-center text-[#9E8079]">
            No custom orders yet.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl border border-[#EAE3DC] p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-[#2D1F1A] text-sm">{o.title}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {o.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-[#9E8079] line-clamp-2">{o.description}</p>
                    <div className="flex gap-4 mt-2 flex-wrap">
                      {o.budget && (
                        <div className="flex items-center gap-1 text-xs text-[#9E8079]">
                          <DollarSign size={12} />
                          Budget: PKR {o.budget.toLocaleString()}
                        </div>
                      )}
                      {o.deadline && (
                        <div className="flex items-center gap-1 text-xs text-[#9E8079]">
                          <Calendar size={12} />
                          By {new Date(o.deadline).toLocaleDateString()}
                        </div>
                      )}
                      {o.seller && (
                        <div className="flex items-center gap-1 text-xs text-[#9E8079]">
                          Seller: {o.seller.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {o.quotedPrice && (
                      <p className="font-bold text-[#C8896A]">
                        Quote: PKR {o.quotedPrice.toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-[#9E8079]">{new Date(o.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
