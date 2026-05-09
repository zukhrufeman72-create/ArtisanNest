'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
  CreditCard, Truck, Lock, Loader2, AlertCircle, CheckCircle2, Banknote,
} from 'lucide-react'
import { formatPrice } from '@/lib/currency'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const CARD_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: '#2D1F1A',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#C4AEA4' },
    },
    invalid: { color: '#ef4444', iconColor: '#ef4444' },
  },
  hidePostalCode: true,
}

type PaymentType = 'advance' | 'full_online' | 'full_cod'
type FinalMethod = 'ONLINE' | 'COD'

type Props = {
  orderId: number
  estimatedPrice: number
  advancePayment: number | null
  mode: 'initial' | 'final'
  onClose: () => void
}

function PaymentForm({ orderId, estimatedPrice, advancePayment, mode, onClose }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const hasAdvance = !!advancePayment && advancePayment > 0
  const remaining = estimatedPrice - (advancePayment ?? 0)

  const [paymentType, setPaymentType] = useState<PaymentType>(
    mode === 'final' ? 'full_online' : (hasAdvance ? 'advance' : 'full_online'),
  )
  const [finalMethod, setFinalMethod] = useState<FinalMethod>('ONLINE')
  const [cardholderName, setCardholderName] = useState('')
  const [cardError, setCardError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const amountNow =
    mode === 'final' ? remaining :
    paymentType === 'advance' ? (advancePayment ?? estimatedPrice) :
    estimatedPrice

  const needsCard = mode === 'final' || paymentType === 'advance' || paymentType === 'full_online'

  async function handlePay() {
    setError('')
    setLoading(true)

    try {
      if (needsCard) {
        if (!stripe || !elements) {
          setError('Payment system not loaded. Please refresh the page.')
          setLoading(false); return
        }
        const cardEl = elements.getElement(CardElement)
        if (!cardEl) {
          setError('Card input not found.')
          setLoading(false); return
        }
        if (!cardholderName.trim()) {
          setError('Please enter the cardholder name.')
          setLoading(false); return
        }

        // 1. Create payment intent
        const piType = mode === 'final' ? 'final' : paymentType === 'advance' ? 'advance' : 'full'
        const piRes = await fetch('/api/stripe/custom-order-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, paymentType: piType }),
        })
        const piData = await piRes.json()
        if (!piRes.ok) {
          setError(piData.error ?? 'Failed to initialize payment.')
          setLoading(false); return
        }

        // 2. Confirm card payment
        const { paymentIntent, error: stripeErr } = await stripe.confirmCardPayment(
          piData.clientSecret,
          { payment_method: { card: cardEl, billing_details: { name: cardholderName.trim() } } },
        )

        if (stripeErr) {
          setError(stripeErr.message ?? 'Card payment failed. Please try again.')
          setLoading(false); return
        }

        if (paymentIntent?.status !== 'succeeded') {
          setError('Payment could not be confirmed. Please try again.')
          setLoading(false); return
        }

        // 3. Confirm with our server
        const serverType = mode === 'final' ? 'final_online' :
          paymentType === 'advance' ? 'advance' : 'full_online'

        const payRes = await fetch(`/api/custom-orders/${orderId}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: serverType,
            stripePaymentIntentId: paymentIntent.id,
            ...(serverType === 'advance' && { finalPaymentMethod: finalMethod }),
          }),
        })

        if (!payRes.ok) {
          const d = await payRes.json()
          setError(d.error ?? 'Payment confirmed but order update failed. Please contact support.')
          setLoading(false); return
        }
      } else {
        // COD — no card needed
        const payRes = await fetch(`/api/custom-orders/${orderId}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'full_cod' }),
        })

        if (!payRes.ok) {
          const d = await payRes.json()
          setError(d.error ?? 'Failed to confirm order.')
          setLoading(false); return
        }
      }

      router.refresh()
      onClose()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Payment type selection (initial payment only) */}
      {mode === 'initial' && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-[#6B4C3B] uppercase tracking-wide mb-3">
            Choose Payment Option
          </p>

          {/* Option A: Pay Advance */}
          {hasAdvance && (
            <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
              paymentType === 'advance'
                ? 'border-[#C8896A] bg-[#FDF8F3]'
                : 'border-[#EAE3DC] bg-white hover:border-[#C8896A]/40'
            }`}>
              <input
                type="radio" className="sr-only"
                checked={paymentType === 'advance'}
                onChange={() => setPaymentType('advance')}
              />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                paymentType === 'advance' ? 'border-[#C8896A]' : 'border-[#D1C4BE]'
              }`}>
                {paymentType === 'advance' && <div className="w-2 h-2 rounded-full bg-[#C8896A]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#2D1F1A]">Pay Advance Now</p>
                  <p className="text-sm font-bold text-[#C8896A] shrink-0">{formatPrice(advancePayment!)}</p>
                </div>
                <p className="text-xs text-[#9E8079] mt-0.5 leading-relaxed">
                  Pay {formatPrice(advancePayment!)} now • Remaining {formatPrice(remaining)} paid after delivery
                </p>
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <CreditCard size={9} /> Card payment required
                </span>
              </div>
            </label>
          )}

          {/* Option B: Pay Full Online */}
          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
            paymentType === 'full_online'
              ? 'border-[#C8896A] bg-[#FDF8F3]'
              : 'border-[#EAE3DC] bg-white hover:border-[#C8896A]/40'
          }`}>
            <input
              type="radio" className="sr-only"
              checked={paymentType === 'full_online'}
              onChange={() => setPaymentType('full_online')}
            />
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
              paymentType === 'full_online' ? 'border-[#C8896A]' : 'border-[#D1C4BE]'
            }`}>
              {paymentType === 'full_online' && <div className="w-2 h-2 rounded-full bg-[#C8896A]" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#2D1F1A]">Pay Full Amount Online</p>
                <p className="text-sm font-bold text-[#C8896A] shrink-0">{formatPrice(estimatedPrice)}</p>
              </div>
              <p className="text-xs text-[#9E8079] mt-0.5">Pay the complete amount now via card</p>
            </div>
          </label>

          {/* Option C: Cash on Delivery */}
          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
            paymentType === 'full_cod'
              ? 'border-[#C8896A] bg-[#FDF8F3]'
              : 'border-[#EAE3DC] bg-white hover:border-[#C8896A]/40'
          }`}>
            <input
              type="radio" className="sr-only"
              checked={paymentType === 'full_cod'}
              onChange={() => setPaymentType('full_cod')}
            />
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
              paymentType === 'full_cod' ? 'border-[#C8896A]' : 'border-[#D1C4BE]'
            }`}>
              {paymentType === 'full_cod' && <div className="w-2 h-2 rounded-full bg-[#C8896A]" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#2D1F1A]">Cash on Delivery</p>
                <p className="text-sm font-bold text-[#C8896A] shrink-0">{formatPrice(estimatedPrice)}</p>
              </div>
              <p className="text-xs text-[#9E8079] mt-0.5">Pay the full amount when you receive your order</p>
            </div>
          </label>
        </div>
      )}

      {/* Final payment method for remaining balance (advance only) */}
      {mode === 'initial' && paymentType === 'advance' && (
        <div>
          <p className="text-xs font-semibold text-[#6B4C3B] uppercase tracking-wide mb-2">
            How to pay remaining {formatPrice(remaining)} after delivery?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(['ONLINE', 'COD'] as FinalMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setFinalMethod(m)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-150 ${
                  finalMethod === m
                    ? 'border-[#C8896A] bg-[#C8896A] text-white'
                    : 'border-[#EAE3DC] text-[#6B4C3B] bg-white hover:border-[#C8896A]/40'
                }`}
              >
                {m === 'ONLINE' ? <CreditCard size={14} /> : <Truck size={14} />}
                {m === 'ONLINE' ? 'Online Card' : 'Cash on Delivery'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Final payment mode header */}
      {mode === 'final' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-semibold text-amber-800">Pay Remaining Balance</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Your order has been delivered. Please complete the remaining payment of {formatPrice(remaining)}.
          </p>
        </div>
      )}

      {/* Stripe card element */}
      {needsCard && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#6B4C3B] uppercase tracking-wide">Card Details</p>
          <input
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="Name on card"
            className="w-full border border-[#EAE3DC] rounded-xl px-3.5 py-2.5 text-sm text-[#2D1F1A] focus:outline-none focus:border-[#C8896A] focus:ring-2 focus:ring-[#C8896A]/10 transition-all placeholder:text-[#C4AEA4]"
          />
          <div className="border border-[#EAE3DC] rounded-xl px-3.5 py-3 focus-within:border-[#C8896A] focus-within:ring-2 focus-within:ring-[#C8896A]/10 transition-all">
            <CardElement
              options={CARD_OPTIONS}
              onChange={(e) => setCardError(e.error?.message ?? '')}
            />
          </div>
          {cardError && (
            <p className="text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle size={11} />{cardError}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-[#9E8079]">
            <Lock size={10} />
            Secured and encrypted by Stripe
          </div>
        </div>
      )}

      {/* Summary box */}
      <div className="bg-[#F5EFE6] rounded-xl p-4 border border-[#EAE3DC] space-y-1.5">
        {mode === 'initial' && paymentType === 'advance' && hasAdvance ? (
          <>
            <div className="flex justify-between text-xs text-[#9E8079]">
              <span>Total quoted price</span>
              <span>{formatPrice(estimatedPrice)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#2D1F1A]">
              <span>Paying now (advance)</span>
              <span className="text-[#C8896A]">{formatPrice(advancePayment!)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#9E8079] pt-1 border-t border-[#EAE3DC]">
              <span>Remaining after delivery</span>
              <span className="font-medium">{formatPrice(remaining)} via {finalMethod === 'ONLINE' ? 'online card' : 'COD'}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between text-sm font-bold text-[#2D1F1A]">
            <span>{mode === 'final' ? 'Remaining balance' : 'Total amount'}</span>
            <span className="text-[#C8896A]">{formatPrice(amountNow)}</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2.5 pt-1">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2.5 text-sm font-medium text-[#9E8079] hover:text-[#2D1F1A] border border-[#EAE3DC] rounded-xl transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handlePay}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#C8896A] hover:bg-[#A8694A] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          {loading
            ? <><Loader2 size={14} className="animate-spin" /> Processing…</>
            : paymentType === 'full_cod'
              ? <><CheckCircle2 size={14} /> Confirm Order (Pay on Delivery)</>
              : <><Lock size={14} /> Pay {formatPrice(amountNow)}</>
          }
        </button>
      </div>
    </div>
  )
}

export default function CustomOrderPaymentModal(props: Props) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
}
