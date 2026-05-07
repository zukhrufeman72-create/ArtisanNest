'use client'

import { useState, useCallback } from 'react'
import { AlertTriangle, CheckCircle, Save, RefreshCw, Package, TrendingDown, Warehouse } from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: number
  name: string
  stock: number
  price: number
  isActive: boolean
  isApproved: boolean
  category: { name: string }
}

interface StockManagerProps {
  products: Product[]
}

export default function StockManager({ products }: StockManagerProps) {
  const [stocks, setStocks] = useState<Record<number, number>>(
    Object.fromEntries(products.map((p) => [p.id, p.stock]))
  )
  const [reasons, setReasons] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')

  const outOfStock = products.filter((p) => p.stock === 0).length
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 5).length

  const changed = products.filter((p) => stocks[p.id] !== p.stock)

  const filtered = products.filter((p) => {
    if (filter === 'out') return p.stock === 0
    if (filter === 'low') return p.stock > 0 && p.stock < 5
    return true
  })

  const save = useCallback(async () => {
    const items = changed.map((p) => ({
      productId: p.id,
      stock: stocks[p.id],
      reason: reasons[p.id],
    }))
    if (items.length === 0) return

    setSaving(true)
    try {
      const res = await fetch('/api/seller/inventory/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        // Reset reasons
        setReasons({})
      }
    } finally {
      setSaving(false)
    }
  }, [changed, stocks, reasons])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Inventory Management</h1>
          <p className="text-sm text-[#9E8079] mt-0.5">{products.length} products · {outOfStock} out of stock · {lowStock} low</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/seller/inventory/history"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white text-sm text-[#6B4C3B] hover:bg-[#F5EFE6] transition-colors">
            <RefreshCw size={13} /> History
          </Link>
          {changed.length > 0 && (
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-colors disabled:opacity-60"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : saved ? (
                <CheckCircle size={14} />
              ) : (
                <Save size={14} />
              )}
              {saved ? 'Saved!' : `Save ${changed.length} change${changed.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>

      {/* Alert banners */}
      {(outOfStock > 0 || lowStock > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {outOfStock > 0 && (
            <button
              onClick={() => setFilter(filter === 'out' ? 'all' : 'out')}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all ${
                filter === 'out'
                  ? 'bg-rose-100 border-2 border-rose-400'
                  : 'bg-rose-50 border border-rose-200 hover:border-rose-300'
              }`}
            >
              <TrendingDown size={18} className="text-rose-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-rose-700">{outOfStock} Out of Stock</p>
                <p className="text-xs text-rose-500">Click to filter</p>
              </div>
            </button>
          )}
          {lowStock > 0 && (
            <button
              onClick={() => setFilter(filter === 'low' ? 'all' : 'low')}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all ${
                filter === 'low'
                  ? 'bg-amber-100 border-2 border-amber-400'
                  : 'bg-amber-50 border border-amber-200 hover:border-amber-300'
              }`}
            >
              <AlertTriangle size={18} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-700">{lowStock} Low Stock (under 5)</p>
                <p className="text-xs text-amber-500">Click to filter</p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'low', 'out'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f ? 'bg-[#C8896A] text-white' : 'bg-white border border-[#EAE3DC] text-[#9E8079] hover:border-[#C8896A]'
            }`}
          >
            {f === 'all' ? `All (${products.length})` : f === 'low' ? `Low (${lowStock})` : `Out (${outOfStock})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center gap-2">
          <Warehouse size={16} className="text-[#C8896A]" />
          <h2 className="font-semibold text-[#2D1F1A]">Stock Levels</h2>
          {changed.length > 0 && (
            <span className="ml-auto text-xs text-[#C8896A] font-medium bg-[#C8896A]/10 px-2 py-0.5 rounded-full">
              {changed.length} unsaved
            </span>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#9E8079]">
            <Package size={40} className="opacity-20 mb-3" />
            <p className="text-sm">No products in this view</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F5EFE6]">
            {filtered.map((product) => {
              const currentStock = stocks[product.id]
              const isDirty = currentStock !== product.stock
              const statusColor =
                currentStock === 0 ? 'text-rose-500' :
                currentStock < 5 ? 'text-amber-500' :
                'text-[#7D9B76]'
              const statusBg =
                currentStock === 0 ? 'bg-rose-50' :
                currentStock < 5 ? 'bg-amber-50' :
                'bg-[#7D9B76]/10'

              return (
                <div
                  key={product.id}
                  className={`px-5 py-4 transition-colors ${isDirty ? 'bg-[#FDF8F4]' : 'hover:bg-[#FAFAF8]'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${statusBg}`}>
                      {currentStock === 0 ? (
                        <AlertTriangle size={15} className="text-rose-500" />
                      ) : currentStock < 5 ? (
                        <AlertTriangle size={15} className="text-amber-500" />
                      ) : (
                        <CheckCircle size={15} className="text-[#7D9B76]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="font-medium text-[#2D1F1A]">{product.name}</p>
                          <p className="text-xs text-[#9E8079] mt-0.5">
                            {product.category.name} · PKR {product.price.toLocaleString()}
                            {!product.isApproved && (
                              <span className="ml-2 bg-amber-100 text-amber-600 text-[10px] px-1.5 py-0.5 rounded-full font-medium">Pending approval</span>
                            )}
                          </p>
                        </div>
                        <span className={`text-lg font-bold tabular-nums ${statusColor}`}>
                          {currentStock}
                          {isDirty && (
                            <span className="text-xs text-[#9E8079] ml-1">
                              (was {product.stock})
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        {/* Stock slider */}
                        <div className="flex items-center gap-2 flex-1 min-w-36">
                          <button
                            onClick={() => setStocks((s) => ({ ...s, [product.id]: Math.max(0, (s[product.id] ?? 0) - 1) }))}
                            className="w-7 h-7 rounded-lg bg-[#F5F0EB] border border-[#EAE3DC] flex items-center justify-center text-[#6B4C3B] hover:bg-[#EAE3DC] transition-colors font-bold text-base leading-none"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={currentStock}
                            onChange={(e) => setStocks((s) => ({ ...s, [product.id]: Math.max(0, Number(e.target.value)) }))}
                            className="w-20 px-2 py-1.5 text-sm text-center bg-white border border-[#EAE3DC] rounded-lg text-[#2D1F1A] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76]"
                          />
                          <button
                            onClick={() => setStocks((s) => ({ ...s, [product.id]: (s[product.id] ?? 0) + 1 }))}
                            className="w-7 h-7 rounded-lg bg-[#F5F0EB] border border-[#EAE3DC] flex items-center justify-center text-[#6B4C3B] hover:bg-[#EAE3DC] transition-colors font-bold text-base leading-none"
                          >
                            +
                          </button>
                          {/* Quick set buttons */}
                          {[10, 25, 50].map((n) => (
                            <button
                              key={n}
                              onClick={() => setStocks((s) => ({ ...s, [product.id]: n }))}
                              className="px-2 py-1 text-[10px] font-medium rounded-lg bg-[#F5F0EB] text-[#9E8079] hover:bg-[#EAE3DC] hover:text-[#6B4C3B] transition-colors"
                            >
                              {n}
                            </button>
                          ))}
                        </div>

                        {isDirty && (
                          <input
                            placeholder="Reason (optional)"
                            value={reasons[product.id] ?? ''}
                            onChange={(e) => setReasons((r) => ({ ...r, [product.id]: e.target.value }))}
                            className="flex-1 min-w-40 px-3 py-1.5 text-xs bg-white border border-[#EAE3DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76] text-[#6B4C3B] placeholder:text-[#C8B5AC]"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sticky save bar */}
      {changed.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 bg-[#2D1F1A] text-white px-5 py-3 rounded-2xl shadow-2xl shadow-black/30">
            <span className="text-sm font-medium">{changed.length} unsaved change{changed.length !== 1 ? 's' : ''}</span>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#7D9B76] hover:bg-[#6a8663] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
            >
              {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={13} />}
              Save All
            </button>
            <button
              onClick={() => setStocks(Object.fromEntries(products.map((p) => [p.id, p.stock])))}
              className="text-xs text-white/60 hover:text-white transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
