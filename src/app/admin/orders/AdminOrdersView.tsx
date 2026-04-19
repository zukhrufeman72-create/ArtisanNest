'use client'

import { useState, useMemo } from 'react'
import {
  ShoppingBag, Search, User, Mail, Phone, MapPin, Truck,
  CreditCard, Banknote, Tag, FileText, TrendingUp, Clock,
  CheckCircle2, Zap, Package, ChevronDown, ChevronUp,
  Calendar, BarChart3, X, Store,
} from 'lucide-react'
import { formatPrice } from '@/lib/currency'

// ── Types ──────────────────────────────────────────────────────────────────

type OrderItem = {
  id: number; quantity: number; price: number
  product: { id: number; name: string; image: string; seller: { name: string } | null }
}

type Order = {
  id: number
  totalPrice: number; subtotal: number; shippingFee: number
  tax: number; discount: number; status: string
  customerName: string | null; customerEmail: string | null; customerPhone: string | null
  shippingMethod: string | null; shippingAddress: string | null; addressLabel: string | null
  paymentMethod: string | null; paymentStatus: string
  couponCode: string | null; orderNotes: string | null
  stripePaymentId: string | null
  createdAt: string
  user: { name: string; email: string }
  items: OrderItem[]
}

type Props = { orders: Order[]; totalRevenue: number }

// ── Status config ──────────────────────────────────────────────────────────

const STATUS = {
  PENDING:   { label: 'Pending',   pill: 'bg-amber-50 text-amber-700 border-amber-200',        dot: 'bg-amber-400'   },
  PAID:      { label: 'Confirmed', pill: 'bg-blue-50 text-blue-700 border-blue-200',            dot: 'bg-blue-500'    },
  SHIPPED:   { label: 'Shipped',   pill: 'bg-purple-50 text-purple-700 border-purple-200',      dot: 'bg-purple-500'  },
  DELIVERED: { label: 'Delivered', pill: 'bg-[#7D9B76]/10 text-[#7D9B76] border-[#7D9B76]/30', dot: 'bg-[#7D9B76]'  },
  CANCELLED: { label: 'Cancelled', pill: 'bg-rose-50 text-rose-600 border-rose-200',            dot: 'bg-rose-400'    },
} as const

const STATUS_OPTIONS = Object.keys(STATUS) as (keyof typeof STATUS)[]

// ── Helpers ────────────────────────────────────────────────────────────────

function parseAddress(raw: string | null) {
  if (!raw) return null
  try { return JSON.parse(raw) as Record<string, string> }
  catch { return null }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 7)  return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-[#2D1F1A] leading-tight truncate">{value}</p>
        <p className="text-sm text-[#9E8079]">{label}</p>
        {sub && <p className="text-xs text-[#C4AEA4] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Status badge (read-only) ───────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS[status as keyof typeof STATUS] ?? STATUS.PENDING
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ── Order card ─────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const [open, setOpen] = useState(false)
  const cfg  = STATUS[order.status as keyof typeof STATUS] ?? STATUS.PENDING
  const addr = parseAddress(order.shippingAddress)

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all duration-300
      ${open ? 'border-[#C8896A]/40 shadow-lg shadow-[#C8896A]/5' : 'border-[#EAE3DC] hover:border-[#C8896A]/30 hover:shadow-md'}`}>

      {/* ── Card header ── */}
      <div className="px-5 py-4 flex items-center gap-4 flex-wrap">

        {/* Order # + status */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#C8896A]/10 flex items-center justify-center shrink-0">
            <ShoppingBag size={18} className="text-[#C8896A]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-[#2D1F1A] text-sm">#{order.id}</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-[#9E8079] mt-0.5 flex items-center gap-1">
              <Calendar size={10} /> {timeAgo(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Customer mini-profile */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C8896A] to-[#A8694A] flex items-center justify-center shrink-0 text-white text-xs font-bold">
            {initials(order.user.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#2D1F1A] truncate">{order.user.name}</p>
            <p className="text-xs text-[#9E8079] truncate">{order.user.email}</p>
          </div>
        </div>

        {/* Total + expand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#C8896A]">{formatPrice(order.totalPrice)}</p>
            <p className="text-[10px] text-[#9E8079]">order total</p>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200
              ${open ? 'bg-[#C8896A] border-[#C8896A] text-white' : 'border-[#EAE3DC] text-[#9E8079] hover:bg-[#F5EFE6]'}`}
          >
            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {open && (
        <div className="border-t border-[#EAE3DC]">

          {/* Three-column info bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#F5EFE6] bg-[#FDFAF7]">

            {/* Customer Info */}
            <div className="px-5 py-4 space-y-3">
              <p className="text-[10px] font-bold text-[#9E8079] uppercase tracking-widest flex items-center gap-1.5">
                <User size={11} /> Customer
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C8896A] to-[#A8694A] flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {initials(order.user.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2D1F1A]">{order.customerName ?? order.user.name}</p>
                  <p className="text-xs text-[#9E8079] flex items-center gap-1 mt-0.5">
                    <Mail size={10} /> {order.customerEmail ?? order.user.email}
                  </p>
                  {order.customerPhone && (
                    <p className="text-xs text-[#9E8079] flex items-center gap-1 mt-0.5">
                      <Phone size={10} /> {order.customerPhone}
                    </p>
                  )}
                </div>
              </div>
              {/* Status (read-only) */}
              <div className="pt-1">
                <StatusBadge status={order.status} />
              </div>
            </div>

            {/* Shipping Info */}
            <div className="px-5 py-4 space-y-2">
              <p className="text-[10px] font-bold text-[#9E8079] uppercase tracking-widest flex items-center gap-1.5">
                <MapPin size={11} /> Delivery
              </p>
              {addr ? (
                <div className="space-y-1">
                  <p className="text-sm text-[#2D1F1A] leading-relaxed">{addr.address}</p>
                  <p className="text-xs text-[#9E8079]">
                    {[addr.city, addr.state, addr.country].filter(Boolean).join(', ')}
                    {addr.postalCode ? ` — ${addr.postalCode}` : ''}
                  </p>
                  {order.addressLabel && (
                    <span className="inline-block text-[10px] font-semibold text-[#C8896A] bg-[#C8896A]/8 px-2 py-0.5 rounded-full">
                      {order.addressLabel}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#9E8079]">—</p>
              )}
              <div className="flex items-center gap-1.5 pt-1">
                {order.shippingMethod === 'EXPRESS'
                  ? <Zap size={13} className="text-[#C8896A]" />
                  : <Truck size={13} className="text-[#9E8079]" />
                }
                <span className="text-xs text-[#6B4C3B] font-medium">
                  {order.shippingMethod === 'EXPRESS' ? 'Express (2–3 days)' : 'Standard (5–7 days)'}
                </span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="px-5 py-4 space-y-2">
              <p className="text-[10px] font-bold text-[#9E8079] uppercase tracking-widest flex items-center gap-1.5">
                <CreditCard size={11} /> Payment
              </p>
              <div className="flex items-center gap-2">
                {order.paymentMethod === 'STRIPE'
                  ? <CreditCard size={15} className="text-[#635BFF]" />
                  : <Banknote size={15} className="text-amber-500" />
                }
                <span className="text-sm font-semibold text-[#2D1F1A]">
                  {order.paymentMethod === 'STRIPE' ? 'Card (Stripe)' : 'Cash on Delivery'}
                </span>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold
                ${order.paymentStatus === 'PAID'
                  ? 'bg-[#7D9B76]/10 text-[#7D9B76]'
                  : 'bg-amber-50 text-amber-600'}`}>
                {order.paymentStatus === 'PAID' ? '✓ Paid' : '⏳ Pending'}
              </span>
              {order.stripePaymentId && (
                <p className="text-[10px] text-[#9E8079] font-mono break-all mt-1">
                  {order.stripePaymentId}
                </p>
              )}
              {order.couponCode && (
                <p className="text-xs text-[#7D9B76] flex items-center gap-1 mt-1">
                  <Tag size={10} /> Coupon: <strong>{order.couponCode}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Items table */}
          <div className="px-5 py-4 border-t border-[#F5EFE6]">
            <p className="text-[10px] font-bold text-[#9E8079] uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Package size={11} /> Order Items
            </p>
            <div className="rounded-xl border border-[#EAE3DC] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F9F6F2] border-b border-[#EAE3DC]">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#9E8079]">Product</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#9E8079] hidden md:table-cell">Seller</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-[#9E8079]">Qty</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#9E8079]">Unit Price</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#9E8079]">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EFE6]">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FDF9F5] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#F5F2EF] shrink-0">
                            {item.product.image
                              ? <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-[#C4AEA4]" /></div>
                            }
                          </div>
                          <span className="font-medium text-[#2D1F1A] text-sm leading-snug">{item.product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 text-xs text-[#6B4C3B]">
                          <Store size={11} className="text-[#C8896A]" />
                          {item.product.seller?.name ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="w-7 h-7 rounded-lg bg-[#F5EFE6] text-[#6B4C3B] text-xs font-bold flex items-center justify-center mx-auto">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[#9E8079]">{formatPrice(item.price)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#2D1F1A]">
                        {formatPrice(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Price breakdown + notes */}
          <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#F5EFE6]">

            {/* Breakdown */}
            <div className="bg-[#F9F6F2] rounded-xl p-4 space-y-2 text-sm mt-4">
              <p className="text-[10px] font-bold text-[#9E8079] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <BarChart3 size={11} /> Price Breakdown
              </p>
              {[
                { label: 'Subtotal',  value: formatPrice(order.subtotal) },
                { label: 'Shipping',  value: order.shippingFee === 0 ? 'Free' : formatPrice(order.shippingFee) },
                { label: 'Tax (10%)', value: formatPrice(order.tax) },
                ...(order.discount > 0 ? [{ label: 'Discount', value: `−${formatPrice(order.discount)}`, green: true }] : []),
              ].map(({ label, value, green }) => (
                <div key={label} className="flex justify-between text-xs text-[#6B4C3B]">
                  <span>{label}</span>
                  <span className={`font-medium ${green ? 'text-[#7D9B76]' : ''}`}>{value}</span>
                </div>
              ))}
              <div className="border-t border-[#EAE3DC] pt-2 flex justify-between font-bold text-sm text-[#2D1F1A]">
                <span>Order Total</span>
                <span className="text-[#C8896A]">{formatPrice(order.totalPrice)}</span>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4 space-y-3">
              {order.orderNotes ? (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 h-full">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <FileText size={11} /> Customer Notes
                  </p>
                  <p className="text-sm text-amber-800 leading-relaxed">{order.orderNotes}</p>
                </div>
              ) : (
                <div className="bg-[#F9F6F2] rounded-xl p-4 h-full flex items-center justify-center">
                  <p className="text-xs text-[#C4AEA4] italic">No special notes from customer</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AdminOrdersView({ orders, totalRevenue }: Props) {
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy,       setSortBy]       = useState<'newest' | 'oldest' | 'highest'>('newest')

  const filtered = useMemo(() => {
    let result = orders.filter((o) => {
      const matchStatus = statusFilter === 'ALL' || o.status === statusFilter
      const q = search.toLowerCase().trim()
      const matchSearch = !q
        || o.user.name.toLowerCase().includes(q)
        || o.user.email.toLowerCase().includes(q)
        || String(o.id).includes(q)
        || (o.customerPhone ?? '').includes(q)
        || (o.customerEmail ?? '').toLowerCase().includes(q)
        || (o.customerName ?? '').toLowerCase().includes(q)
        || o.items.some((i) => i.product.name.toLowerCase().includes(q))
        || o.items.some((i) => i.product.seller?.name.toLowerCase().includes(q))
      return matchStatus && matchSearch
    })
    if (sortBy === 'oldest')  result = [...result].reverse()
    if (sortBy === 'highest') result = [...result].sort((a, b) => b.totalPrice - a.totalPrice)
    return result
  }, [orders, search, statusFilter, sortBy])

  const counts = useMemo(() => {
    const m: Record<string, number> = { ALL: orders.length }
    orders.forEach((o) => { m[o.status] = (m[o.status] ?? 0) + 1 })
    return m
  }, [orders])

  const pendingCount   = counts.PENDING   ?? 0
  const deliveredCount = counts.DELIVERED ?? 0

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">All Orders</h1>
          <p className="text-sm text-[#9E8079] mt-0.5">Platform-wide order management — read only</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={ShoppingBag}  label="Total Orders"   value={orders.length}              color="bg-[#C8896A]/10 text-[#C8896A]" />
        <StatCard icon={TrendingUp}   label="Total Revenue"  value={formatPrice(totalRevenue)}  color="bg-[#7D9B76]/10 text-[#7D9B76]" />
        <StatCard icon={Clock}        label="Pending"        value={pendingCount}               color="bg-amber-50 text-amber-600" sub="Awaiting action" />
        <StatCard icon={CheckCircle2} label="Delivered"      value={deliveredCount}             color="bg-blue-50 text-blue-600" />
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C4AEA4]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, order #, product, or seller..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#E8D5C4] text-sm text-[#2D1F1A]
                bg-white placeholder:text-[#C4AEA4] outline-none
                focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A] transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4AEA4] hover:text-[#9E8079] transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3.5 py-2.5 rounded-xl border border-[#E8D5C4] text-sm text-[#2D1F1A]
              bg-white outline-none focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A]
              appearance-none cursor-pointer min-w-36"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest value</option>
          </select>
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', ...STATUS_OPTIONS] as const).map((s) => {
            const cfg = s !== 'ALL' ? STATUS[s] : null
            const active = statusFilter === s
            const count = counts[s] ?? 0
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 flex items-center gap-1.5
                  ${active
                    ? s === 'ALL'
                      ? 'bg-[#2D1F1A] text-white shadow-sm'
                      : `${cfg!.pill} border shadow-sm`
                    : 'bg-[#F5EFE6] text-[#6B4C3B] hover:bg-[#EAE3DC]'
                  }`}
              >
                {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                {s === 'ALL' ? 'All Orders' : cfg!.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Results info */}
      {(search || statusFilter !== 'ALL') && (
        <div className="flex items-center gap-2 text-sm text-[#9E8079]">
          <span>Showing <strong className="text-[#2D1F1A]">{filtered.length}</strong> of {orders.length} orders</span>
          <button
            onClick={() => { setSearch(''); setStatusFilter('ALL') }}
            className="text-[#C8896A] hover:underline text-xs font-medium"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Orders list */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EAE3DC] py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F5EFE6] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={26} className="text-[#C8896A]" />
            </div>
            <p className="font-semibold text-[#2D1F1A] mb-1">
              {search || statusFilter !== 'ALL' ? 'No orders match your filters' : 'No orders yet'}
            </p>
            <p className="text-sm text-[#9E8079]">
              {search || statusFilter !== 'ALL'
                ? 'Try clearing your search or changing the status filter'
                : 'Orders from all customers will appear here'}
            </p>
          </div>
        ) : (
          filtered.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  )
}
