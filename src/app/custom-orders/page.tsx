import Link from 'next/link'
import { getOptionalSession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/currency'
import {
  ClipboardList, Plus, Calendar, Banknote, Clock, CheckCircle2,
  XCircle, AlertCircle, Package, Truck, Star, ChevronRight, Sparkles, LogIn,
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDING:             { label: 'Pending Review',      color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     icon: Clock },
  REVIEWING:           { label: 'Under Review',        color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       icon: AlertCircle },
  NEED_MORE_DETAILS:   { label: 'More Details Needed', color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200',   icon: AlertCircle },
  QUOTED:              { label: 'Quotation Received',  color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200',   icon: Banknote },
  ACCEPTED:            { label: 'Accepted',            color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  PAYMENT_PENDING:     { label: 'Payment Pending',     color: 'text-yellow-700',  bg: 'bg-yellow-50 border-yellow-200',   icon: Banknote },
  ADVANCE_PAID:        { label: 'Advance Paid',        color: 'text-teal-700',    bg: 'bg-teal-50 border-teal-200',       icon: CheckCircle2 },
  IN_PROGRESS:         { label: 'In Progress',         color: 'text-[#C8896A]',   bg: 'bg-[#FDF8F3] border-[#C8896A]/30', icon: Package },
  FINAL_APPROVAL:      { label: 'Final Approval',      color: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-200',   icon: Star },
  READY_FOR_DELIVERY:  { label: 'Ready for Delivery',  color: 'text-cyan-700',    bg: 'bg-cyan-50 border-cyan-200',       icon: Package },
  SHIPPED:             { label: 'Shipped',             color: 'text-violet-700',  bg: 'bg-violet-50 border-violet-200',   icon: Truck },
  DELIVERED:           { label: 'Delivered',           color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  COMPLETED:           { label: 'Completed',           color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  REJECTED:            { label: 'Rejected',            color: 'text-rose-700',    bg: 'bg-rose-50 border-rose-200',       icon: XCircle },
  CANCELLED:           { label: 'Cancelled',           color: 'text-[#9E8079]',   bg: 'bg-[#F5EFE6] border-[#EAE3DC]',   icon: XCircle },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: Clock }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

export default async function CustomOrdersPage() {
  const session = await getOptionalSession()

  // Not logged in — show sign-in prompt
  if (!session?.userId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#C8896A]/10 flex items-center justify-center mx-auto mb-5">
          <ClipboardList size={30} className="text-[#C8896A]" />
        </div>
        <h1 className="text-2xl font-bold text-[#2D1F1A] mb-2">Custom Orders</h1>
        <p className="text-[#9E8079] mb-8 text-sm">Sign in to request personalized handcrafted items and track your custom orders.</p>
        <button
          onClick={undefined}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#C8896A] hover:bg-[#A8694A] text-white text-sm font-semibold rounded-xl transition-all hover:shadow-md"
          // Use JS dispatch so AuthModal opens
        >
          <LogIn size={16} /> Sign In to Continue
        </button>
        <SignInButton />
      </div>
    )
  }

  // Seller / Admin — redirect them to their dashboard section
  if (session.role !== 'CUSTOMER') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#7D9B76]/10 flex items-center justify-center mx-auto mb-5">
          <ClipboardList size={30} className="text-[#7D9B76]" />
        </div>
        <h1 className="text-2xl font-bold text-[#2D1F1A] mb-2">Custom Orders</h1>
        <p className="text-[#9E8079] mb-8 text-sm">
          As a seller, manage your custom orders from the Seller Dashboard.
        </p>
        <Link
          href="/seller/custom-orders"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#7D9B76] hover:bg-[#5E7A57] text-white text-sm font-semibold rounded-xl transition-all hover:shadow-md"
        >
          Go to Seller Dashboard →
        </Link>
      </div>
    )
  }

  // Customer — fetch their orders
  let orders: {
    id: number
    title: string
    status: string
    paymentStatus: string
    budget: number | null
    deadline: Date | null
    estimatedPrice: number | null
    createdAt: Date
    seller: { id: number; name: string } | null
    attachments: string | null
  }[] = []

  try {
    orders = await prisma.customOrder.findMany({
      where: { customerId: session.userId },
      select: {
        id: true,
        title: true,
        status: true,
        paymentStatus: true,
        budget: true,
        deadline: true,
        estimatedPrice: true,
        createdAt: true,
        attachments: true,
        seller: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    // Prisma client may not have new fields yet — fall back to minimal query
    const minimal = await prisma.customOrder.findMany({
      where: { customerId: session.userId },
      orderBy: { createdAt: 'desc' },
    })
    orders = minimal.map((o) => ({
      id: o.id,
      title: o.title,
      status: o.status,
      paymentStatus: 'UNPAID',
      budget: o.budget ?? null,
      deadline: o.deadline ?? null,
      estimatedPrice: o.quotedPrice ?? null,
      createdAt: o.createdAt,
      attachments: o.attachments ?? null,
      seller: null,
    }))
  }

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'PENDING').length,
    inProgress: orders.filter((o) => o.status === 'IN_PROGRESS').length,
    completed: orders.filter((o) => ['COMPLETED', 'DELIVERED'].includes(o.status)).length,
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#C8896A]/10 flex items-center justify-center">
            <ClipboardList size={24} className="text-[#C8896A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2D1F1A]">My Custom Orders</h1>
            <p className="text-sm text-[#9E8079]">Track your personalized craft requests</p>
          </div>
        </div>
        <Link
          href="/custom-orders/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C8896A] hover:bg-[#A8694A] text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        >
          <Plus size={16} />
          Request Custom Order
        </Link>
      </div>

      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#C8896A] via-[#B8795A] to-[#8B5E45] rounded-2xl p-6 mb-8 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-10 w-32 h-32 rounded-full border-4 border-white" />
          <div className="absolute -bottom-4 right-32 w-20 h-20 rounded-full border-4 border-white" />
        </div>
        <div className="relative flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Have a unique vision?</h3>
            <p className="text-white/80 text-sm">
              Describe your dream handcrafted item and our skilled artisans will bring it to life — from custom embroidery to personalized pottery.
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      {orders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total Orders', value: stats.total,      color: 'text-[#2D1F1A]',    bg: 'bg-white' },
            { label: 'Pending',      value: stats.pending,    color: 'text-amber-700',     bg: 'bg-amber-50' },
            { label: 'In Progress',  value: stats.inProgress, color: 'text-[#C8896A]',     bg: 'bg-[#FDF8F3]' },
            { label: 'Completed',    value: stats.completed,  color: 'text-emerald-700',   bg: 'bg-emerald-50' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl border border-[#EAE3DC] p-4 text-center`}>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-[#9E8079] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Orders list */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#C8896A]/10 flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={32} className="text-[#C8896A]/60" />
          </div>
          <h3 className="text-lg font-semibold text-[#2D1F1A] mb-2">No custom orders yet</h3>
          <p className="text-sm text-[#9E8079] mb-6 max-w-sm mx-auto">
            Have something unique in mind? Submit a custom order request and our artisans will make it for you.
          </p>
          <Link
            href="/custom-orders/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C8896A] hover:bg-[#A8694A] text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-md"
          >
            <Plus size={16} />
            Request Your First Custom Order
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            // Get thumbnail from attachments JSON if available
            let thumb: string | null = null
            try {
              if (order.attachments) {
                const urls = JSON.parse(order.attachments) as string[]
                thumb = urls[0] ?? null
              }
            } catch { /* ignore */ }

            return (
              <Link
                key={order.id}
                href={`/custom-orders/${order.id}`}
                className="block bg-white rounded-2xl border border-[#EAE3DC] hover:border-[#C8896A]/40 hover:shadow-md transition-all duration-200 group"
              >
                <div className="p-5 flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-[#F5EFE6] overflow-hidden shrink-0 flex items-center justify-center">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt={order.title} className="w-full h-full object-cover" />
                    ) : (
                      <ClipboardList size={24} className="text-[#C8896A]/40" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-[#2D1F1A] text-sm truncate group-hover:text-[#C8896A] transition-colors">
                            {order.title}
                          </h3>
                          <StatusBadge status={order.status} />
                        </div>
                        <div className="flex items-center gap-4 flex-wrap text-xs text-[#9E8079]">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {order.budget && (
                            <span className="flex items-center gap-1">
                              <Banknote size={11} />
                              Budget: {formatPrice(order.budget)}
                            </span>
                          )}
                          {order.deadline && (
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              Deadline: {new Date(order.deadline).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                          {order.seller && (
                            <span className="text-[#6B4C3B] font-medium">Seller: {order.seller.name}</span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {order.estimatedPrice && (
                          <span className="text-sm font-bold text-[#C8896A]">{formatPrice(order.estimatedPrice)}</span>
                        )}
                        <ChevronRight size={16} className="text-[#9E8079] group-hover:text-[#C8896A] transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Client component just to dispatch the auth modal event
function SignInButton() {
  return null // The button above uses onClick={undefined} — replace with this pattern in client
}
