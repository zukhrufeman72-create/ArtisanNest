'use client'

import { useState } from 'react'
import { Loader2, ChevronDown, CheckCheck } from 'lucide-react'

const STATUS_OPTIONS = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const
type OrderStatus = (typeof STATUS_OPTIONS)[number]

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING:   'Pending',
  PAID:      'Confirmed / Packed',
  SHIPPED:   'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING:   'text-amber-600 bg-amber-50 border-amber-200',
  PAID:      'text-blue-600 bg-blue-50 border-blue-200',
  SHIPPED:   'text-purple-600 bg-purple-50 border-purple-200',
  DELIVERED: 'text-[#7D9B76] bg-[#7D9B76]/10 border-[#7D9B76]/30',
  CANCELLED: 'text-rose-500 bg-rose-50 border-rose-200',
}

type Props = {
  orderId: number
  currentStatus: OrderStatus
}

export default function SellerOrderStatusUpdate({ orderId, currentStatus }: Props) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function updateStatus(newStatus: OrderStatus) {
    if (newStatus === status) { setOpen(false); return }
    setSaving(true)
    setError('')
    setOpen(false)
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setStatus(newStatus)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Failed to update')
      }
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
          ${STATUS_COLORS[status]} hover:opacity-80 disabled:opacity-60`}
      >
        {saving
          ? <Loader2 size={11} className="animate-spin" />
          : saved
            ? <CheckCheck size={11} />
            : null
        }
        {STATUS_LABELS[status]}
        {!saving && <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-[#EAE3DC] z-20 overflow-hidden">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                className={`w-full px-3.5 py-2.5 text-left text-xs font-semibold transition-colors
                  hover:bg-[#F5EFE6] flex items-center justify-between
                  ${s === status ? 'text-[#C8896A] bg-[#C8896A]/5' : 'text-[#2D1F1A]'}`}
              >
                {STATUS_LABELS[s]}
                {s === status && <CheckCheck size={11} className="text-[#C8896A]" />}
              </button>
            ))}
          </div>
        </>
      )}

      {error && (
        <p className="absolute top-full mt-1 left-0 text-[10px] text-rose-500 whitespace-nowrap bg-white border border-rose-100 px-2 py-1 rounded-lg shadow-sm z-30">
          {error}
        </p>
      )}
    </div>
  )
}
