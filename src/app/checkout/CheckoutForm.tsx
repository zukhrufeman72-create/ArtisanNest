'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import {
  User, Mail, Phone, MapPin, Package, CreditCard, Truck,
  Tag, FileText, CheckCircle2, Loader2, AlertCircle,
  ChevronDown, ChevronRight, ShoppingBag, X, Banknote,
  Clock, Zap, Shield, RotateCcw, Lock, CheckCheck,
} from 'lucide-react'
import { formatPrice } from '@/lib/currency'

// ── Stripe setup ───────────────────────────────────────────────────────────

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const stripeAppearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#C8896A',
    colorBackground: '#ffffff',
    colorText: '#2D1F1A',
    colorDanger: '#ef4444',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    borderRadius: '12px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      border: '1px solid #E8D5C4',
      boxShadow: 'none',
      padding: '10px 14px',
      fontSize: '14px',
    },
    '.Input:focus': {
      border: '1px solid #C8896A',
      boxShadow: '0 0 0 3px rgba(200,137,106,0.15)',
      outline: 'none',
    },
    '.Input--invalid': {
      border: '1px solid #ef4444',
    },
    '.Label': {
      fontSize: '13px',
      fontWeight: '600',
      color: '#2D1F1A',
      marginBottom: '6px',
    },
    '.Error': {
      fontSize: '12px',
      color: '#ef4444',
    },
  },
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: '#2D1F1A',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#C4AEA4' },
    },
    invalid: { color: '#ef4444', iconColor: '#ef4444' },
  },
  hidePostalCode: true,
}

// ── Types ──────────────────────────────────────────────────────────────��───

type CartProduct = {
  id: number; name: string; price: number; discountPrice: number | null
  image: string; stock: number
  seller: { name: string }; category: { name: string }
}
type CartItem = { id: number; quantity: number; product: CartProduct }
type Props = { cartItems: CartItem[]; user: { name: string; email: string } }
type FormErrors = Record<string, string>
type CouponState = {
  id: number; code: string; discountType: string; discountValue: number
  description: string | null; discountAmount: number
} | null

// ── Constants ──────────────────────────────────────────────────────────────

const SHIPPING_OPTIONS = [
  { id: 'STANDARD', label: 'Standard Delivery', price: 250, days: '5–7 business days', icon: Truck },
  { id: 'EXPRESS',  label: 'Express Delivery',  price: 500, days: '2–3 business days', icon: Zap  },
]
const COUNTRIES     = ['Pakistan', 'India', 'UAE', 'UK', 'USA', 'Canada', 'Australia']
const ADDRESS_LABELS = ['Home', 'Office', 'Other']
const TAX_RATE = 0.10

// ── Reusable UI pieces ───────────────────────────────��─────────────────────

function Section({ number, title, icon: Icon, children }: {
  number: string; title: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#C8896A]/10 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-[#C8896A]" />
        </div>
        <span className="text-xs font-bold text-[#C8896A] bg-[#C8896A]/10 px-2 py-0.5 rounded-full">{number}</span>
        <h2 className="font-semibold text-[#2D1F1A]">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[#2D1F1A]">
        {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-rose-500">
          <AlertCircle size={11} />{error}
        </p>
      )}
    </div>
  )
}

const inputCls = (err?: string) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#2D1F1A] bg-white transition-all
   placeholder:text-[#C4AEA4] outline-none focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A]
   ${err ? 'border-rose-300 bg-rose-50/30' : 'border-[#E8D5C4] hover:border-[#C8896A]/50'}`

// ── Inner checkout form (uses Stripe hooks) ────────────────────────────────

function CheckoutContent({ cartItems, user }: Props) {
  const stripe   = useStripe()
  const elements = useElements()

  // Customer
  const [name,  setName]  = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState('')

  // Address
  const [country,     setCountry]     = useState('Pakistan')
  const [stateProv,   setStateProv]   = useState('')
  const [city,        setCity]        = useState('')
  const [address,     setAddress]     = useState('')
  const [postalCode,  setPostalCode]  = useState('')
  const [addressLabel,setAddressLabel] = useState('Home')

  // Shipping & payment
  const [shippingMethod, setShippingMethod] = useState<'STANDARD' | 'EXPRESS'>('STANDARD')
  const [paymentMethod,  setPaymentMethod]  = useState<'COD' | 'STRIPE'>('COD')

  // Stripe card holder name
  const [cardholderName, setCardholderName] = useState('')
  const [cardError,      setCardError]      = useState('')
  const [cardComplete,   setCardComplete]   = useState(false)

  // Coupon
  const [couponInput,  setCouponInput]  = useState('')
  const [coupon,       setCoupon]       = useState<CouponState>(null)
  const [couponLoading,setCouponLoading] = useState(false)
  const [couponError,  setCouponError]  = useState('')

  // Misc
  const [orderNotes,    setOrderNotes]    = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [errors,        setErrors]        = useState<FormErrors>({})
  const [submitting,    setSubmitting]    = useState(false)
  const [submitError,   setSubmitError]   = useState('')
  const [orderSuccess,  setOrderSuccess]  = useState<number | null>(null)

  // Totals
  const subtotal = useMemo(
    () => cartItems.reduce((s, i) => s + (i.product.discountPrice ?? i.product.price) * i.quantity, 0),
    [cartItems],
  )
  const shippingFee = useMemo(() => {
    if (subtotal >= 5000) return 0
    return shippingMethod === 'EXPRESS' ? 500 : 250
  }, [subtotal, shippingMethod])
  const tax      = useMemo(() => Math.round(subtotal * TAX_RATE), [subtotal])
  const discount = coupon?.discountAmount ?? 0
  const total    = subtotal + shippingFee + tax - discount

  // ── Apply coupon ─────────────���──────────────────────────────────────────

  async function applyCoupon() {
    if (!couponInput.trim()) return
    setCouponError(''); setCouponLoading(true)
    try {
      const res  = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), subtotal }),
      })
      const data = await res.json()
      if (!res.ok) setCouponError(data.error)
      else { setCoupon({ ...data.coupon, discountAmount: data.discountAmount }); setCouponInput('') }
    } catch { setCouponError('Failed to validate coupon') }
    finally   { setCouponLoading(false) }
  }

  // ── Validate ───────────────────────────��────────────────────────────────

  function validate(): boolean {
    const e: FormErrors = {}
    if (!name.trim())  e.name  = 'Full name is required'
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Invalid email'
    if (!phone.trim()) e.phone = 'Phone number is required'
    if (!country)      e.country = 'Country is required'
    if (!stateProv.trim()) e.state = 'State / Province is required'
    if (!city.trim())  e.city  = 'City is required'
    if (!address.trim()) e.address = 'Full address is required'
    if (!postalCode.trim()) e.postalCode = 'Postal code is required'
    if (paymentMethod === 'STRIPE') {
      if (!cardholderName.trim()) e.cardholderName = 'Cardholder name is required'
      if (!cardComplete) e.card = 'Please complete your card details'
    }
    if (!termsAccepted) e.terms = 'You must accept the terms and conditions'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Place order (called after optional Stripe payment) ──────────────────

  async function placeOrder(stripePaymentIntentId: string | null) {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: name, customerEmail: email, customerPhone: phone,
        country, state: stateProv, city, address, postalCode, addressLabel,
        shippingMethod, paymentMethod, stripePaymentIntentId,
        couponId: coupon?.id ?? null,
        couponCode: coupon?.code ?? null,
        discountAmount: discount,
        orderNotes,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setSubmitError(data.error ?? 'Failed to place order'); return }
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: 0 } }))
    setOrderSuccess(data.orderId)
  }

  // ── Submit ──────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) {
      document.querySelector('[data-has-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSubmitting(true); setSubmitError('')

    try {
      if (paymentMethod === 'STRIPE') {
        if (!stripe || !elements) {
          setSubmitError('Stripe is not loaded. Please refresh and try again.')
          setSubmitting(false); return
        }
        const cardElement = elements.getElement(CardElement)
        if (!cardElement) {
          setSubmitError('Card element not found.')
          setSubmitting(false); return
        }

        // 1. Create PaymentIntent on server
        const piRes  = await fetch('/api/stripe/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: total }),
        })
        const piData = await piRes.json()
        if (!piRes.ok) { setSubmitError(piData.error ?? 'Payment setup failed'); setSubmitting(false); return }

        // 2. Confirm card payment via Stripe.js
        const { paymentIntent, error: stripeErr } = await stripe.confirmCardPayment(
          piData.clientSecret,
          { payment_method: { card: cardElement, billing_details: { name: cardholderName, email } } },
        )

        if (stripeErr) {
          setSubmitError(stripeErr.message ?? 'Card payment failed')
          setSubmitting(false); return
        }

        if (paymentIntent?.status === 'succeeded') {
          await placeOrder(paymentIntent.id)
        } else {
          setSubmitError('Payment could not be confirmed. Please try again.')
          setSubmitting(false)
        }
      } else {
        await placeOrder(null)
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      // Only reset submitting if we didn't succeed (success screen takes over)
      if (orderSuccess === null) setSubmitting(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────

  if (orderSuccess !== null) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center animate-scale-in">
        <div className="w-24 h-24 rounded-full bg-[#7D9B76]/15 flex items-center justify-center mx-auto mb-6 ring-4 ring-[#7D9B76]/10">
          <CheckCircle2 size={44} className="text-[#7D9B76]" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#2D1F1A] mb-3">Order Placed!</h1>
        <p className="text-[#6B4C3B] mb-1">
          Thank you, <strong>{name}</strong>. Your order is confirmed.
        </p>
        <p className="text-sm text-[#9E8079] mb-8">
          Order <span className="font-mono font-semibold text-[#C8896A]">#{orderSuccess}</span> · Confirmation sent to{' '}
          <span className="font-medium text-[#2D1F1A]">{email}</span>
        </p>

        {/* Summary card */}
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5 mb-6 text-left space-y-3">
          {[
            { label: 'Payment', value: paymentMethod === 'COD' ? '💵 Cash on Delivery' : '💳 Card — Stripe' },
            { label: 'Shipping', value: shippingMethod === 'EXPRESS' ? '⚡ Express (2–3 days)' : '🚚 Standard (5–7 days)' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm text-[#6B4C3B]">
              <span>{label}</span>
              <span className="font-semibold text-[#2D1F1A]">{value}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold text-[#2D1F1A] pt-3 border-t border-[#EAE3DC]">
            <span>Total Paid</span>
            <span className="text-[#C8896A] text-base">{formatPrice(total)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/orders"
            className="px-6 py-3 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#A8694A] transition-all hover:shadow-md">
            View My Orders
          </Link>
          <Link href="/"
            className="px-6 py-3 border border-[#EAE3DC] text-[#6B4C3B] text-sm font-semibold rounded-xl hover:bg-[#F5EFE6] transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  // ── Main form ───────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Breadcrumb + header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-[#9E8079] mb-3">
          <Link href="/cart" className="hover:text-[#C8896A] transition-colors flex items-center gap-1">
            <ShoppingBag size={12} /> Cart
          </Link>
          <ChevronRight size={12} />
          <span className="text-[#2D1F1A] font-medium">Checkout</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#2D1F1A]">Checkout</h1>
        <p className="text-sm text-[#9E8079] mt-1">
          {cartItems.reduce((s, i) => s + i.quantity, 0)} items · Secure SSL encrypted checkout
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-7 space-y-5">

            {/* 01 · Customer Information */}
            <Section number="01" title="Customer Information" icon={User}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Full Name" required error={errors.name}>
                    <input className={inputCls(errors.name)} value={name}
                      onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
                  </Field>
                </div>
                <Field label="Email Address" required error={errors.email}>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C4AEA4]" />
                    <input type="email" className={inputCls(errors.email) + ' pl-9'} value={email}
                      onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                </Field>
                <Field label="Phone Number" required error={errors.phone}>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C4AEA4]" />
                    <input type="tel" className={inputCls(errors.phone) + ' pl-9'} value={phone}
                      onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 0000000" />
                  </div>
                </Field>
              </div>
            </Section>

            {/* 02 · Shipping Address */}
            <Section number="02" title="Shipping Address" icon={MapPin}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Country" required error={errors.country}>
                  <div className="relative">
                    <select className={inputCls(errors.country) + ' appearance-none pr-9'} value={country}
                      onChange={(e) => setCountry(e.target.value)}>
                      {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#C4AEA4] pointer-events-none" />
                  </div>
                </Field>
                <Field label="State / Province" required error={errors.state}>
                  <input className={inputCls(errors.state)} value={stateProv}
                    onChange={(e) => setStateProv(e.target.value)} placeholder="Punjab" />
                </Field>
                <Field label="City" required error={errors.city}>
                  <input className={inputCls(errors.city)} value={city}
                    onChange={(e) => setCity(e.target.value)} placeholder="Lahore" />
                </Field>
                <Field label="Postal / ZIP Code" required error={errors.postalCode}>
                  <input className={inputCls(errors.postalCode)} value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)} placeholder="54000" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Full Address" required error={errors.address}>
                    <textarea rows={2} className={inputCls(errors.address) + ' resize-none'}
                      value={address} onChange={(e) => setAddress(e.target.value)}
                      placeholder="House no., Street, Area..." />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-[#2D1F1A] mb-2">Address Label</p>
                  <div className="flex gap-2 flex-wrap">
                    {ADDRESS_LABELS.map((lbl) => (
                      <button key={lbl} type="button" onClick={() => setAddressLabel(lbl)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all
                          ${addressLabel === lbl
                            ? 'bg-[#C8896A] text-white border-[#C8896A]'
                            : 'bg-white text-[#6B4C3B] border-[#E8D5C4] hover:border-[#C8896A]/60'
                          }`}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {/* 03 · Shipping Method */}
            <Section number="03" title="Shipping Method" icon={Truck}>
              <div className="space-y-3">
                {SHIPPING_OPTIONS.map((opt) => {
                  const isFree = subtotal >= 5000
                  const fee    = isFree ? 0 : opt.price
                  const Icon   = opt.icon
                  const sel    = shippingMethod === opt.id
                  return (
                    <button key={opt.id} type="button"
                      onClick={() => setShippingMethod(opt.id as 'STANDARD' | 'EXPRESS')}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all
                        ${sel ? 'border-[#C8896A] bg-[#C8896A]/5 shadow-sm' : 'border-[#EAE3DC] hover:border-[#C8896A]/40 bg-white'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                        ${sel ? 'bg-[#C8896A] text-white' : 'bg-[#F5EFE6] text-[#C8896A]'}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${sel ? 'text-[#C8896A]' : 'text-[#2D1F1A]'}`}>{opt.label}</p>
                        <p className="text-xs text-[#9E8079] flex items-center gap-1 mt-0.5">
                          <Clock size={11} /> Est. {opt.days}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {fee === 0
                          ? <span className="text-sm font-bold text-[#7D9B76]">Free</span>
                          : <span className="text-sm font-bold text-[#2D1F1A]">{formatPrice(fee)}</span>
                        }
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                        ${sel ? 'border-[#C8896A] bg-[#C8896A]' : 'border-[#D5C4BB]'}`}>
                        {sel && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  )
                })}
                {subtotal >= 5000 && (
                  <p className="text-xs text-[#7D9B76] font-medium flex items-center gap-1.5 px-1">
                    <CheckCheck size={13} /> Free shipping on orders above {formatPrice(5000)}
                  </p>
                )}
              </div>
            </Section>

            {/* 04 · Payment Method */}
            <Section number="04" title="Payment Method" icon={CreditCard}>
              <div className="space-y-4">
                {/* Selector */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'COD',    label: 'Cash on Delivery', icon: Banknote,    sub: 'Pay when delivered'   },
                    { id: 'STRIPE', label: 'Card Payment',     icon: CreditCard,  sub: 'Visa • MC • Stripe'   },
                  ].map((pm) => {
                    const Icon = pm.icon; const sel = paymentMethod === pm.id
                    return (
                      <button key={pm.id} type="button" onClick={() => setPaymentMethod(pm.id as 'COD' | 'STRIPE')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                          ${sel ? 'border-[#C8896A] bg-[#C8896A]/5 shadow-sm' : 'border-[#EAE3DC] hover:border-[#C8896A]/40 bg-white'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                          ${sel ? 'bg-[#C8896A] text-white' : 'bg-[#F5EFE6] text-[#C8896A]'}`}>
                          <Icon size={18} />
                        </div>
                        <div className="text-center">
                          <p className={`text-xs font-semibold ${sel ? 'text-[#C8896A]' : 'text-[#2D1F1A]'}`}>{pm.label}</p>
                          <p className="text-[10px] text-[#9E8079] mt-0.5">{pm.sub}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                          ${sel ? 'border-[#C8896A] bg-[#C8896A]' : 'border-[#D5C4BB]'}`}>
                          {sel && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* COD */}
                {paymentMethod === 'COD' && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <Banknote size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Cash on Delivery</p>
                      <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                        Pay in cash when your order arrives. Please have the exact amount ready.
                      </p>
                    </div>
                  </div>
                )}

                {/* Stripe Elements */}
                {paymentMethod === 'STRIPE' && (
                  <div className="space-y-4">
                    {/* Security banner */}
                    <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-[#635BFF]/8 to-[#C8896A]/5 rounded-xl border border-[#635BFF]/15">
                      <div className="w-8 h-8 rounded-lg bg-[#635BFF] flex items-center justify-center shrink-0">
                        <Lock size={14} className="text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#2D1F1A]">Secured by Stripe</p>
                        <p className="text-[10px] text-[#9E8079] mt-0.5">
                          256-bit SSL encryption · PCI-DSS Level 1 compliant
                        </p>
                      </div>
                      <svg className="ml-auto w-12 shrink-0" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M29.5 2.1c-8.3 0-13.3 4.1-13.3 10.7 0 7.1 4.5 10.7 13 10.7 8.4 0 13.4-3.9 13.4-11.2C42.6 5.9 38.1 2.1 29.5 2.1zm0 17.2c-3.8 0-6.1-2.5-6.1-6.6 0-3.9 2.4-6.4 6.2-6.4 3.7 0 6 2.5 6 6.5 0 3.9-2.4 6.5-6.1 6.5z" fill="#635BFF"/>
                        <path d="M9.1 2.5C6.1 2.5 3.8 4 3.8 4V2.8H0v19.4h3.8v-6.3c.6.5 2.1 1.1 4.1 1.1 5.3 0 8.6-3.9 8.6-9.5 0-3.2-1.3-5-7.4-5zm-.5 13.8c-1.8 0-3.2-.7-4.8-1.9V8.3c1.6-1.2 3-2 4.8-2 2.8 0 4.3 1.6 4.3 4.8 0 3.2-1.5 5.2-4.3 5.2z" fill="#635BFF"/>
                      </svg>
                    </div>

                    {/* Cardholder name */}
                    <Field label="Cardholder Name" required error={errors.cardholderName}>
                      <input className={inputCls(errors.cardholderName)} value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        placeholder="Name exactly as on card" />
                    </Field>

                    {/* Stripe CardElement */}
                    <div>
                      <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">
                        Card Details <span className="text-rose-400">*</span>
                      </label>
                      <div className={`rounded-xl border px-4 py-3.5 transition-all bg-white
                        ${errors.card ? 'border-rose-300 bg-rose-50/20' : cardComplete ? 'border-[#7D9B76]' : 'border-[#E8D5C4]'}`}>
                        <CardElement
                          options={CARD_ELEMENT_OPTIONS}
                          onChange={(e) => {
                            setCardError(e.error?.message ?? '')
                            setCardComplete(e.complete)
                            if (errors.card) setErrors((prev) => { const n = { ...prev }; delete n.card; return n })
                          }}
                        />
                      </div>
                      {(cardError || errors.card) && (
                        <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                          <AlertCircle size={11} />{cardError || errors.card}
                        </p>
                      )}
                      {cardComplete && !cardError && (
                        <p className="mt-1.5 text-xs text-[#7D9B76] flex items-center gap-1">
                          <CheckCheck size={11} /> Card details complete
                        </p>
                      )}
                    </div>

                    {/* Accepted cards */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-[#9E8079]">Accepted:</span>
                      {['VISA', 'Mastercard', 'AMEX', 'Discover'].map((b) => (
                        <span key={b} className="px-2.5 py-1 bg-[#F5EFE6] rounded-lg text-[10px] font-bold text-[#9E8079] tracking-wide">
                          {b}
                        </span>
                      ))}
                    </div>

                    {/* Test card hint */}
                    <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <Shield size={14} className="text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-blue-600 leading-relaxed">
                        <strong>Test mode:</strong> Use card <span className="font-mono">4242 4242 4242 4242</span>, any future date, any 3-digit CVC.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* 05 · Order Notes */}
            <Section number="05" title="Order Notes" icon={FileText}>
              <textarea rows={3} className={inputCls() + ' resize-none'} value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Special instructions, customization notes, or delivery preferences..." />
            </Section>

            {/* Terms */}
            <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5" data-has-error={errors.terms ? true : undefined}>
              <label className="flex items-start gap-3 cursor-pointer group">
                <button type="button" onClick={() => setTermsAccepted((v) => !v)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
                    ${termsAccepted ? 'bg-[#7D9B76] border-[#7D9B76]' : errors.terms ? 'border-rose-400 bg-rose-50' : 'border-[#D5C4BB] group-hover:border-[#C8896A]/60'}`}>
                  {termsAccepted && <CheckCheck size={11} className="text-white" />}
                </button>
                <span className="text-sm text-[#6B4C3B] leading-relaxed">
                  I agree to the{' '}
                  <span className="text-[#C8896A] font-medium cursor-pointer hover:underline">Terms & Conditions</span>
                  {' '}and{' '}
                  <span className="text-[#C8896A] font-medium cursor-pointer hover:underline">Privacy Policy</span>.
                  I confirm my order details are correct.
                </span>
              </label>
              {errors.terms && (
                <p className="mt-2 text-xs text-rose-500 flex items-center gap-1 pl-8">
                  <AlertCircle size={11} />{errors.terms}
                </p>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN — Order Summary ── */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">

              {/* Items */}
              <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={16} className="text-[#C8896A]" />
                    <h3 className="font-semibold text-[#2D1F1A]">Order Summary</h3>
                  </div>
                  <span className="text-xs text-[#9E8079] bg-[#F5EFE6] px-2.5 py-1 rounded-full font-medium">
                    {cartItems.reduce((s, i) => s + i.quantity, 0)} items
                  </span>
                </div>
                <div className="divide-y divide-[#F5EFE6] max-h-64 overflow-y-auto">
                  {cartItems.map((item) => {
                    const price = item.product.discountPrice ?? item.product.price
                    return (
                      <div key={item.id} className="px-4 py-3 flex gap-3 items-center">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F5F2EF] shrink-0">
                          {item.product.image
                            ? <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-[#C4AEA4]" /></div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2D1F1A] line-clamp-1">{item.product.name}</p>
                          <p className="text-xs text-[#9E8079]">by {item.product.seller.name} · ×{item.quantity}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-[#2D1F1A]">{formatPrice(price * item.quantity)}</p>
                          {item.quantity > 1 && <p className="text-[10px] text-[#9E8079]">{formatPrice(price)} ea.</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Coupon */}
              <div className="bg-white rounded-2xl border border-[#EAE3DC] p-4">
                <p className="text-sm font-semibold text-[#2D1F1A] mb-3 flex items-center gap-2">
                  <Tag size={14} className="text-[#C8896A]" /> Coupon Code
                </p>
                {coupon ? (
                  <div className="flex items-center justify-between bg-[#7D9B76]/8 border border-[#7D9B76]/25 rounded-xl px-3.5 py-3">
                    <div>
                      <p className="text-sm font-bold text-[#7D9B76]">{coupon.code}</p>
                      <p className="text-xs text-[#7D9B76]/80 mt-0.5">Saving {formatPrice(coupon.discountAmount)}</p>
                    </div>
                    <button type="button" onClick={() => setCoupon(null)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9E8079] hover:text-rose-500 hover:bg-rose-50 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" className={inputCls(couponError ? 'err' : '') + ' flex-1'}
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                      placeholder="Enter coupon code"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCoupon())} />
                    <button type="button" onClick={applyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                      className="px-4 py-2.5 bg-[#2D1F1A] text-white text-sm font-semibold rounded-xl hover:bg-[#C8896A] transition-colors disabled:opacity-50 flex items-center gap-1.5">
                      {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="mt-2 text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle size={11} />{couponError}
                  </p>
                )}
              </div>

              {/* Price breakdown + Place Order */}
              <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-[#6B4C3B]">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B4C3B]">
                    <span>Shipping ({shippingMethod === 'EXPRESS' ? 'Express' : 'Standard'})</span>
                    {shippingFee === 0
                      ? <span className="font-semibold text-[#7D9B76]">Free</span>
                      : <span className="font-medium">{formatPrice(shippingFee)}</span>
                    }
                  </div>
                  <div className="flex justify-between text-[#6B4C3B]">
                    <span>Tax (10%)</span>
                    <span className="font-medium">{formatPrice(tax)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[#7D9B76]">
                      <span className="flex items-center gap-1"><Tag size={12} /> Coupon Discount</span>
                      <span className="font-semibold">−{formatPrice(discount)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#EAE3DC] mt-4 pt-4 flex justify-between items-center">
                  <span className="font-bold text-[#2D1F1A]">Total</span>
                  <span className="text-xl font-bold text-[#C8896A]">{formatPrice(total)}</span>
                </div>

                {submitError && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2">
                    <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-600">{submitError}</p>
                  </div>
                )}

                {/* Submit button */}
                <button type="submit" disabled={submitting || (paymentMethod === 'STRIPE' && !stripe)}
                  className="mt-5 w-full py-4 bg-[#C8896A] hover:bg-[#A8694A] text-white font-bold rounded-xl
                    transition-all hover:shadow-lg hover:-translate-y-px flex items-center justify-center gap-2.5
                    disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0">
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {paymentMethod === 'STRIPE' ? 'Processing Payment...' : 'Placing Order...'}
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      {paymentMethod === 'STRIPE' ? `Pay ${formatPrice(total)}` : `Place Order · ${formatPrice(total)}`}
                    </>
                  )}
                </button>

                {/* Trust badges */}
                <div className="mt-4 pt-4 border-t border-[#EAE3DC] grid grid-cols-3 gap-2">
                  {[{ icon: Lock, label: 'Secure' }, { icon: Shield, label: 'Protected' }, { icon: RotateCcw, label: 'Easy Returns' }].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1 text-[#9E8079]">
                      <Icon size={16} />
                      <span className="text-[10px] font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

// ── Outer wrapper (provides Stripe context) ────────────────────────────────

export default function CheckoutForm({ cartItems, user }: Props) {
  return (
    <Elements stripe={stripePromise} options={{ appearance: stripeAppearance }}>
      <CheckoutContent cartItems={cartItems} user={user} />
    </Elements>
  )
}
