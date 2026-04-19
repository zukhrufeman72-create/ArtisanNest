'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ShoppingBag, Package, ChevronDown, ChevronUp,
  MapPin, CreditCard, Truck, Tag, FileText,
  CheckCircle2, Clock, Zap, XCircle, Banknote,
} from 'lucide-react'
import { formatPrice } from '@/lib/currency'

// ── Types ──────────────────────────────────────────────────────────────────

type OrderProduct = {
  id: number
  name: string
  image: string
  seller: { name: string }
}

type OrderItem = {
  id: number
  quantity: number
  price: number
  product: OrderProduct
}

type Order = {
  id: number
  totalPrice: number
  subtotal: number
  shippingFee: number
  tax: number
  discount: number
  status: string
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  shippingMethod: string | null
  shippingAddress: string | null
  addressLabel: string | null
  paymentMethod: string | null
  paymentStatus: string
  couponCode: string | null
  orderNotes: string | null
  createdAt: Date
  items: OrderItem[]
}

// ── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; icon: React.ElementType; step: number
}> = {
  PENDING:   { label: 'Order Placed',  color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',   icon: Clock,         step: 0 },
  PAID:      { label: 'Confirmed',     color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',     icon: CheckCircle2,  step: 1 },
  SHIPPED:   { label: 'Shipped',       color: 'text-purple-600',  bg: 'bg-purple-50 border-purple-200', icon: Truck,         step: 2 },
  DELIVERED: { label: 'Delivered',     color: 'text-[#7D9B76]',   bg: 'bg-[#7D9B76]/10 border-[#7D9B76]/30', icon: CheckCircle2, step: 3 },
  CANCELLED: { label: 'Cancelled',     color: 'text-rose-500',    bg: 'bg-rose-50 border-rose-200',     icon: XCircle,       step: -1 },
}

const TRACK_STEPS = [
  { key: 'PENDING',   label: 'Order Placed',    desc: 'We received your order' },
  { key: 'PAID',      label: 'Confirmed',        desc: 'Payment confirmed & packing' },
  { key: 'SHIPPED',   label: 'On the Way',       desc: 'Handed to courier' },
  { key: 'DELIVERED', label: 'Delivered',        desc: 'Enjoy your order!' },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function parseAddress(raw: string | null): string {
  if (!raw) return '—'
  try {
    const p = JSON.parse(raw)
    return [p.address, p.city, p.state, p.country, p.postalCode].filter(Boolean).join(', ')
  } catch {
    return raw
  }
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  return new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Order card ────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING
  const Icon = cfg.icon
  const currentStep = cfg.step
  const isCancelled = order.status === 'CANCELLED'

  return (
    <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">

      {/* Card header */}
      <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C8896A]/10 flex items-center justify-center shrink-0">
            <ShoppingBag size={18} className="text-[#C8896A]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-[#2D1F1A] text-sm">#{order.id}</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
                <Icon size={11} /> {cfg.label}
              </span>
            </div>
            <p className="text-xs text-[#9E8079] mt-0.5">{timeAgo(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-bold text-[#2D1F1A]">{formatPrice(order.totalPrice)}</p>
            <p className="text-xs text-[#9E8079]">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-9 h-9 rounded-xl border border-[#EAE3DC] flex items-center justify-center text-[#9E8079] hover:bg-[#F5EFE6] transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Items preview strip */}
      <div className="px-5 pb-4 flex gap-2 overflow-x-auto">
        {order.items.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="w-12 h-12 rounded-xl overflow-hidden bg-[#F5F2EF] shrink-0 border border-[#EAE3DC]"
            title={item.product.name}
          >
            {item.product.image ? (
              <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={16} className="text-[#C4AEA4]" />
              </div>
            )}
          </div>
        ))}
        {order.items.length > 5 && (
          <div className="w-12 h-12 rounded-xl bg-[#F5EFE6] shrink-0 flex items-center justify-center text-xs font-bold text-[#9E8079]">
            +{order.items.length - 5}
          </div>
        )}
      </div>

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="border-t border-[#EAE3DC]">

          {/* Tracking timeline */}
          {!isCancelled && (
            <div className="px-5 py-5 bg-[#F9F6F2]">
              <p className="text-xs font-bold text-[#9E8079] uppercase tracking-widest mb-4">Order Tracking</p>
              <div className="relative">
                {/* Progress line */}
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-[#EAE3DC]" />
                <div
                  className="absolute top-4 left-4 h-0.5 bg-[#7D9B76] transition-all duration-500"
                  style={{ width: currentStep >= 0 ? `${(currentStep / 3) * 100}%` : '0%' }}
                />
                <div className="relative flex justify-between">
                  {TRACK_STEPS.map((step, i) => {
                    const done = i <= currentStep
                    const active = i === currentStep
                    return (
                      <div key={step.key} className="flex flex-col items-center gap-2" style={{ width: '25%' }}>
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300
                          ${done
                            ? active
                              ? 'bg-[#C8896A] border-[#C8896A] shadow-md shadow-[#C8896A]/30'
                              : 'bg-[#7D9B76] border-[#7D9B76]'
                            : 'bg-white border-[#EAE3DC]'
                          }`}>
                          {done ? (
                            <CheckCircle2 size={14} className="text-white" />
                          ) : (
                            <span className="text-[10px] font-bold text-[#C4AEA4]">{i + 1}</span>
                          )}
                        </div>
                        <div className="text-center px-1">
                          <p className={`text-[11px] font-semibold leading-tight
                            ${active ? 'text-[#C8896A]' : done ? 'text-[#7D9B76]' : 'text-[#C4AEA4]'}`}>
                            {step.label}
                          </p>
                          <p className="text-[10px] text-[#9E8079] mt-0.5 leading-tight hidden sm:block">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="px-5 py-4 bg-rose-50 flex items-start gap-3">
              <XCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-700">Order Cancelled</p>
                <p className="text-xs text-rose-500 mt-0.5">
                  This order has been cancelled. Contact us if you have questions.
                </p>
              </div>
            </div>
          )}

          {/* Item list */}
          <div className="px-5 py-4 border-t border-[#EAE3DC]">
            <p className="text-xs font-bold text-[#9E8079] uppercase tracking-widest mb-3">Items</p>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F5F2EF] shrink-0">
                    {item.product.image ? (
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={14} className="text-[#C4AEA4]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#2D1F1A] truncate">{item.product.name}</p>
                    <p className="text-xs text-[#9E8079]">by {item.product.seller.name} · ×{item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-[#2D1F1A] shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Price summary */}
          <div className="px-5 py-4 bg-[#F9F6F2] border-t border-[#EAE3DC]">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[#6B4C3B]">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#6B4C3B]">
                <span>Shipping</span>
                <span>{order.shippingFee === 0 ? <span className="text-[#7D9B76] font-semibold">Free</span> : formatPrice(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-[#6B4C3B]">
                <span>Tax</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[#7D9B76]">
                  <span className="flex items-center gap-1"><Tag size={12} /> Discount</span>
                  <span className="font-semibold">−{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[#2D1F1A] pt-2 border-t border-[#EAE3DC]">
                <span>Total</span>
                <span className="text-[#C8896A]">{formatPrice(order.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Delivery + payment info */}
          <div className="px-5 py-4 border-t border-[#EAE3DC] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#9E8079] uppercase tracking-widest flex items-center gap-1.5">
                <MapPin size={11} /> Shipping Address
              </p>
              <p className="text-sm text-[#2D1F1A] leading-relaxed">{parseAddress(order.shippingAddress)}</p>
              {order.addressLabel && (
                <span className="inline-block text-[10px] font-semibold text-[#9E8079] bg-[#F5EFE6] px-2 py-0.5 rounded-full">
                  {order.addressLabel}
                </span>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-[#9E8079] uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <CreditCard size={11} /> Payment
                </p>
                <p className="text-sm text-[#2D1F1A] flex items-center gap-2">
                  {order.paymentMethod === 'COD' ? <Banknote size={14} className="text-amber-500" /> : <CreditCard size={14} className="text-blue-500" />}
                  {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Card Payment'}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                    ${order.paymentStatus === 'PAID' ? 'bg-[#7D9B76]/10 text-[#7D9B76]' : 'bg-amber-50 text-amber-600'}`}>
                    {order.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}
                  </span>
                </p>
              </div>
              {order.shippingMethod && (
                <div>
                  <p className="text-xs font-bold text-[#9E8079] uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <Truck size={11} /> Delivery
                  </p>
                  <p className="text-sm text-[#2D1F1A] flex items-center gap-1.5">
                    {order.shippingMethod === 'EXPRESS' ? <Zap size={13} className="text-[#C8896A]" /> : <Truck size={13} className="text-[#9E8079]" />}
                    {order.shippingMethod === 'EXPRESS' ? 'Express (2–3 days)' : 'Standard (5–7 days)'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Coupon + notes */}
          {(order.couponCode || order.orderNotes) && (
            <div className="px-5 py-4 border-t border-[#EAE3DC] space-y-3">
              {order.couponCode && (
                <div className="flex items-center gap-2">
                  <Tag size={13} className="text-[#7D9B76]" />
                  <span className="text-xs text-[#6B4C3B]">Coupon applied:</span>
                  <span className="font-mono font-bold text-xs text-[#7D9B76] bg-[#7D9B76]/8 px-2 py-0.5 rounded-full">
                    {order.couponCode}
                  </span>
                </div>
              )}
              {order.orderNotes && (
                <div className="flex items-start gap-2">
                  <FileText size={13} className="text-[#9E8079] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-0.5">Notes</p>
                    <p className="text-sm text-[#6B4C3B] leading-relaxed">{order.orderNotes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function OrdersView({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState<string>('ALL')

  const filtered = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter)

  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {})

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#EAE3DC] py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#F5EFE6] flex items-center justify-center mx-auto mb-5">
          <ShoppingBag size={32} className="text-[#C8896A]" />
        </div>
        <h2 className="text-xl font-serif font-bold text-[#2D1F1A] mb-2">No orders yet</h2>
        <p className="text-sm text-[#9E8079] mb-6 max-w-xs mx-auto leading-relaxed">
          You haven&apos;t placed any orders. Discover beautiful handmade crafts!
        </p>
        <Link
          href="/#products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#C8896A] text-white text-sm font-semibold rounded-full hover:bg-[#A8694A] transition-all hover:shadow-md hover:-translate-y-px"
        >
          <ShoppingBag size={16} /> Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
            ${filter === 'ALL' ? 'bg-[#2D1F1A] text-white' : 'bg-white border border-[#EAE3DC] text-[#6B4C3B] hover:bg-[#F5EFE6]'}`}
        >
          All ({orders.length})
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = counts[key] ?? 0
          if (count === 0) return null
          const Icon = cfg.icon
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5
                ${filter === key
                  ? `${cfg.bg} ${cfg.color} border`
                  : 'bg-white border border-[#EAE3DC] text-[#6B4C3B] hover:bg-[#F5EFE6]'
                }`}
            >
              <Icon size={11} /> {cfg.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Order cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EAE3DC] py-12 text-center">
            <p className="text-sm text-[#9E8079]">No orders with this status</p>
          </div>
        ) : (
          filtered.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  )
}
