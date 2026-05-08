'use client'

import { useState, useRef } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'

const STATUSES = [
  'PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED',
]

type Props = { orderId: number; currentStatus: string }

export default function AdminDeliveryActions({ orderId, currentStatus }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [showRemarks, setShowRemarks] = useState(false)
  const [pendingStatus, setPendingStatus] = useState('')
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  function handleOpen() {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      })
    }
    setOpen((o) => !o)
  }

  function selectStatus(status: string) {
    setPendingStatus(status)
    setOpen(false)
    setShowRemarks(true)
  }

  async function confirm() {
    setLoading(true)
    setShowRemarks(false)
    try {
      await fetch(`/api/orders/${orderId}/tracking`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: pendingStatus, remarks: remarks || undefined }),
      })
      window.location.reload()
    } catch {
      alert('Failed to update delivery status.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={handleOpen}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[#F5F2EF] text-[#2D1F1A] rounded-lg hover:bg-[#EAE3DC] transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : null}
          Update <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-200" onClick={() => setOpen(false)} />
            <div
              className="fixed z-201 bg-white rounded-xl border border-[#EAE3DC] shadow-lg overflow-hidden min-w-40"
              style={{ top: dropdownPos.top, right: dropdownPos.right }}
            >
              {STATUSES.filter((s) => s !== currentStatus).map((s) => (
                <button
                  key={s}
                  onClick={() => selectStatus(s)}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-[#2D1F1A] hover:bg-[#F5F2EF] transition-colors"
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Remarks Dialog */}
      {showRemarks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-[#EAE3DC] shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold text-[#2D1F1A] mb-1">Update to: {pendingStatus.replace(/_/g, ' ')}</h3>
            <p className="text-xs text-[#9E8079] mb-3">Add optional remarks or location (shown to customer).</p>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Package handed to courier, Expected by 5pm..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={confirm}
                className="flex-1 py-2 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#b3775a] transition-colors"
              >
                Confirm Update
              </button>
              <button
                onClick={() => { setShowRemarks(false); setPendingStatus(''); setRemarks('') }}
                className="flex-1 py-2 bg-[#F5F2EF] text-[#2D1F1A] text-sm font-medium rounded-xl hover:bg-[#EAE3DC] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
