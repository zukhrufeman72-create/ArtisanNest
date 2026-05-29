'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Plus, Calendar, Percent, DollarSign, Trash2, X, RefreshCw } from 'lucide-react'

interface Deal {
  id: number
  title: string
  discountType: string
  discountValue: number
  startDate: string
  endDate: string
  status: 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  bannerImage: string | null
  isGlobal: boolean
  createdAt: string
  creator: { id: number; name: string }
  products: { product: { id: number; name: string; price: number } }[]
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30',
  SCHEDULED: 'bg-blue-500/15 text-blue-600 border border-blue-500/30',
  EXPIRED: 'bg-[#9E8079]/15 text-[#9E8079] border border-[#9E8079]/30',
  CANCELLED: 'bg-rose-500/15 text-rose-600 border border-rose-500/30',
}

const EMPTY_FORM = {
  title: '', discountType: 'PERCENTAGE', discountValue: 10,
  startDate: '', endDate: '', bannerImage: '', isGlobal: false,
}

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  const load = useCallback(() => {
    Promise.resolve()
      .then(() => setLoading(true))
      .then(() => fetch('/api/deals'))
      .then((r) => r.json())
      .then((data: { deals?: Deal[] }) => {
        setDeals(data.deals ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function save() {
    if (!form.title || !form.startDate || !form.endDate) return
    setSaving(true)
    await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        discountValue: Number(form.discountValue),
      }),
    })
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaving(false)
    void load()
  }

  async function deleteDeal(id: number) {
    if (!confirm('Delete this deal?')) return
    setDeleting(id)
    await fetch(`/api/deals/${id}`, { method: 'DELETE' })
    setDeleting(null)
    void load()
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/deals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    void load()
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#2D1F1A]">Sales & Deals</h1>
            <p className="text-sm text-[#9E8079] mt-0.5">Manage discount campaigns and flash sales</p>
          </div>
          <div className="flex gap-3">
            <button onClick={load} className="p-2 bg-white rounded-xl border border-[#EAE3DC] hover:bg-[#F5F0EB] transition-colors">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#C8896A] text-white rounded-xl text-sm font-medium hover:bg-[#B8795A] transition-colors"
            >
              <Plus size={16} />
              New Deal
            </button>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#2D1F1A]">Create New Deal</h3>
              <button onClick={() => setShowForm(false)} className="text-[#9E8079] hover:text-[#2D1F1A]"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-[#2D1F1A]">Deal Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C8896A]"
                  placeholder="e.g. Summer Sale 2026"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#2D1F1A]">Discount Type</label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                  className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C8896A]"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (PKR)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#2D1F1A]">
                  Discount Value {form.discountType === 'PERCENTAGE' ? '(%)' : '(PKR)'}
                </label>
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                  className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C8896A]"
                  min={0}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#2D1F1A]">Start Date</label>
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C8896A]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#2D1F1A]">End Date</label>
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C8896A]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#2D1F1A]">Banner Image URL</label>
                <input
                  value={form.bannerImage}
                  onChange={(e) => setForm({ ...form, bannerImage: e.target.value })}
                  className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C8896A]"
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="isGlobal"
                  checked={form.isGlobal}
                  onChange={(e) => setForm({ ...form, isGlobal: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#C8896A]"
                />
                <label htmlFor="isGlobal" className="text-sm text-[#2D1F1A]">Global deal (applies to all products)</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={save}
                disabled={saving || !form.title || !form.startDate || !form.endDate}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#C8896A] text-white rounded-xl text-sm font-medium hover:bg-[#B8795A] disabled:opacity-50 transition-colors"
              >
                {saving && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                Create Deal
              </button>
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-[#F5F0EB] text-[#2D1F1A] rounded-xl text-sm font-medium hover:bg-[#EAE3DC] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Deals Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-[#C8896A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : deals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-12 text-center text-[#9E8079]">
            No deals yet. Create your first campaign.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {deals.map((deal) => (
              <div key={deal.id} className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden hover:shadow-md transition-shadow">
                {deal.bannerImage && (
                  <div className="h-32 bg-[#F5F0EB] relative overflow-hidden">
                    <Image src={deal.bannerImage} alt={deal.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-[#2D1F1A] text-sm leading-tight">{deal.title}</h3>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[deal.status]}`}>
                      {deal.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1 text-[#C8896A] font-bold text-lg">
                      {deal.discountType === 'PERCENTAGE' ? <Percent size={16} /> : <DollarSign size={16} />}
                      {deal.discountValue}
                      {deal.discountType === 'PERCENTAGE' ? '% OFF' : ' OFF'}
                    </div>
                    {deal.isGlobal && (
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Global</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#9E8079] mb-3">
                    <Calendar size={12} />
                    {new Date(deal.startDate).toLocaleDateString()} → {new Date(deal.endDate).toLocaleDateString()}
                  </div>
                  <p className="text-xs text-[#9E8079] mb-3">{deal.products.length} products • by {deal.creator.name}</p>
                  <div className="flex gap-2">
                    {deal.status === 'SCHEDULED' && (
                      <button
                        onClick={() => updateStatus(deal.id, 'ACTIVE')}
                        className="flex-1 py-1.5 text-xs bg-emerald-500/10 text-emerald-700 rounded-lg hover:bg-emerald-500/20 transition-colors"
                      >
                        Activate
                      </button>
                    )}
                    {deal.status === 'ACTIVE' && (
                      <button
                        onClick={() => updateStatus(deal.id, 'CANCELLED')}
                        className="flex-1 py-1.5 text-xs bg-rose-500/10 text-rose-700 rounded-lg hover:bg-rose-500/20 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => deleteDeal(deal.id)}
                      disabled={deleting === deal.id}
                      className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
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
