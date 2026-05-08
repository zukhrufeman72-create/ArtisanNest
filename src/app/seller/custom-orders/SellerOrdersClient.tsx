'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ChevronRight, ClipboardList, Calendar, User, Banknote } from 'lucide-react'
import type { SerializedOrder } from './types'
import { STATUS_CONFIG } from './types'

const ALL_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'REVIEWING', label: 'Reviewing' },
  { key: 'QUOTED', label: 'Quoted' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'CANCELLED', label: 'Cancelled' },
]

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', icon: () => null }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

export default function SellerOrdersClient({ orders }: { orders: SerializedOrder[] }) {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('ALL')

  const filtered = useMemo(() => {
    let list = orders
    if (tab !== 'ALL') list = list.filter((o) => o.status === tab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q)
      )
    }
    return list
  }, [orders, tab, search])

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8079]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or customer name…"
          className="w-full pl-10 pr-4 py-2.5 border border-[#EAE3DC] rounded-xl text-sm bg-white focus:outline-none focus:border-[#C8896A] focus:ring-2 focus:ring-[#C8896A]/10 transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {ALL_TABS.map((t) => {
          const count = t.key === 'ALL' ? orders.length : orders.filter((o) => o.status === t.key).length
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 shrink-0
                ${tab === t.key ? 'bg-[#2D1F1A] text-white' : 'bg-white text-[#6B4C3B] border border-[#EAE3DC] hover:bg-[#F5EFE6]'}`}
            >
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/20' : 'bg-[#F5EFE6]'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#F5EFE6] flex items-center justify-center mx-auto mb-3">
            <ClipboardList size={24} className="text-[#9E8079]" />
          </div>
          <p className="text-sm text-[#9E8079]">No custom orders found{tab !== 'ALL' ? ` with status "${tab}"` : ''}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Link
              key={order.id}
              href={`/seller/custom-orders/${order.id}`}
              className="flex items-start gap-4 bg-white rounded-2xl border border-[#EAE3DC] p-4 hover:border-[#C8896A]/40 hover:shadow-sm transition-all duration-200 group"
            >
              {/* Thumbnail */}
              <div className="w-14 h-14 rounded-xl bg-[#F5EFE6] overflow-hidden shrink-0 flex items-center justify-center">
                {order.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={order.thumbUrl} alt={order.title} className="w-full h-full object-cover" />
                ) : (
                  <ClipboardList size={20} className="text-[#C8896A]/40" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-semibold text-[#2D1F1A] group-hover:text-[#C8896A] transition-colors truncate">
                        {order.title}
                      </h3>
                      <StatusBadge status={order.status} />
                      {!order.isAssigned && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                          Unassigned
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-xs text-[#9E8079]">
                      <span className="flex items-center gap-1">
                        <User size={10} />
                        {order.customerName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {order.budget && (
                        <span className="flex items-center gap-1">
                          <Banknote size={10} />
                          Budget: Rs. {order.budget.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {order.estimatedPrice && (
                      <span className="text-sm font-bold text-[#C8896A]">Rs. {order.estimatedPrice.toLocaleString()}</span>
                    )}
                    <ChevronRight size={15} className="text-[#9E8079] group-hover:text-[#C8896A] transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
