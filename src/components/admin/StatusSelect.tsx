'use client'

import { useTransition } from 'react'
import { updateOrderStatus } from '@/app/actions/admin'

const STATUS_OPTIONS = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const

export default function StatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: number
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const formData = new FormData()
    formData.set('orderId', String(orderId))
    formData.set('status', e.target.value)
    startTransition(() => updateOrderStatus(formData))
  }

  return (
    <select
      defaultValue={currentStatus}
      disabled={isPending}
      onChange={handleChange}
      className="text-xs border border-[#EAE3DC] rounded-lg px-2 py-1.5 bg-[#F5F2EF] text-[#2D1F1A] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/30 disabled:opacity-60 transition-opacity"
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s.charAt(0) + s.slice(1).toLowerCase()}
        </option>
      ))}
    </select>
  )
}
