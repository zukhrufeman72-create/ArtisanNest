import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { requireSeller } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/currency'
import {
  ArrowLeft, Calendar, Banknote, Package, Truck, CheckCircle2,
  Clock, AlertCircle, XCircle, ImageIcon, Gift, User, Mail, Phone,
  MapPin, Layers, MessageCircle,
} from 'lucide-react'
import SellerOrderActions from './SellerOrderActions'
import SellerMessageBox from './SellerMessageBox'
import SellerProgressForm from './SellerProgressForm'

type Params = { params: Promise<{ id: string }> }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  PENDING:            { label: 'Pending',           color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: Clock },
  REVIEWING:          { label: 'Reviewing',         color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    icon: AlertCircle },
  NEED_MORE_DETAILS:  { label: 'Need Details',      color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200',  icon: AlertCircle },
  QUOTED:             { label: 'Quoted',            color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200',  icon: Banknote },
  ACCEPTED:           { label: 'Accepted',          color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  PAYMENT_PENDING:    { label: 'Payment Pending',   color: 'text-yellow-700',  bg: 'bg-yellow-50',  border: 'border-yellow-200',  icon: Banknote },
  ADVANCE_PAID:       { label: 'Advance Paid',      color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200',    icon: CheckCircle2 },
  IN_PROGRESS:        { label: 'In Progress',       color: 'text-[#C8896A]',   bg: 'bg-[#FDF8F3]', border: 'border-[#C8896A]/30', icon: Package },
  FINAL_APPROVAL:     { label: 'Final Approval',    color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  icon: CheckCircle2 },
  READY_FOR_DELIVERY: { label: 'Ready to Ship',     color: 'text-cyan-700',    bg: 'bg-cyan-50',    border: 'border-cyan-200',    icon: Package },
  SHIPPED:            { label: 'Shipped',           color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200',  icon: Truck },
  DELIVERED:          { label: 'Delivered',         color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  COMPLETED:          { label: 'Completed',         color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  REJECTED:           { label: 'Rejected',          color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',    icon: XCircle },
  CANCELLED:          { label: 'Cancelled',         color: 'text-[#9E8079]',   bg: 'bg-[#F5EFE6]', border: 'border-[#EAE3DC]',   icon: XCircle },
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

export default async function SellerCustomOrderDetailPage({ params }: Params) {
  const session = await requireSeller()
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
  if (order.sellerId !== null && order.sellerId !== session.userId) redirect('/seller/custom-orders')

  const refImages = order.images.filter((i) => ['reference', 'sketch', 'logo', 'color_sample'].includes(i.imageType))

  const serializedMessages = order.messages.map((m) => ({
    id: m.id,
    message: m.message,
    senderId: m.senderId,
    senderName: m.sender.name,
    createdAt: m.createdAt.toISOString(),
  }))

  const serializedProgress = order.progress.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
  }))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back */}
      <Link href="/seller/custom-orders" className="inline-flex items-center gap-1.5 text-sm text-[#9E8079] hover:text-[#C8896A] transition-colors mb-6">
        <ArrowLeft size={15} />
        Back to Custom Orders
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
              {order.category && <span className="text-xs bg-[#F5EFE6] text-[#6B4C3B] px-2 py-0.5 rounded-full">{order.category.name}</span>}
              {order.sellerId === null && (
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">Unassigned</span>
              )}
            </div>
          </div>
          {order.estimatedPrice && (
            <div className="text-right">
              <p className="text-xs text-[#9E8079]">Quoted Price</p>
              <p className="text-xl font-bold text-[#C8896A]">{formatPrice(order.estimatedPrice)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Requirements */}
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
                {order.size && <div className="bg-[#F5EFE6] rounded-xl p-3"><p className="text-xs text-[#9E8079]">Size</p><p className="text-sm font-semibold text-[#2D1F1A]">{order.size}</p></div>}
                {order.color && <div className="bg-[#F5EFE6] rounded-xl p-3"><p className="text-xs text-[#9E8079]">Color</p><p className="text-sm font-semibold text-[#2D1F1A]">{order.color}</p></div>}
                {order.material && <div className="bg-[#F5EFE6] rounded-xl p-3"><p className="text-xs text-[#9E8079]">Material</p><p className="text-sm font-semibold text-[#2D1F1A]">{order.material}</p></div>}
                {order.designStyle && <div className="bg-[#F5EFE6] rounded-xl p-3"><p className="text-xs text-[#9E8079]">Design Style</p><p className="text-sm font-semibold text-[#2D1F1A]">{order.designStyle}</p></div>}
                {order.budget && (
                  <div className="bg-[#F5EFE6] rounded-xl p-3">
                    <p className="text-xs text-[#9E8079]">Customer Budget</p>
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
                  <p className="text-xs text-[#9E8079] mb-2">Personalization Details</p>
                  <div className="bg-[#F5EFE6] rounded-xl p-3 space-y-1.5">
                    {order.personalizationText && <p className="text-sm text-[#2D1F1A]"><span className="font-medium">Text:</span> {order.personalizationText}</p>}
                    {order.customMessage && <p className="text-sm text-[#2D1F1A]"><span className="font-medium">Message:</span> {order.customMessage}</p>}
                    {order.fontStyle && <p className="text-sm text-[#2D1F1A]"><span className="font-medium">Font:</span> {order.fontStyle}</p>}
                    {order.giftPackaging && <p className="text-sm text-[#C8896A] font-medium flex items-center gap-1"><Gift size={12} /> Gift packaging requested</p>}
                  </div>
                </div>
              )}
              {order.specialInstructions && (
                <div>
                  <p className="text-xs text-[#9E8079] mb-1">Special Instructions</p>
                  <p className="text-sm text-[#2D1F1A] bg-amber-50 border border-amber-200 rounded-xl p-3">{order.specialInstructions}</p>
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

          {/* Action panel */}
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6">
            <h2 className="text-sm font-semibold text-[#2D1F1A] mb-4">Manage Order</h2>
            <SellerOrderActions
              orderId={order.id}
              status={order.status}
              estimatedPrice={order.estimatedPrice}
              advancePayment={order.advancePayment}
              finalPrice={order.finalPrice}
              deliveryDays={order.deliveryDays}
              quotationNotes={order.quotationNotes}
              trackingNumber={order.trackingNumber}
              courierName={order.courierName}
            />
          </div>

          {/* Progress */}
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6">
            <h2 className="text-sm font-semibold text-[#2D1F1A] mb-4 flex items-center gap-2">
              <Layers size={15} className="text-[#C8896A]" />
              Progress Updates
            </h2>
            {serializedProgress.length > 0 && (
              <div className="space-y-4 mb-6">
                {serializedProgress.map((p, idx) => (
                  <div key={p.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-[#7D9B76] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      {idx < serializedProgress.length - 1 && <div className="w-px flex-1 bg-[#EAE3DC] my-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-[#2D1F1A]">{p.title}</p>
                      {p.description && <p className="text-xs text-[#9E8079] mt-0.5">{p.description}</p>}
                      <p className="text-xs text-[#C4AEA4] mt-1">{new Date(p.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
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
            )}
            <SellerProgressForm orderId={order.id} />
          </div>

          {/* Messages */}
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6">
            <h2 className="text-sm font-semibold text-[#2D1F1A] mb-4 flex items-center gap-2">
              <MessageCircle size={15} className="text-[#C8896A]" />
              Messages with Customer
              {order.messages.length > 0 && (
                <span className="ml-auto text-xs bg-[#C8896A]/10 text-[#C8896A] px-2 py-0.5 rounded-full">{order.messages.length}</span>
              )}
            </h2>
            <SellerMessageBox
              orderId={order.id}
              currentUserId={session.userId}
              initialMessages={serializedMessages}
            />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
            <h3 className="text-sm font-semibold text-[#2D1F1A] mb-3">Customer</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#C8896A] to-[#8B5E45] flex items-center justify-center text-white text-sm font-bold shrink-0">
                {order.customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2D1F1A]">{order.customer.name}</p>
                <p className="text-xs text-[#9E8079]">{order.customer.email}</p>
              </div>
            </div>
            <div className="space-y-2.5 border-t border-[#F5EFE6] pt-3">
              <InfoRow icon={User} label="Contact Name" value={order.customerName} />
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
                <span>Payment</span>
                <span className={`font-medium ${order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>{order.paymentStatus}</span>
              </div>
              <div className="flex justify-between">
                <span>Submitted</span>
                <span className="text-[#2D1F1A]">{new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              {order.deliveryDays && (
                <div className="flex justify-between">
                  <span>Delivery Days</span>
                  <span className="text-[#2D1F1A] font-medium">{order.deliveryDays} days</span>
                </div>
              )}
              {order.trackingNumber && (
                <div className="flex justify-between">
                  <span>Tracking</span>
                  <span className="text-[#2D1F1A] font-mono text-[10px]">{order.trackingNumber}</span>
                </div>
              )}
              {order.courierName && (
                <div className="flex justify-between">
                  <span>Courier</span>
                  <span className="text-[#2D1F1A] font-medium">{order.courierName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quotation summary if already quoted */}
          {order.estimatedPrice && (
            <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
              <h3 className="text-sm font-semibold text-[#2D1F1A] mb-3">Quotation</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#9E8079]">Total Price</span>
                  <span className="font-bold text-[#C8896A]">{formatPrice(order.estimatedPrice)}</span>
                </div>
                {order.advancePayment && (
                  <div className="flex justify-between">
                    <span className="text-[#9E8079]">Advance</span>
                    <span className="font-semibold text-amber-700">{formatPrice(order.advancePayment)}</span>
                  </div>
                )}
                {order.finalPrice && (
                  <div className="flex justify-between">
                    <span className="text-[#9E8079]">Remaining</span>
                    <span className="font-semibold text-[#2D1F1A]">{formatPrice(order.finalPrice)}</span>
                  </div>
                )}
                {order.deliveryDays && (
                  <div className="flex justify-between">
                    <span className="text-[#9E8079]">Delivery</span>
                    <span className="font-semibold text-[#2D1F1A]">{order.deliveryDays} days</span>
                  </div>
                )}
              </div>
              {order.quotationNotes && (
                <p className="mt-3 text-xs text-[#9E8079] bg-[#F5EFE6] rounded-lg p-2">{order.quotationNotes}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
