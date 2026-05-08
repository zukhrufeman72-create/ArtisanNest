'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Ban, Loader2, AlertCircle } from 'lucide-react'

type Props = {
  orderId: number
  status: string
}

export default function CustomerOrderActions({ orderId, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function doAction(action: string) {
    setError('')
    setLoading(action)
    try {
      const res = await fetch(`/api/custom-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Action failed. Please try again.')
      } else {
        router.refresh()
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Quotation actions — shown inline in quotation section */}
      {status === 'QUOTED' && (
        <div className="space-y-2">
          <p className="text-sm text-[#6B4C3B] font-medium">Review the quotation above and respond:</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => doAction('accept_quotation')}
              disabled={loading !== null}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
            >
              {loading === 'accept_quotation' ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              Accept Quotation
            </button>
            <button
              onClick={() => doAction('reject_quotation')}
              disabled={loading !== null}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 disabled:opacity-50 text-amber-700 text-sm font-semibold rounded-xl transition-all"
            >
              {loading === 'reject_quotation' ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
              Request Revision
            </button>
          </div>
        </div>
      )}

      {/* Cancel — shown for non-quoted statuses */}
      {!['QUOTED', 'IN_PROGRESS', 'ADVANCE_PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(status) && (
        <button
          onClick={() => {
            if (confirm('Are you sure you want to cancel this custom order?')) {
              doAction('cancel')
            }
          }}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 text-rose-700 text-sm font-semibold rounded-xl transition-all"
        >
          {loading === 'cancel' ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
          Cancel Order
        </button>
      )}
    </div>
  )
}
