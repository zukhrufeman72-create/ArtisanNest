'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, CheckCircle, XCircle, Clock, DollarSign,
  ChevronLeft, ChevronRight, FileText,
} from 'lucide-react'

interface RefundRequest {
  id: number
  amount: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED'
  adminNote: string | null
  createdAt: string
  user: { id: number; name: string; email: string }
  order: { id: number; totalPrice: number; createdAt: string }
  processedBy: { id: number; name: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  APPROVED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  REJECTED: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  PROCESSED: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
}

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [noteMap, setNoteMap] = useState<Record<number, string>>({})
  const [processing, setProcessing] = useState<number | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (status) params.set('status', status)
    fetch(`/api/admin/refunds?${params}`)
      .then((r) => r.json())
      .then((data: { refunds?: RefundRequest[]; total?: number; pages?: number }) => {
        setRefunds(data.refunds ?? [])
        setTotal(data.total ?? 0)
        setPages(data.pages ?? 1)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page, status])

  useEffect(() => { load() }, [load])

  async function handleAction(id: number, newStatus: 'APPROVED' | 'REJECTED' | 'PROCESSED') {
    setProcessing(id)
    await fetch(`/api/admin/refunds/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, adminNote: noteMap[id] }),
    })
    setActionId(null)
    setProcessing(null)
    void load()
  }

  const stats = {
    total: total,
    pending: refunds.filter((r) => r.status === 'PENDING').length,
    approved: refunds.filter((r) => r.status === 'APPROVED').length,
    amount: refunds.reduce((s, r) => s + (r.status !== 'REJECTED' ? r.amount : 0), 0),
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#2D1F1A]">Refund Requests</h1>
            <p className="text-sm text-[#9E8079] mt-0.5">Manage customer refund requests</p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-[#EAE3DC] text-sm text-[#2D1F1A] hover:bg-[#EAE3DC] transition-colors"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: total, icon: FileText, color: 'text-[#C8896A]' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-500' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-emerald-500' },
            { label: 'Est. Amount', value: `PKR ${stats.amount.toLocaleString()}`, icon: DollarSign, color: 'text-blue-500' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-[#EAE3DC]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F5F0EB] flex items-center justify-center">
                  <s.icon size={20} className={s.color} />
                </div>
                <div>
                  <p className="text-xs text-[#9E8079]">{s.label}</p>
                  <p className="text-lg font-bold text-[#2D1F1A]">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {['', 'PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                status === s
                  ? 'bg-[#C8896A] text-white'
                  : 'bg-white text-[#9E8079] border border-[#EAE3DC] hover:border-[#C8896A]'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-[#C8896A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : refunds.length === 0 ? (
            <div className="text-center py-16 text-[#9E8079]">No refund requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#EAE3DC] bg-[#F5F0EB]/50">
                    {['Customer', 'Order', 'Amount', 'Reason', 'Status', 'Date', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((r) => (
                    <>
                      <tr key={r.id} className="border-b border-[#EAE3DC]/50 hover:bg-[#F5F0EB]/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-sm text-[#2D1F1A]">{r.user.name}</div>
                          <div className="text-xs text-[#9E8079]">{r.user.email}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#2D1F1A]">#{r.order.id}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-[#2D1F1A]">
                          PKR {r.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#9E8079] max-w-50 truncate">{r.reason}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#9E8079]">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {r.status === 'PENDING' && (
                            <button
                              onClick={() => setActionId(actionId === r.id ? null : r.id)}
                              className="px-3 py-1 text-xs bg-[#C8896A]/10 text-[#C8896A] rounded-lg hover:bg-[#C8896A]/20 transition-colors"
                            >
                              Review
                            </button>
                          )}
                        </td>
                      </tr>
                      {actionId === r.id && (
                        <tr key={`${r.id}-action`} className="bg-[#F5F0EB]/50 border-b border-[#EAE3DC]">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-medium text-[#2D1F1A] mb-1">Full Reason</p>
                                <p className="text-sm text-[#9E8079] bg-white rounded-lg p-3 border border-[#EAE3DC]">{r.reason}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-[#2D1F1A]">Admin Note (optional)</label>
                                <textarea
                                  value={noteMap[r.id] ?? ''}
                                  onChange={(e) => setNoteMap((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                  className="mt-1 w-full rounded-lg border border-[#EAE3DC] p-2 text-sm resize-none"
                                  rows={2}
                                  placeholder="Add a note for the customer..."
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  disabled={processing === r.id}
                                  onClick={() => handleAction(r.id, 'APPROVED')}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-sm rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                                >
                                  <CheckCircle size={14} />
                                  Approve
                                </button>
                                <button
                                  disabled={processing === r.id}
                                  onClick={() => handleAction(r.id, 'REJECTED')}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 text-white text-sm rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-colors"
                                >
                                  <XCircle size={14} />
                                  Reject
                                </button>
                                <button
                                  onClick={() => setActionId(null)}
                                  className="px-4 py-2 text-sm text-[#9E8079] bg-white border border-[#EAE3DC] rounded-xl hover:bg-[#F5F0EB] transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-xl border border-[#EAE3DC] disabled:opacity-40 hover:bg-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-[#9E8079]">Page {page} of {pages}</span>
            <button
              disabled={page === pages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-xl border border-[#EAE3DC] disabled:opacity-40 hover:bg-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
