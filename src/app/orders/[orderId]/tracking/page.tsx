import { requireCustomer } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, CheckCircle, Truck, MapPin, Clock } from 'lucide-react'
import { formatPrice } from '@/lib/currency'

export const dynamic = 'force-dynamic'

const STEPS = [
  { status: 'PENDING',          label: 'Order Placed',      desc: 'Your order has been received' },
  { status: 'CONFIRMED',        label: 'Confirmed',         desc: 'Order confirmed by seller' },
  { status: 'PACKED',           label: 'Packed',            desc: 'Items packed and ready' },
  { status: 'SHIPPED',          label: 'Shipped',           desc: 'On the way to you' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery',  desc: 'With delivery agent' },
  { status: 'DELIVERED',        label: 'Delivered',         desc: 'Package delivered' },
]

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED']

function getStepIndex(status: string) {
  const idx = STATUS_ORDER.indexOf(status)
  return idx === -1 ? 0 : idx
}

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const session = await requireCustomer()
  const { orderId } = await params
  const id = Number(orderId)

  const order = await prisma.order.findFirst({
    where: { id, userId: session.userId },
    select: {
      id: true,
      status: true,
      totalPrice: true,
      customerName: true,
      shippingAddress: true,
      createdAt: true,
      items: {
        take: 3,
        include: { product: { select: { name: true, image: true } } },
      },
    },
  })

  if (!order) notFound()

  const tracking = await prisma.deliveryTracking.findUnique({
    where: { orderId: id },
    include: {
      history: {
        orderBy: { createdAt: 'asc' },
        include: { updatedBy: { select: { name: true } } },
      },
    },
  })

  const currentStatus = tracking?.status ?? 'PENDING'
  const currentStep = getStepIndex(currentStatus)
  const isCancelled = currentStatus === 'CANCELLED' || currentStatus === 'RETURNED'

  let shippingAddr: Record<string, string> = {}
  try { shippingAddr = JSON.parse(order.shippingAddress ?? '{}') } catch { /* */ }

  return (
    <div className="min-h-screen bg-[#FDFAF7] py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Back */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-sm text-[#9E8079] hover:text-[#2D1F1A] transition-colors"
        >
          <ArrowLeft size={15} /> Back to Orders
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-lg font-serif font-bold text-[#2D1F1A]">Order #{order.id}</h1>
              <p className="text-xs text-[#9E8079] mt-0.5">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <span className="text-base font-bold text-[#C8896A]">{formatPrice(order.totalPrice)}</span>
          </div>

          {shippingAddr.address && (
            <div className="mt-3 flex items-start gap-2 text-xs text-[#9E8079]">
              <MapPin size={13} className="mt-0.5 shrink-0 text-[#C8896A]" />
              <span>{shippingAddr.address}, {shippingAddr.city}, {shippingAddr.state}, {shippingAddr.country}</span>
            </div>
          )}

          {/* Products preview */}
          <div className="mt-3 flex gap-2 flex-wrap">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 bg-[#F5F2EF] rounded-xl px-3 py-1.5">
                <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {item.product.image && <img src={item.product.image} alt="" className="w-full h-full object-cover" />}
                </div>
                <span className="text-xs text-[#2D1F1A] font-medium">{item.product.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
          <h2 className="font-serif font-semibold text-[#2D1F1A] mb-5 flex items-center gap-2">
            <Truck size={18} className="text-[#C8896A]" /> Delivery Tracking
          </h2>

          {!tracking ? (
            <div className="text-center py-8">
              <Clock size={32} className="mx-auto text-[#C4AEA4] mb-2" />
              <p className="text-sm text-[#9E8079]">Tracking information will appear here once your order is processed.</p>
            </div>
          ) : isCancelled ? (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Package size={18} className="text-rose-500" />
              </div>
              <div>
                <p className="font-semibold text-rose-700">{currentStatus}</p>
                <p className="text-xs text-rose-500 mt-0.5">{tracking.remarks ?? 'Order has been cancelled or returned.'}</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {STEPS.map((step, i) => {
                const done = i < currentStep
                const active = i === currentStep
                const future = i > currentStep
                return (
                  <div key={step.status} className="flex gap-4 relative">
                    {/* Vertical line */}
                    {i < STEPS.length - 1 && (
                      <div className="absolute left-4 top-8 w-0.5 h-full -translate-x-1/2">
                        <div className={`h-full transition-all duration-500 ${done ? 'bg-[#7D9B76]' : 'bg-[#EAE3DC]'}`} />
                      </div>
                    )}

                    {/* Dot */}
                    <div className="shrink-0 flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                          done
                            ? 'bg-[#7D9B76] text-white'
                            : active
                            ? 'bg-[#C8896A] text-white ring-4 ring-[#C8896A]/20'
                            : 'bg-[#F5F2EF] text-[#C4AEA4]'
                        }`}
                      >
                        {done ? (
                          <CheckCircle size={16} />
                        ) : (
                          <span className="text-xs font-bold">{i + 1}</span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`pb-6 flex-1 ${future ? 'opacity-40' : ''}`}>
                      <p className={`font-semibold text-sm ${active ? 'text-[#C8896A]' : 'text-[#2D1F1A]'}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-[#9E8079] mt-0.5">{step.desc}</p>
                      {active && tracking.remarks && (
                        <p className="text-xs text-[#C8896A] mt-1 italic">{tracking.remarks}</p>
                      )}
                      {active && tracking.location && (
                        <div className="flex items-center gap-1 text-xs text-[#9E8079] mt-1">
                          <MapPin size={11} /> {tracking.location}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Estimated Delivery */}
          {tracking?.estimatedDeliveryDate && (
            <div className="mt-2 flex items-center gap-2 bg-[#7D9B76]/10 rounded-xl px-3 py-2 text-sm">
              <Clock size={14} className="text-[#7D9B76] shrink-0" />
              <span className="text-[#2D1F1A] font-medium">
                Estimated delivery: {new Date(tracking.estimatedDeliveryDate).toLocaleDateString('en-PK', { weekday: 'long', day: '2-digit', month: 'long' })}
              </span>
            </div>
          )}
        </div>

        {/* History Log */}
        {tracking && tracking.history.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
            <h2 className="font-serif font-semibold text-[#2D1F1A] mb-4">Status History</h2>
            <div className="space-y-3">
              {[...tracking.history].reverse().map((h) => (
                <div key={h.id} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C8896A] mt-2 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#2D1F1A]">{h.status.replace(/_/g, ' ')}</span>
                      {h.location && (
                        <span className="text-xs text-[#9E8079]">· {h.location}</span>
                      )}
                    </div>
                    {h.remarks && <p className="text-xs text-[#9E8079] mt-0.5">{h.remarks}</p>}
                    <p className="text-[10px] text-[#C4AEA4] mt-0.5">
                      {new Date(h.createdAt).toLocaleString('en-PK')}
                      {h.updatedBy && ` · ${h.updatedBy.name}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
