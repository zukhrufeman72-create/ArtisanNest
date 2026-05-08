'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, XCircle, HelpCircle, Send, Play, Truck,
  PackageCheck, Loader2, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react'

type Props = {
  orderId: number
  status: string
  estimatedPrice: number | null
  advancePayment: number | null
  finalPrice: number | null
  deliveryDays: number | null
  quotationNotes: string | null
  trackingNumber: string | null
  courierName: string | null
}

const inputClass = 'mt-1.5 w-full border border-[#EAE3DC] rounded-xl px-3.5 py-2.5 text-sm text-[#2D1F1A] bg-white focus:outline-none focus:border-[#C8896A] focus:ring-2 focus:ring-[#C8896A]/10 transition-all placeholder:text-[#C4AEA4]'
const labelClass = 'block text-xs font-medium text-[#6B4C3B]'

export default function SellerOrderActions({
  orderId, status, estimatedPrice, advancePayment, finalPrice,
  deliveryDays, quotationNotes, trackingNumber, courierName,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [showShipForm, setShowShipForm] = useState(false)
  const [showTrackingForm, setShowTrackingForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  // Quote form state
  const [qPrice, setQPrice] = useState(estimatedPrice?.toString() ?? '')
  const [qAdvance, setQAdvance] = useState(advancePayment?.toString() ?? '')
  const [qFinal, setQFinal] = useState(finalPrice?.toString() ?? '')
  const [qDays, setQDays] = useState(deliveryDays?.toString() ?? '')
  const [qNotes, setQNotes] = useState(quotationNotes ?? '')

  // Ship form state
  const [shipTracking, setShipTracking] = useState(trackingNumber ?? '')
  const [shipCourier, setShipCourier] = useState(courierName ?? '')

  async function doAction(action: string, extra?: Record<string, unknown>) {
    setError('')
    setLoading(action)
    try {
      const res = await fetch(`/api/seller/custom-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
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

  function btn(text: string, icon: React.ReactNode, action: () => void, variant: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' = 'primary', isLoading = false) {
    const variants = {
      primary:   'bg-[#C8896A] hover:bg-[#A8694A] text-white',
      success:   'bg-emerald-500 hover:bg-emerald-600 text-white',
      warning:   'bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700',
      danger:    'bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700',
      secondary: 'bg-[#F5EFE6] hover:bg-[#EAE3DC] border border-[#EAE3DC] text-[#6B4C3B]',
    }
    return (
      <button
        onClick={action}
        disabled={loading !== null}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]}`}
      >
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : icon}
        {text}
      </button>
    )
  }

  if (['COMPLETED', 'DELIVERED', 'CANCELLED', 'REJECTED'].includes(status)) {
    return (
      <div className="p-4 bg-[#F5EFE6] rounded-xl text-sm text-[#9E8079] text-center">
        This order is <span className="font-semibold text-[#2D1F1A]">{status}</span>. No further actions available.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      {/* PENDING — Accept / Reject / Need Details */}
      {status === 'PENDING' && (
        <div className="space-y-3">
          <p className="text-xs text-[#9E8079]">This order is awaiting your response.</p>
          <div className="flex flex-wrap gap-2">
            {btn('Accept Order', <CheckCircle2 size={14} />, () => doAction('accept'), 'success', loading === 'accept')}
            {btn('Need More Details', <HelpCircle size={14} />, () => doAction('need_more_details'), 'warning', loading === 'need_more_details')}
            {btn('Reject', <XCircle size={14} />, () => setShowRejectForm(true), 'danger')}
          </div>
          {showRejectForm && (
            <div className="space-y-2 p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <label className={labelClass}>Reason for rejection</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} className={inputClass} placeholder="Explain why you cannot fulfil this order…" />
              <div className="flex gap-2">
                {btn('Confirm Rejection', <XCircle size={13} />, () => doAction('reject', { reason: rejectReason }), 'danger', loading === 'reject')}
                <button onClick={() => setShowRejectForm(false)} className="text-xs text-[#9E8079] hover:text-[#2D1F1A]">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REVIEWING — Send Quotation / Need Details */}
      {status === 'REVIEWING' && (
        <div className="space-y-3">
          <p className="text-xs text-[#9E8079]">You&apos;re reviewing this order. Send a price quotation or request more info.</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowQuoteForm((v) => !v)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#C8896A] hover:bg-[#A8694A] text-white transition-all"
            >
              <Send size={14} />
              Send Quotation
              {showQuoteForm ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {btn('Need More Details', <HelpCircle size={14} />, () => doAction('need_more_details'), 'warning', loading === 'need_more_details')}
          </div>
          {showQuoteForm && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Total Price (PKR) *</label>
                  <input type="number" value={qPrice} onChange={(e) => setQPrice(e.target.value)} className={inputClass} placeholder="e.g. 5000" />
                </div>
                <div>
                  <label className={labelClass}>Advance Payment (PKR)</label>
                  <input type="number" value={qAdvance} onChange={(e) => setQAdvance(e.target.value)} className={inputClass} placeholder="e.g. 2000" />
                </div>
                <div>
                  <label className={labelClass}>Remaining Amount (PKR)</label>
                  <input type="number" value={qFinal} onChange={(e) => setQFinal(e.target.value)} className={inputClass} placeholder="e.g. 3000" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Delivery Days</label>
                <input type="number" value={qDays} onChange={(e) => setQDays(e.target.value)} className={inputClass} placeholder="e.g. 7" />
              </div>
              <div>
                <label className={labelClass}>Notes for Customer</label>
                <textarea value={qNotes} onChange={(e) => setQNotes(e.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder="Explain your pricing, what's included, timeline details…" />
              </div>
              <button
                disabled={!qPrice || loading !== null}
                onClick={() => doAction('send_quotation', {
                  estimatedPrice: Number(qPrice),
                  advancePayment: qAdvance ? Number(qAdvance) : undefined,
                  finalPrice: qFinal ? Number(qFinal) : undefined,
                  deliveryDays: qDays ? Number(qDays) : undefined,
                  quotationNotes: qNotes || undefined,
                })}
                className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
              >
                {loading === 'send_quotation' ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Send Quotation to Customer
              </button>
            </div>
          )}
        </div>
      )}

      {/* NEED_MORE_DETAILS — still can send quotation */}
      {status === 'NEED_MORE_DETAILS' && (
        <div className="space-y-3">
          <p className="text-xs text-[#9E8079]">Waiting for the customer to provide more details. You can still send a quotation once ready.</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowQuoteForm((v) => !v)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#C8896A] hover:bg-[#A8694A] text-white transition-all"
            >
              <Send size={14} />
              Send Quotation
              {showQuoteForm ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
          {showQuoteForm && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Total Price (PKR) *</label>
                  <input type="number" value={qPrice} onChange={(e) => setQPrice(e.target.value)} className={inputClass} placeholder="e.g. 5000" />
                </div>
                <div>
                  <label className={labelClass}>Advance Payment (PKR)</label>
                  <input type="number" value={qAdvance} onChange={(e) => setQAdvance(e.target.value)} className={inputClass} placeholder="e.g. 2000" />
                </div>
                <div>
                  <label className={labelClass}>Remaining (PKR)</label>
                  <input type="number" value={qFinal} onChange={(e) => setQFinal(e.target.value)} className={inputClass} placeholder="e.g. 3000" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Delivery Days</label>
                <input type="number" value={qDays} onChange={(e) => setQDays(e.target.value)} className={inputClass} placeholder="e.g. 7" />
              </div>
              <div>
                <label className={labelClass}>Notes for Customer</label>
                <textarea value={qNotes} onChange={(e) => setQNotes(e.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder="Explain your pricing…" />
              </div>
              <button
                disabled={!qPrice || loading !== null}
                onClick={() => doAction('send_quotation', {
                  estimatedPrice: Number(qPrice),
                  advancePayment: qAdvance ? Number(qAdvance) : undefined,
                  finalPrice: qFinal ? Number(qFinal) : undefined,
                  deliveryDays: qDays ? Number(qDays) : undefined,
                  quotationNotes: qNotes || undefined,
                })}
                className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
              >
                {loading === 'send_quotation' ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Send Quotation to Customer
              </button>
            </div>
          )}
        </div>
      )}

      {/* QUOTED — waiting for customer */}
      {status === 'QUOTED' && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <p className="text-sm text-purple-700 font-medium">Quotation sent — waiting for customer to accept or reject.</p>
          <p className="text-xs text-purple-600 mt-1">You can use the message box below to follow up with the customer.</p>
        </div>
      )}

      {/* ACCEPTED / PAYMENT_PENDING — start work */}
      {['ACCEPTED', 'PAYMENT_PENDING'].includes(status) && (
        <div className="space-y-2">
          <p className="text-xs text-[#9E8079]">Customer has accepted the quotation. Once payment is confirmed, start work.</p>
          {btn('Start Work', <Play size={14} />, () => doAction('start_work'), 'primary', loading === 'start_work')}
        </div>
      )}

      {/* ADVANCE_PAID / IN_PROGRESS — ship */}
      {['ADVANCE_PAID', 'IN_PROGRESS'].includes(status) && (
        <div className="space-y-3">
          <p className="text-xs text-[#9E8079]">Order is in progress. Add progress updates below, then ship when ready.</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowShipForm((v) => !v)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-all"
            >
              <Truck size={14} />
              Mark as Shipped
              {showShipForm ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
          {showShipForm && (
            <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Courier Name</label>
                  <input value={shipCourier} onChange={(e) => setShipCourier(e.target.value)} className={inputClass} placeholder="e.g. TCS, Leopards" />
                </div>
                <div>
                  <label className={labelClass}>Tracking Number</label>
                  <input value={shipTracking} onChange={(e) => setShipTracking(e.target.value)} className={inputClass} placeholder="e.g. TCS-123456789" />
                </div>
              </div>
              <button
                disabled={loading !== null}
                onClick={() => doAction('ship', { trackingNumber: shipTracking || undefined, courierName: shipCourier || undefined })}
                className="flex items-center gap-1.5 px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
              >
                {loading === 'ship' ? <Loader2 size={13} className="animate-spin" /> : <Truck size={13} />}
                Confirm Shipment
              </button>
            </div>
          )}
        </div>
      )}

      {/* SHIPPED — deliver + update tracking */}
      {status === 'SHIPPED' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {btn('Mark as Delivered', <PackageCheck size={14} />, () => doAction('deliver'), 'success', loading === 'deliver')}
            <button
              onClick={() => setShowTrackingForm((v) => !v)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#F5EFE6] hover:bg-[#EAE3DC] border border-[#EAE3DC] text-[#6B4C3B] transition-all"
            >
              <Truck size={14} />
              Update Tracking
              {showTrackingForm ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
          {showTrackingForm && (
            <div className="p-4 bg-[#F5EFE6] border border-[#EAE3DC] rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Courier Name</label>
                  <input value={shipCourier} onChange={(e) => setShipCourier(e.target.value)} className={inputClass} placeholder="e.g. TCS, Leopards" />
                </div>
                <div>
                  <label className={labelClass}>Tracking Number</label>
                  <input value={shipTracking} onChange={(e) => setShipTracking(e.target.value)} className={inputClass} placeholder="e.g. TCS-123456789" />
                </div>
              </div>
              <button
                disabled={loading !== null}
                onClick={() => doAction('update_tracking', { trackingNumber: shipTracking || undefined, courierName: shipCourier || undefined })}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#C8896A] hover:bg-[#A8694A] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
              >
                {loading === 'update_tracking' ? <Loader2 size={13} className="animate-spin" /> : <Truck size={13} />}
                Update Tracking Info
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
