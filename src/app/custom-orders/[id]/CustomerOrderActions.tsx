'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  XCircle, Ban, Loader2, AlertCircle, Banknote, Truck, CreditCard,
} from 'lucide-react'
import { formatPrice } from '@/lib/currency'
import CustomOrderPaymentModal from './CustomOrderPaymentModal'

type Props = {
  orderId: number
  status: string
  paymentStatus: string
  estimatedPrice: number | null
  advancePayment: number | null
  finalPaymentMethod: string | null
}

export default function CustomerOrderActions({
  orderId, status, paymentStatus, estimatedPrice, advancePayment, finalPaymentMethod,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [paymentMode, setPaymentMode] = useState<'initial' | 'final'>('initial')

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
      if (!res.ok) setError(data.error ?? 'Action failed. Please try again.')
      else router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const remainingBalance = estimatedPrice && advancePayment
    ? estimatedPrice - advancePayment
    : null

  const canCancel = !['IN_PROGRESS', 'ADVANCE_PAID', 'ACCEPTED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(status)

  return (
    <div className="space-y-3">
      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      {/* ── QUOTED: accept (open payment) or request revision ─────────────── */}
      {status === 'QUOTED' && !showPayment && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#6B4C3B]">
            The seller has sent a quotation. Choose how you like to proceed:
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setPaymentMode('initial'); setShowPayment(true) }}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#C8896A] hover:bg-[#A8694A] text-white text-sm font-semibold rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <Banknote size={14} />
              Accept &amp; Pay
            </button>
            <button
              onClick={() => doAction('reject_quotation')}
              disabled={loading !== null}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-amber-50 border border-amber-200 disabled:opacity-50 text-amber-700 text-sm font-semibold rounded-xl transition-all"
            >
              {loading === 'reject_quotation'
                ? <Loader2 size={13} className="animate-spin" />
                : <XCircle size={13} />
              }
              Request Revision
            </button>
          </div>
        </div>
      )}

      {/* ── QUOTED: inline payment form ─────────────────────────────────────── */}
      {status === 'QUOTED' && showPayment && estimatedPrice && (
        <div className="border border-[#EAE3DC] rounded-2xl p-5 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#F5EFE6]">
            <div className="w-7 h-7 rounded-lg bg-[#C8896A]/10 flex items-center justify-center">
              <CreditCard size={14} className="text-[#C8896A]" />
            </div>
            <h3 className="text-sm font-semibold text-[#2D1F1A]">Complete Payment</h3>
          </div>
          <CustomOrderPaymentModal
            orderId={orderId}
            estimatedPrice={estimatedPrice}
            advancePayment={advancePayment}
            mode="initial"
            onClose={() => setShowPayment(false)}
          />
        </div>
      )}

      {/* ── PAYMENT_PENDING: complete pending payment ─────────────────────────── */}
      {status === 'PAYMENT_PENDING' && estimatedPrice && !showPayment && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5">
          <div className="flex items-start gap-2">
            <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-amber-800">
              Payment pending. Please complete your payment to confirm the order.
            </p>
          </div>
          <button
            onClick={() => { setPaymentMode('initial'); setShowPayment(true) }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#C8896A] hover:bg-[#A8694A] text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Banknote size={14} />
            Complete Payment
          </button>
        </div>
      )}
      {status === 'PAYMENT_PENDING' && estimatedPrice && showPayment && (
        <div className="border border-[#EAE3DC] rounded-2xl p-5 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#F5EFE6]">
            <div className="w-7 h-7 rounded-lg bg-[#C8896A]/10 flex items-center justify-center">
              <CreditCard size={14} className="text-[#C8896A]" />
            </div>
            <h3 className="text-sm font-semibold text-[#2D1F1A]">Complete Payment</h3>
          </div>
          <CustomOrderPaymentModal
            orderId={orderId}
            estimatedPrice={estimatedPrice}
            advancePayment={advancePayment}
            mode="initial"
            onClose={() => setShowPayment(false)}
          />
        </div>
      )}

      {/* ── DELIVERED + ADVANCE_PAID: final payment ──────────────────────────── */}
      {status === 'DELIVERED' && paymentStatus === 'ADVANCE_PAID' && estimatedPrice && (
        <>
          {finalPaymentMethod === 'COD' ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <Truck size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Pay Remaining Balance</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Please hand {remainingBalance ? formatPrice(remainingBalance) : 'the remaining amount'} to
                  the delivery person in cash.
                </p>
              </div>
            </div>
          ) : (
            !showPayment ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5">
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Pay Remaining Balance</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Your order is delivered. Pay the remaining{' '}
                    {remainingBalance ? formatPrice(remainingBalance) : 'balance'} to complete.
                  </p>
                </div>
                <button
                  onClick={() => { setPaymentMode('final'); setShowPayment(true) }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#C8896A] hover:bg-[#A8694A] text-white text-sm font-semibold rounded-xl transition-all"
                >
                  <CreditCard size={14} />
                  Pay {remainingBalance ? formatPrice(remainingBalance) : 'Now'}
                </button>
              </div>
            ) : (
              <div className="border border-[#EAE3DC] rounded-2xl p-5 bg-white shadow-sm">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#F5EFE6]">
                  <div className="w-7 h-7 rounded-lg bg-[#C8896A]/10 flex items-center justify-center">
                    <CreditCard size={14} className="text-[#C8896A]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#2D1F1A]">Pay Remaining Balance</h3>
                </div>
                <CustomOrderPaymentModal
                  orderId={orderId}
                  estimatedPrice={estimatedPrice}
                  advancePayment={advancePayment}
                  mode="final"
                  onClose={() => setShowPayment(false)}
                />
              </div>
            )
          )}
        </>
      )}

      {/* ── Cancel order ─────────────────────────────────────────────────────── */}
      {canCancel && !showPayment && (
        <button
          onClick={() => {
            if (confirm('Are you sure you want to cancel this custom order?')) {
              doAction('cancel')
            }
          }}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 text-rose-700 text-sm font-semibold rounded-xl transition-all"
        >
          {loading === 'cancel'
            ? <Loader2 size={13} className="animate-spin" />
            : <Ban size={13} />
          }
          Cancel Order
        </button>
      )}
    </div>
  )
}
