'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Ban, ChevronDown } from 'lucide-react'

type Props = { shopId: number; currentStatus: string }

export default function AdminShopActions({ shopId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function updateStatus(status: string) {
    setLoading(true)
    setOpen(false)
    try {
      await fetch(`/api/admin/shops/${shopId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      window.location.reload()
    } catch {
      alert('Failed to update status.')
    } finally {
      setLoading(false)
    }
  }

  const options = [
    { value: 'ACTIVE', label: 'Approve', icon: CheckCircle, color: 'text-green-600' },
    { value: 'BLOCKED', label: 'Block', icon: Ban, color: 'text-rose-600' },
    { value: 'INACTIVE', label: 'Deactivate', icon: XCircle, color: 'text-gray-500' },
    { value: 'PENDING', label: 'Set Pending', icon: ChevronDown, color: 'text-amber-600' },
  ].filter((o) => o.value !== currentStatus)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[#F5F2EF] text-[#2D1F1A] rounded-lg hover:bg-[#EAE3DC] transition-colors disabled:opacity-50"
      >
        Actions <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-20 bg-white rounded-xl border border-[#EAE3DC] shadow-lg overflow-hidden min-w-[130px]">
            {options.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => updateStatus(opt.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-[#F5F2EF] transition-colors ${opt.color}`}
                >
                  <Icon size={13} /> {opt.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
