import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { requireCustomer } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/currency'
import {
  ArrowLeft, Calendar, Banknote, Package, Truck, CheckCircle2,
  Clock, AlertCircle, XCircle, MessageCircle, ImageIcon, Star,
  MapPin, Phone, Mail, User, Gift, Layers, Sparkles,
} from 'lucide-react'
import CustomerOrderActions from './CustomerOrderActions'
import CustomerMessageBox from './CustomerMessageBox'

type Params = { params: Promise<{ id: string }> }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  PENDING:            { label: 'Pending Review',      color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: Clock },
  REVIEWING:          { label: 'Under Review',        color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    icon: AlertCircle },
  NEED_MORE_DETAILS:  { label: 'More Details Needed', color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200',  icon: AlertCircle },
  QUOTED:             { label: 'Quotation Received',  color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200',  icon: Banknote },
  ACCEPTED:           { label: 'Accepted',            color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  PAYMENT_PENDING:    { label: 'Payment Pending',     color: 'text-yellow-700',  bg: 'bg-yellow-50',  border: 'border-yellow-200',  icon: Banknote },
  ADVANCE_PAID:       { label: 'Advance Paid',        color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200',    icon: CheckCircle2 },
  IN_PROGRESS:        { label: 'In Progress',         color: 'text-[#C8896A]',   bg: 'bg-[#FDF8F3]', border: 'border-[#C8896A]/30', icon: Package },
  FINAL_APPROVAL:     { label: 'Final Approval',      color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  icon: Star },
  READY_FOR_DELIVERY: { label: 'Ready for Delivery',  color: 'text-cyan-700',    bg: 'bg-cyan-50',    border: 'border-cyan-200',    icon: Package },
  SHIPPED:            { label: 'Shipped',             color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200',  icon: Truck },
  DELIVERED:          { label: 'Delivered',           color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  COMPLETED:          { label: 'Completed',           color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  REJECTED:           { label: 'Rejected',            color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',    icon: XCircle },
  CANCELLED:          { label: 'Cancelled',           color: 'text-[#9E8079]',   bg: 'bg-[#F5EFE6]', border: 'border-[#EAE3DC]',   icon: XCircle },
}

const TIMELINE_STEPS = [
  { status: 'PENDING', label: 'Submitted' },
  { status: 'REVIEWING', label: 'Reviewing' },
  { status: 'QUOTED', label: 'Quoted' },
  { status: 'PAYMENT_PENDING', label: 'Payment' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'SHIPPED', label: 'Shipped' },
  { status: 'DELIVERED', label: 'Delivered' },
]

const STATUS_ORDER = [
  'PENDING', 'REVIEWING', 'NEED_MORE_DETAILS', 'QUOTED', 'ACCEPTED',
  'PAYMENT_PENDING', 'ADVANCE_PAID', 'IN_PROGRESS', 'FINAL_APPROVAL',
  'READY_FOR_DELIVERY', 'SHIPPED', 'DELIVERED', 'COMPLETED',
]

function getStatusIndex(status: string) {
  return STATUS_ORDER.indexOf(status)
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', icon: Clock }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-[#F5EFE6] flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} className="text-[#C8896A]" />
      </div>
      <div>
        <p className="text-xs text-[#9E8079]">{label}</p>
        <p className="text-sm font-medium text-[#2D1F1A]">{value}</p>
      </div>
    </div>
  )
}

export default async function CustomOrderDetailPage({ params }: Params) {
  const session = await requireCustomer()
  const { id } = await params
  const orderId = Number(id)
  if (isNaN(orderId)) notFound()

  const order = await prisma.customOrder.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true } },
      images: { orderBy: { createdAt: 'asc' } },
      messages: {
        include: { sender: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      },
      progress: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!order) notFound()
  if (order.customerId !== session.userId) redirect('/custom-orders')

  const currentStatusIdx = getStatusIndex(order.status)
  const refImages = order.images.filter((i) => ['reference', 'sketch', 'logo', 'color_sample'].includes(i.imageType))
  const progressImages = order.images.filter((i) => i.imageType === 'progress')

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Back */}
      <Link href="/custom-orders" className="inline-flex items-center gap-1.5 text-sm text-[#9E8079] hover:text-[#C8896A] transition-colors mb-6">
        <ArrowLeft size={15} />
        Back to My Orders
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-[#2D1F1A] mb-2">{order.title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={order.status} />
              <span className="text-xs text-[#9E8079]">Order #{order.id}</span>
              <span className="text-xs text-[#9E8079]">
                <Calendar size={10} className="inline mr-1" />
                {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {order.category && (
                <span className="text-xs bg-[#F5EFE6] text-[#6B4C3B] px-2 py-0.5 rounded-full">{order.category.name}</span>
              )}
            </div>
          </div>
          {order.estimatedPrice && (
            <div className="text-right">
              <p className="text-xs text-[#9E8079]">Estimated Price</p>
              <p className="text-xl font-bold text-[#C8896A]">{formatPrice(order.estimatedPrice)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 mb-6">
        <h2 className="text-sm font-semibold text-[#2D1F1A] mb-4">Order Journey</h2>
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {TIMELINE_STEPS.map((step, idx) => {
            const stepIdx = getStatusIndex(step.status)
            const done = currentStatusIdx >= stepIdx && !['CANCELLED', 'REJECTED'].includes(order.status)
            const active = currentStatusIdx === stepIdx
            const cancelled = ['CANCELLED', 'REJECTED'].includes(order.status)
            const cfg = STATUS_CONFIG[step.status]
            const Icon = cfg?.icon ?? Clock
            return (
              <div key={step.status} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0
                    ${cancelled && active ? 'bg-rose-50 border-rose-300' :
                      done ? 'bg-[#C8896A] border-[#C8896A]' :
                      active ? 'bg-white border-[#C8896A] ring-2 ring-[#C8896A]/20' :
                      'bg-white border-[#EAE3DC]'}`}
                  >
                    <Icon size={14} className={done && !cancelled ? 'text-white' : active ? 'text-[#C8896A]' : 'text-[#C4AEA4]'} />
                  </div>
                  <span className={`text-[10px] font-medium text-center leading-tight whitespace-nowrap
                    ${done && !cancelled ? 'text-[#C8896A]' : active ? 'text-[#2D1F1A]' : 'text-[#C4AEA4]'}`}>
                    {step.label}
                  </span>
                </div>
                {idx < TIMELINE_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-500 ${
                    getStatusIndex(TIMELINE_STEPS[idx + 1].status) <= currentStatusIdx && !cancelled
                      ? 'bg-[#C8896A]' : 'bg-[#EAE3DC]'}`}
                  />
                )}
              </div>
            )
          })}
        </div>
        {['CANCELLED', 'REJECTED'].includes(order.status) && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <XCircle size={13} />
            This order has been {order.status.toLowerCase()}.
            {order.adminNote && ` Reason: ${order.adminNote}`}
          </div>
        )}
        {order.status === 'NEED_MORE_DETAILS' && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-xs flex items-center gap-2">
            <AlertCircle size={13} />
            The seller needs more details. Please check the messages below and respond.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Requirements */}
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6">
            <h2 className="text-sm font-semibold text-[#2D1F1A] mb-4 flex items-center gap-2">
              <Package size={15} className="text-[#C8896A]" />
              Order Requirements
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[#9E8079] mb-1">Description</p>
                <p className="text-sm text-[#2D1F1A] leading-relaxed bg-[#F5EFE6] rounded-xl p-3">{order.description}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {order.quantity > 1 && (
                  <div className="bg-[#F5EFE6] rounded-xl p-3">
                    <p className="text-xs text-[#9E8079]">Quantity</p>
                    <p className="text-sm font-semibold text-[#2D1F1A]">{order.quantity}</p>
                  </div>
                )}
                {order.size && (
                  <div className="bg-[#F5EFE6] rounded-xl p-3">
                    <p className="text-xs text-[#9E8079]">Size</p>
                    <p className="text-sm font-semibold text-[#2D1F1A]">{order.size}</p>
                  </div>
                )}
                {order.color && (
                  <div className="bg-[#F5EFE6] rounded-xl p-3">
                    <p className="text-xs text-[#9E8079]">Color</p>
                    <p className="text-sm font-semibold text-[#2D1F1A]">{order.color}</p>
                  </div>
                )}
                {order.material && (
                  <div className="bg-[#F5EFE6] rounded-xl p-3">
                    <p className="text-xs text-[#9E8079]">Material</p>
                    <p className="text-sm font-semibold text-[#2D1F1A]">{order.material}</p>
                  </div>
                )}
                {order.designStyle && (
                  <div className="bg-[#F5EFE6] rounded-xl p-3">
                    <p className="text-xs text-[#9E8079]">Design Style</p>
                    <p className="text-sm font-semibold text-[#2D1F1A]">{order.designStyle}</p>
                  </div>
                )}
                {order.budget && (
                  <div className="bg-[#F5EFE6] rounded-xl p-3">
                    <p className="text-xs text-[#9E8079]">Budget</p>
                    <p className="text-sm font-semibold text-[#2D1F1A]">{formatPrice(order.budget)}</p>
                  </div>
                )}
                {order.deadline && (
                  <div className="bg-[#F5EFE6] rounded-xl p-3">
                    <p className="text-xs text-[#9E8079]">Deadline</p>
                    <p className="text-sm font-semibold text-[#2D1F1A]">{new Date(order.deadline).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                )}
              </div>
              {(order.personalizationText || order.customMessage || order.fontStyle || order.giftPackaging) && (
                <div>
                  <p className="text-xs text-[#9E8079] mb-2 flex items-center gap-1"><Sparkles size={11} /> Personalization</p>
                  <div className="bg-[#F5EFE6] rounded-xl p-3 space-y-1.5">
                    {order.personalizationText && <p className="text-sm text-[#2D1F1A]"><span className="font-medium">Text:</span> {order.personalizationText}</p>}
                    {order.customMessage && <p className="text-sm text-[#2D1F1A]"><span className="font-medium">Message:</span> {order.customMessage}</p>}
                    {order.fontStyle && <p className="text-sm text-[#2D1F1A]"><span className="font-medium">Font:</span> {order.fontStyle}</p>}
                    {order.giftPackaging && (
                      <p className="text-sm text-[#C8896A] font-medium flex items-center gap-1"><Gift size={12} /> Gift packaging requested</p>
                    )}
                  </div>
                </div>
              )}
              {order.specialInstructions && (
                <div>
                  <p className="text-xs text-[#9E8079] mb-1">Special Instructions</p>
                  <p className="text-sm text-[#2D1F1A] bg-[#F5EFE6] rounded-xl p-3">{order.specialInstructions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reference Images */}
          {refImages.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6">
              <h2 className="text-sm font-semibold text-[#2D1F1A] mb-4 flex items-center gap-2">
                <ImageIcon size={15} className="text-[#C8896A]" />
                Reference Images
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {refImages.map((img) => (
                  <div key={img.id} className="space-y-1">
                    <div className="aspect-square rounded-xl overflow-hidden bg-[#F5EFE6] border border-[#EAE3DC]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.caption ?? img.imageType} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs text-center text-[#9E8079] capitalize">{img.imageType.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quotation */}
          {['QUOTED', 'ACCEPTED', 'PAYMENT_PENDING', 'ADVANCE_PAID', 'IN_PROGRESS', 'FINAL_APPROVAL', 'READY_FOR_DELIVERY', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.status) && order.estimatedPrice && (
            <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6">
              <h2 className="text-sm font-semibold text-[#2D1F1A] mb-4 flex items-center gap-2">
                <Banknote size={15} className="text-[#C8896A]" />
                Quotation Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {order.estimatedPrice && (
                  <div className="bg-[#F5EFE6] rounded-xl p-4 text-center">
                    <p className="text-xs text-[#9E8079] mb-1">Total Price</p>
                    <p className="text-lg font-bold text-[#C8896A]">{formatPrice(order.estimatedPrice)}</p>
                  </div>
                )}
                {order.advancePayment && (
                  <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
                    <p className="text-xs text-amber-600 mb-1">Advance Payment</p>
                    <p className="text-lg font-bold text-amber-700">{formatPrice(order.advancePayment)}</p>
                  </div>
                )}
                {order.deliveryDays && (
                  <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                    <p className="text-xs text-blue-600 mb-1">Delivery Time</p>
                    <p className="text-lg font-bold text-blue-700">{order.deliveryDays} days</p>
                  </div>
                )}
              </div>
              {order.quotationNotes && (
                <div className="bg-[#F5EFE6] rounded-xl p-3">
                  <p className="text-xs text-[#9E8079] mb-1">Seller&apos;s Notes</p>
                  <p className="text-sm text-[#2D1F1A]">{order.quotationNotes}</p>
                </div>
              )}
              {order.status === 'QUOTED' && (
                <div className="mt-4 pt-4 border-t border-[#F5EFE6]">
                  <CustomerOrderActions
                    orderId={order.id}
                    status={order.status}
                    paymentStatus={order.paymentStatus}
                    estimatedPrice={order.estimatedPrice}
                    advancePayment={order.advancePayment}
                    finalPaymentMethod={order.finalPaymentMethod ?? null}
                  />
                </div>
              )}
            </div>
          )}

          {/* Progress Updates */}
          {order.progress.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6">
              <h2 className="text-sm font-semibold text-[#2D1F1A] mb-4 flex items-center gap-2">
                <Layers size={15} className="text-[#C8896A]" />
                Progress Updates
              </h2>
              <div className="space-y-4">
                {order.progress.map((p, idx) => (
                  <div key={p.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-[#C8896A] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      {idx < order.progress.length - 1 && <div className="w-px flex-1 bg-[#EAE3DC] my-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-[#2D1F1A]">{p.title}</p>
                      {p.description && <p className="text-xs text-[#9E8079] mt-0.5">{p.description}</p>}
                      <p className="text-xs text-[#C4AEA4] mt-1">{new Date(p.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      {p.imageUrl && (
                        <div className="mt-2 w-32 h-32 rounded-xl overflow-hidden border border-[#EAE3DC]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tracking */}
          {['SHIPPED', 'DELIVERED'].includes(order.status) && (order.trackingNumber || order.courierName) && (
            <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6">
              <h2 className="text-sm font-semibold text-[#2D1F1A] mb-4 flex items-center gap-2">
                <Truck size={15} className="text-[#C8896A]" />
                Shipping & Tracking
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {order.courierName && (
                  <div className="bg-[#F5EFE6] rounded-xl p-4">
                    <p className="text-xs text-[#9E8079] mb-1">Courier</p>
                    <p className="text-sm font-semibold text-[#2D1F1A]">{order.courierName}</p>
                  </div>
                )}
                {order.trackingNumber && (
                  <div className="bg-[#F5EFE6] rounded-xl p-4">
                    <p className="text-xs text-[#9E8079] mb-1">Tracking Number</p>
                    <p className="text-sm font-bold text-[#2D1F1A] font-mono">{order.trackingNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6">
            <h2 className="text-sm font-semibold text-[#2D1F1A] mb-4 flex items-center gap-2">
              <MessageCircle size={15} className="text-[#C8896A]" />
              Messages
              {order.messages.length > 0 && (
                <span className="ml-auto text-xs bg-[#C8896A]/10 text-[#C8896A] px-2 py-0.5 rounded-full">{order.messages.length}</span>
              )}
            </h2>
            <CustomerMessageBox
              orderId={order.id}
              currentUserId={session.userId}
              initialMessages={order.messages.map((m) => ({
                id: m.id,
                message: m.message,
                senderId: m.senderId,
                senderName: m.sender.name,
                createdAt: m.createdAt.toISOString(),
              }))}
            />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Action buttons */}
          {(() => {
            const showSidebarActions =
              order.status === 'PAYMENT_PENDING' ||
              (order.status === 'DELIVERED' && order.paymentStatus === 'ADVANCE_PAID') ||
              (!['CANCELLED', 'REJECTED', 'COMPLETED', 'DELIVERED', 'QUOTED', 'IN_PROGRESS', 'ACCEPTED', 'ADVANCE_PAID', 'SHIPPED', 'PAYMENT_PENDING'].includes(order.status))
            return showSidebarActions ? (
              <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
                <h3 className="text-sm font-semibold text-[#2D1F1A] mb-3">Actions</h3>
                <CustomerOrderActions
                  orderId={order.id}
                  status={order.status}
                  paymentStatus={order.paymentStatus}
                  estimatedPrice={order.estimatedPrice}
                  advancePayment={order.advancePayment}
                  finalPaymentMethod={order.finalPaymentMethod ?? null}
                />
              </div>
            ) : null
          })()}

          {/* Seller info */}
          {order.seller && (
            <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
              <h3 className="text-sm font-semibold text-[#2D1F1A] mb-3">Your Seller</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#C8896A] to-[#8B5E45] flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {order.seller.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2D1F1A]">{order.seller.name}</p>
                  <p className="text-xs text-[#9E8079]">{order.seller.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Customer info */}
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
            <h3 className="text-sm font-semibold text-[#2D1F1A] mb-3">Your Details</h3>
            <div className="space-y-2.5">
              <InfoRow icon={User} label="Name" value={order.customerName} />
              <InfoRow icon={Mail} label="Email" value={order.customerEmail} />
              <InfoRow icon={Phone} label="Phone" value={order.customerPhone} />
              <InfoRow icon={MapPin} label="Delivery Address" value={order.deliveryAddress} />
            </div>
          </div>

          {/* Order meta */}
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
            <h3 className="text-sm font-semibold text-[#2D1F1A] mb-3">Order Info</h3>
            <div className="space-y-2 text-xs text-[#9E8079]">
              <div className="flex justify-between">
                <span>Order ID</span>
                <span className="font-mono text-[#2D1F1A] font-semibold">#{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className="text-[#2D1F1A] font-medium">{STATUS_CONFIG[order.status]?.label ?? order.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment</span>
                <span className={`font-medium ${order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>{order.paymentStatus}</span>
              </div>
              <div className="flex justify-between">
                <span>Submitted</span>
                <span className="text-[#2D1F1A]">{new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
