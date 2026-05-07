'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, AlertCircle, Package, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'

interface HistoryEntry {
  id: number
  action: 'RESTOCK' | 'SOLD' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'INITIAL'
  quantity: number
  stockBefore: number
  stockAfter: number
  reason: string | null
  createdAt: string
  product: { id: number; name: string; image: string | null }
  variant: { id: number; color: string | null; size: string | null } | null
  createdByUser: { id: number; name: string } | null
}

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  RESTOCK: { label: 'Restock', color: 'bg-emerald-500/10 text-emerald-600', icon: TrendingUp },
  SOLD: { label: 'Sold', color: 'bg-blue-500/10 text-blue-600', icon: TrendingDown },
  ADJUSTMENT: { label: 'Adjustment', color: 'bg-amber-500/10 text-amber-600', icon: AlertCircle },
  RETURN: { label: 'Return', color: 'bg-purple-500/10 text-purple-600', icon: TrendingUp },
  DAMAGE: { label: 'Damaged', color: 'bg-rose-500/10 text-rose-600', icon: AlertCircle },
  INITIAL: { label: 'Initial', color: 'bg-[#9E8079]/10 text-[#9E8079]', icon: Package },
}

export default function InventoryHistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [action, setAction] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (action) params.set('action', action)
    const res = await fetch(`/api/seller/inventory/history?${params}`)
    const data = await res.json()
    setHistory(data.history ?? [])
    setTotal(data.total ?? 0)
    setPages(data.pages ?? 1)
    setLoading(false)
  }, [page, action])

  useEffect(() => { void load() }, [load])

  return (
    <div className="min-h-screen bg-[#F5F0EB] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2D1F1A]">Inventory History</h1>
            <p className="text-sm text-[#9E8079] mt-0.5">{total} stock change events</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-[#EAE3DC] text-sm hover:bg-[#EAE3DC] transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Action filter */}
        <div className="flex gap-2 flex-wrap">
          {['', 'RESTOCK', 'SOLD', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'INITIAL'].map((a) => (
            <button
              key={a}
              onClick={() => { setAction(a); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                action === a ? 'bg-[#C8896A] text-white' : 'bg-white border border-[#EAE3DC] text-[#9E8079] hover:border-[#C8896A]'
              }`}
            >
              {a || 'All'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-[#C8896A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 text-[#9E8079]">No inventory history yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#EAE3DC] bg-[#F5F0EB]/50">
                    {['Product', 'Action', 'Change', 'Before', 'After', 'Date', 'By'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => {
                    const cfg = ACTION_CONFIG[entry.action] ?? ACTION_CONFIG.ADJUSTMENT
                    const Icon = cfg.icon
                    return (
                      <tr key={entry.id} className="border-b border-[#EAE3DC]/50 hover:bg-[#F5F0EB]/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-[#2D1F1A]">{entry.product.name}</p>
                          {entry.variant && (
                            <p className="text-xs text-[#9E8079]">
                              {[entry.variant.color, entry.variant.size].filter(Boolean).join(' / ')}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1 w-fit px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                            <Icon size={11} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold ${entry.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#9E8079]">{entry.stockBefore}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#2D1F1A]">{entry.stockAfter}</td>
                        <td className="px-4 py-3 text-xs text-[#9E8079] whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#9E8079]">
                          {entry.createdByUser?.name ?? 'System'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-xl border border-[#EAE3DC] disabled:opacity-40 hover:bg-white transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-[#9E8079]">Page {page} of {pages}</span>
            <button disabled={page === pages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-xl border border-[#EAE3DC] disabled:opacity-40 hover:bg-white transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
