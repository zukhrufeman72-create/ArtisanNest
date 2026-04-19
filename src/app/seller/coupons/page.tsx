'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Tag, Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight,
  Loader2, AlertCircle, CheckCircle2, X, Percent, DollarSign,
  Calendar, Users, BadgeCheck, BadgeX, ChevronDown, Info,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

type Coupon = {
  id: number
  code: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  minOrderAmount: number
  expiresAt: string | null
  usageLimit: number | null
  usageCount: number
  isActive: boolean
  description: string | null
  createdAt: string
}

type FormState = {
  code: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: string
  minOrderAmount: string
  expiresAt: string
  usageLimit: string
  isActive: boolean
  description: string
}

const emptyForm = (): FormState => ({
  code: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  minOrderAmount: '',
  expiresAt: '',
  usageLimit: '',
  isActive: true,
  description: '',
})

// ── Helpers ────────────────────────────────────────────────────────────────

function formatPKR(n: number) {
  return `Rs. ${Math.round(n).toLocaleString('en-PK')}`
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

// ── Toast ──────────────────────────────────────────────────────────────────

type ToastT = { id: number; message: string; type: 'success' | 'error' }

function Toast({ toasts, remove }: { toasts: ToastT[]; remove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium animate-fade-in-up
            ${t.type === 'success'
              ? 'bg-[#7D9B76] text-white'
              : 'bg-rose-500 text-white'
            }`}
        >
          {t.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {t.message}
          <button onClick={() => remove(t.id)} className="ml-1 opacity-80 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────

function StatusBadge({ coupon }: { coupon: Coupon }) {
  const expired = isExpired(coupon.expiresAt)
  const exhausted = coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit

  if (!coupon.isActive)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F5EFE6] text-[#9E8079]">
        <BadgeX size={11} /> Inactive
      </span>
    )
  if (expired)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-500">
        <Calendar size={11} /> Expired
      </span>
    )
  if (exhausted)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600">
        <Users size={11} /> Limit reached
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#7D9B76]/10 text-[#7D9B76]">
      <BadgeCheck size={11} /> Active
    </span>
  )
}

// ── Main Component ────────────────────────────────────────────────────────

export default function SellerCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [toasts, setToasts] = useState<ToastT[]>([])
  const [toastId, setToastId] = useState(0)

  function addToast(message: string, type: 'success' | 'error') {
    const id = toastId + 1
    setToastId(id)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }

  // ── Load coupons
  async function loadCoupons() {
    setLoading(true)
    try {
      const res = await fetch('/api/coupons')
      if (res.ok) {
        const data = await res.json()
        setCoupons(data.coupons)
      }
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCoupons() }, [])

  // ── Filtered list
  const filtered = useMemo(() => {
    return coupons.filter((c) => {
      const matchSearch =
        !search ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        (c.description ?? '').toLowerCase().includes(search.toLowerCase())
      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ACTIVE' && c.isActive) ||
        (filterStatus === 'INACTIVE' && !c.isActive)
      return matchSearch && matchStatus
    })
  }, [coupons, search, filterStatus])

  // ── Open modal
  function openAdd() {
    setEditingCoupon(null)
    setForm(emptyForm())
    setFormErrors({})
    setModalOpen(true)
  }

  function openEdit(c: Coupon) {
    setEditingCoupon(c)
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minOrderAmount: c.minOrderAmount > 0 ? String(c.minOrderAmount) : '',
      expiresAt: c.expiresAt ? c.expiresAt.split('T')[0] : '',
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : '',
      isActive: c.isActive,
      description: c.description ?? '',
    })
    setFormErrors({})
    setModalOpen(true)
  }

  // ── Validate form
  function validateForm(): boolean {
    const e: Record<string, string> = {}
    if (!form.code.trim()) e.code = 'Coupon code is required'
    else if (!/^[A-Z0-9_-]{3,20}$/.test(form.code.toUpperCase()))
      e.code = '3–20 characters, letters/numbers/dash/underscore'
    if (!form.discountValue || Number(form.discountValue) <= 0)
      e.discountValue = 'Must be greater than 0'
    if (form.discountType === 'PERCENTAGE' && Number(form.discountValue) > 100)
      e.discountValue = 'Percentage cannot exceed 100'
    if (form.minOrderAmount && isNaN(Number(form.minOrderAmount)))
      e.minOrderAmount = 'Must be a valid number'
    if (form.usageLimit && (isNaN(Number(form.usageLimit)) || Number(form.usageLimit) < 1))
      e.usageLimit = 'Must be a positive number'
    if (form.expiresAt && new Date(form.expiresAt) <= new Date())
      e.expiresAt = 'Expiry date must be in the future'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Save coupon
  async function saveCoupon() {
    if (!validateForm()) return
    setSaving(true)
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
        expiresAt: form.expiresAt || null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        isActive: form.isActive,
        description: form.description.trim() || null,
      }

      const url = editingCoupon ? `/api/coupons/${editingCoupon.id}` : '/api/coupons'
      const method = editingCoupon ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        setFormErrors({ submit: data.error ?? 'Failed to save coupon' })
      } else {
        addToast(editingCoupon ? 'Coupon updated!' : 'Coupon created!', 'success')
        setModalOpen(false)
        loadCoupons()
      }
    } catch {
      setFormErrors({ submit: 'Something went wrong' })
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle status
  async function toggleStatus(c: Coupon) {
    try {
      const res = await fetch(`/api/coupons/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !c.isActive }),
      })
      if (res.ok) {
        setCoupons((prev) => prev.map((x) => x.id === c.id ? { ...x, isActive: !x.isActive } : x))
        addToast(`Coupon ${!c.isActive ? 'activated' : 'deactivated'}`, 'success')
      }
    } catch { /* silent */ }
  }

  // ── Delete coupon
  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/coupons/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== deleteTarget.id))
        addToast('Coupon deleted', 'success')
      } else {
        addToast('Failed to delete', 'error')
      }
    } catch {
      addToast('Something went wrong', 'error')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  // ── Stats
  const activeCount = coupons.filter((c) => c.isActive && !isExpired(c.expiresAt)).length
  const totalUsage = coupons.reduce((s, c) => s + c.usageCount, 0)

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Coupons</h1>
          <p className="text-sm text-[#9E8079] mt-0.5">Create and manage discount codes for your products</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-colors shadow-sm"
        >
          <Plus size={16} /> New Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Coupons', value: coupons.length, color: 'text-[#C8896A]', bg: 'bg-[#C8896A]/8' },
          { label: 'Active', value: activeCount, color: 'text-[#7D9B76]', bg: 'bg-[#7D9B76]/8' },
          { label: 'Inactive', value: coupons.length - activeCount, color: 'text-[#9E8079]', bg: 'bg-[#F5EFE6]' },
          { label: 'Total Uses', value: totalUsage, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#EAE3DC] p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-[#9E8079] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48 max-w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C4AEA4]" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E8D5C4] text-sm text-[#2D1F1A]
              bg-white placeholder:text-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A]"
            placeholder="Search coupons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-white border border-[#EAE3DC] rounded-xl p-1">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
                ${filterStatus === s
                  ? 'bg-[#2D1F1A] text-white shadow-sm'
                  : 'text-[#6B4C3B] hover:bg-[#F5EFE6]'
                }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-[#9E8079]">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading coupons...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F5EFE6] flex items-center justify-center mx-auto mb-4">
              <Tag size={22} className="text-[#C8896A]" />
            </div>
            <p className="font-semibold text-[#2D1F1A]">
              {search ? 'No coupons match your search' : 'No coupons yet'}
            </p>
            <p className="text-sm text-[#9E8079] mt-1 mb-5">
              {search ? 'Try a different keyword' : 'Create your first discount coupon'}
            </p>
            {!search && (
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-colors"
              >
                <Plus size={14} /> Create Coupon
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#EAE3DC] bg-[#F9F6F2]">
                    {['Code', 'Discount', 'Min. Order', 'Usage', 'Expiry', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#9E8079] uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EFE6]">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-[#FDF8F4] transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#C8896A]/10 flex items-center justify-center">
                            <Tag size={13} className="text-[#C8896A]" />
                          </div>
                          <div>
                            <p className="font-mono font-bold text-[#2D1F1A] text-xs tracking-wider">{c.code}</p>
                            {c.description && (
                              <p className="text-[10px] text-[#9E8079] truncate max-w-[140px]">{c.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold
                          ${c.discountType === 'PERCENTAGE'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-[#7D9B76]/10 text-[#7D9B76]'
                          }`}>
                          {c.discountType === 'PERCENTAGE'
                            ? <><Percent size={10} />{c.discountValue}% OFF</>
                            : <>{formatPKR(c.discountValue)} OFF</>
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#6B4C3B] text-xs">
                        {c.minOrderAmount > 0 ? formatPKR(c.minOrderAmount) : <span className="text-[#C4AEA4]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-xs text-[#6B4C3B]">
                          <span className="font-semibold">{c.usageCount}</span>
                          {c.usageLimit != null && (
                            <span className="text-[#9E8079]"> / {c.usageLimit}</span>
                          )}
                        </div>
                        {c.usageLimit != null && (
                          <div className="mt-1 h-1 w-16 bg-[#EAE3DC] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#C8896A] rounded-full transition-all"
                              style={{ width: `${Math.min(100, (c.usageCount / c.usageLimit) * 100)}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#6B4C3B]">
                        {c.expiresAt ? (
                          <span className={isExpired(c.expiresAt) ? 'text-rose-400' : ''}>
                            {new Date(c.expiresAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-[#C4AEA4]">No expiry</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge coupon={c} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleStatus(c)}
                            title={c.isActive ? 'Deactivate' : 'Activate'}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                              ${c.isActive
                                ? 'text-[#7D9B76] hover:bg-[#7D9B76]/10'
                                : 'text-[#9E8079] hover:bg-[#F5EFE6]'
                              }`}
                          >
                            {c.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>
                          <button
                            onClick={() => openEdit(c)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9E8079] hover:text-[#C8896A] hover:bg-[#C8896A]/8 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9E8079] hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[#F5EFE6]">
              {filtered.map((c) => (
                <div key={c.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#C8896A]/10 flex items-center justify-center shrink-0">
                        <Tag size={16} className="text-[#C8896A]" />
                      </div>
                      <div>
                        <p className="font-mono font-bold text-[#2D1F1A] text-sm tracking-wider">{c.code}</p>
                        {c.description && (
                          <p className="text-xs text-[#9E8079] mt-0.5 line-clamp-1">{c.description}</p>
                        )}
                      </div>
                    </div>
                    <StatusBadge coupon={c} />
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-full font-bold
                      ${c.discountType === 'PERCENTAGE' ? 'bg-blue-50 text-blue-600' : 'bg-[#7D9B76]/10 text-[#7D9B76]'}`}>
                      {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `${formatPKR(c.discountValue)} OFF`}
                    </span>
                    {c.minOrderAmount > 0 && (
                      <span className="px-2 py-1 rounded-full bg-[#F5EFE6] text-[#6B4C3B]">
                        Min. {formatPKR(c.minOrderAmount)}
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-full bg-[#F5EFE6] text-[#6B4C3B]">
                      {c.usageCount}{c.usageLimit != null ? `/${c.usageLimit}` : ''} uses
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleStatus(c)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                        ${c.isActive
                          ? 'border-[#7D9B76]/30 text-[#7D9B76] hover:bg-[#7D9B76]/8'
                          : 'border-[#EAE3DC] text-[#9E8079] hover:bg-[#F5EFE6]'
                        }`}
                    >
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#EAE3DC] text-[#6B4C3B] hover:bg-[#F5EFE6] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-100 text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Add / Edit Modal ────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !saving && setModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#EAE3DC] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C8896A]/10 flex items-center justify-center">
                  <Tag size={17} className="text-[#C8896A]" />
                </div>
                <div>
                  <h2 className="font-bold text-[#2D1F1A]">
                    {editingCoupon ? 'Edit Coupon' : 'New Coupon'}
                  </h2>
                  <p className="text-xs text-[#9E8079] mt-0.5">
                    {editingCoupon ? `Editing ${editingCoupon.code}` : 'Create a discount code'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#9E8079] hover:bg-[#F5EFE6] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

              {/* Coupon code */}
              <div>
                <label className="block text-sm font-semibold text-[#2D1F1A] mb-1.5">
                  Coupon Code <span className="text-rose-400">*</span>
                </label>
                <input
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold tracking-widest uppercase
                    bg-white outline-none transition-all focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A]
                    ${formErrors.code ? 'border-rose-300 bg-rose-50/20' : 'border-[#E8D5C4]'}`}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                  placeholder="SAVE20"
                  maxLength={20}
                />
                {formErrors.code && (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle size={11} /> {formErrors.code}
                  </p>
                )}
              </div>

              {/* Discount type + value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#2D1F1A] mb-1.5">
                    Discount Type <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8D5C4] text-sm text-[#2D1F1A]
                        bg-white outline-none focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A] appearance-none pr-9"
                      value={form.discountType}
                      onChange={(e) => setForm({ ...form, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (Rs.)</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#C4AEA4] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2D1F1A] mb-1.5">
                    Discount Value <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    {form.discountType === 'PERCENTAGE'
                      ? <Percent size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C4AEA4]" />
                      : <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C4AEA4]" />
                    }
                    <input
                      type="number"
                      min="0"
                      max={form.discountType === 'PERCENTAGE' ? 100 : undefined}
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm text-[#2D1F1A]
                        bg-white outline-none transition-all focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A]
                        ${formErrors.discountValue ? 'border-rose-300' : 'border-[#E8D5C4]'}`}
                      value={form.discountValue}
                      onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                      placeholder={form.discountType === 'PERCENTAGE' ? '20' : '500'}
                    />
                  </div>
                  {formErrors.discountValue && (
                    <p className="mt-1 text-xs text-rose-500">{formErrors.discountValue}</p>
                  )}
                </div>
              </div>

              {/* Min order + Usage limit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#2D1F1A] mb-1.5">
                    Min. Order Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#2D1F1A]
                      bg-white outline-none transition-all focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A]
                      ${formErrors.minOrderAmount ? 'border-rose-300' : 'border-[#E8D5C4]'}`}
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                    placeholder="0 (no minimum)"
                  />
                  {formErrors.minOrderAmount && (
                    <p className="mt-1 text-xs text-rose-500">{formErrors.minOrderAmount}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2D1F1A] mb-1.5">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#2D1F1A]
                      bg-white outline-none transition-all focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A]
                      ${formErrors.usageLimit ? 'border-rose-300' : 'border-[#E8D5C4]'}`}
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    placeholder="Unlimited"
                  />
                  {formErrors.usageLimit && (
                    <p className="mt-1 text-xs text-rose-500">{formErrors.usageLimit}</p>
                  )}
                </div>
              </div>

              {/* Expiry date */}
              <div>
                <label className="block text-sm font-semibold text-[#2D1F1A] mb-1.5">
                  Expiry Date
                </label>
                <input
                  type="date"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#2D1F1A]
                    bg-white outline-none transition-all focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A]
                    ${formErrors.expiresAt ? 'border-rose-300' : 'border-[#E8D5C4]'}`}
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
                {formErrors.expiresAt && (
                  <p className="mt-1 text-xs text-rose-500">{formErrors.expiresAt}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-[#2D1F1A] mb-1.5">
                  Description <span className="text-[#9E8079] font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8D5C4] text-sm text-[#2D1F1A]
                    bg-white outline-none resize-none transition-all focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A]
                    placeholder:text-[#C4AEA4]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. 20% off on all stitched suits"
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between p-4 bg-[#F9F6F2] rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-[#2D1F1A]">Active Status</p>
                  <p className="text-xs text-[#9E8079] mt-0.5">
                    {form.isActive ? 'Coupon is visible and can be used' : 'Coupon is hidden from customers'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`w-12 h-6 rounded-full relative transition-all duration-200
                    ${form.isActive ? 'bg-[#7D9B76]' : 'bg-[#D5C4BB]'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200
                    ${form.isActive ? 'left-6.5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Submit error */}
              {formErrors.submit && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                  <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-600">{formErrors.submit}</p>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-[#EAE3DC] shrink-0 flex gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="flex-1 py-3 border border-[#EAE3DC] text-[#6B4C3B] text-sm font-semibold rounded-xl
                  hover:bg-[#F5EFE6] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCoupon}
                disabled={saving}
                className="flex-1 py-3 bg-[#C8896A] hover:bg-[#A8694A] text-white text-sm font-semibold rounded-xl
                  transition-all hover:shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {saving
                  ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
                  : <>{editingCoupon ? 'Update Coupon' : 'Create Coupon'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ───────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 animate-scale-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-[#2D1F1A] text-center mb-1">Delete Coupon?</h3>
            <p className="text-sm text-[#6B4C3B] text-center mb-1">
              Are you sure you want to delete
            </p>
            <p className="text-center font-mono font-bold text-[#C8896A] text-lg mb-1">{deleteTarget.code}</p>
            <p className="text-xs text-[#9E8079] text-center mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 border border-[#EAE3DC] text-[#6B4C3B] text-sm font-semibold rounded-xl
                  hover:bg-[#F5EFE6] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl
                  transition-all hover:shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {deleting ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} remove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  )
}
