import { Clock, AlertCircle, Banknote, CheckCircle2, Package, Truck, XCircle } from 'lucide-react'

export type SerializedOrder = {
  id: number
  title: string
  status: string
  paymentStatus: string
  estimatedPrice: number | null
  budget: number | null
  createdAt: string
  customerName: string
  customerEmail: string
  thumbUrl: string | null
  isAssigned: boolean
}

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
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
