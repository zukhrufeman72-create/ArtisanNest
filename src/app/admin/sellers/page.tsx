'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle, XCircle, Search,
  ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react'
import Image from 'next/image'

interface Seller {
  id: number
  name: string
  email: string
  isApproved: boolean
  createdAt: string
  lastLoginAt: string | null
  avatar: string | null
  shopProfile: { id: number; shopName: string; status: string } | null
  _count: { products: number }
}

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<number | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = useCallback(() => {
    const params = new URLSearchParams({ status, page: String(page) })
    if (search) params.set('search', search)
    fetch(`/api/admin/sellers?${params}`)
      .then((r) => r.json())
      .then((data: { sellers?: Seller[]; total?: number; pages?: number }) => {
        setSellers(data.sellers ?? [])
        setTotal(data.total ?? 0)
        setPages(data.pages ?? 1)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [status, page, search])

  useEffect(() => { load() }, [load])

  function refresh() { setLoading(true); load() }

  async function approve(id: number) {
    setProcessing(id)
    await fetch(`/api/admin/sellers/${id}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: true }),
    })
    setProcessing(null)
    void load()
  }

  async function reject() {
    if (!rejectModal) return
    setProcessing(rejectModal.id)
    await fetch(`/api/admin/sellers/${rejectModal.id}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: false, reason: rejectReason }),
    })
    setRejectModal(null)
    setRejectReason('')
    setProcessing(null)
    void load()
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2D1F1A]">Seller Approval</h1>
            <p className="text-sm text-[#9E8079] mt-0.5">{total} sellers registered</p>
          </div>
          <button onClick={refresh} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-[#EAE3DC] text-sm hover:bg-[#EAE3DC] transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-50">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079]" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search sellers..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#EAE3DC] bg-white text-sm focus:outline-none focus:border-[#C8896A]"
            />
          </div>
          {['all', 'pending', 'approved'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                status === s ? 'bg-[#C8896A] text-white' : 'bg-white border border-[#EAE3DC] text-[#9E8079] hover:border-[#C8896A]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-[#C8896A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sellers.length === 0 ? (
            <div className="text-center py-16 text-[#9E8079]">No sellers found.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#EAE3DC] bg-[#F5F0EB]/50">
                  {['Seller', 'Shop', 'Products', 'Joined', 'Last Login', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sellers.map((s) => (
                  <tr key={s.id} className="border-b border-[#EAE3DC]/50 hover:bg-[#F5F0EB]/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#C8896A]/20 flex items-center justify-center overflow-hidden shrink-0">
                          {s.avatar
                            ? <Image src={s.avatar} alt={s.name} width={36} height={36} className="object-cover" />
                            : <span className="text-[#C8896A] font-semibold text-sm">{s.name[0]}</span>
                          }
                        </div>
                        <div>
                          <p className="font-medium text-sm text-[#2D1F1A]">{s.name}</p>
                          <p className="text-xs text-[#9E8079]">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {s.shopProfile
                        ? <div>
                            <p className="text-sm text-[#2D1F1A] font-medium">{s.shopProfile.shopName}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              s.shopProfile.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                              s.shopProfile.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                              'bg-rose-100 text-rose-700'
                            }`}>{s.shopProfile.status}</span>
                          </div>
                        : <span className="text-xs text-[#9E8079]">No shop</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-sm text-[#2D1F1A]">{s._count.products}</td>
                    <td className="px-4 py-3 text-xs text-[#9E8079]">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs text-[#9E8079]">
                      {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        s.isApproved
                          ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                      }`}>
                        {s.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {!s.isApproved && (
                          <button
                            disabled={processing === s.id}
                            onClick={() => approve(s.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                          >
                            <CheckCircle size={12} />
                            Approve
                          </button>
                        )}
                        {s.isApproved && (
                          <button
                            disabled={processing === s.id}
                            onClick={() => setRejectModal({ id: s.id, name: s.name })}
                            className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 text-rose-600 text-xs rounded-lg hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
                          >
                            <XCircle size={12} />
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
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

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setRejectModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-[#2D1F1A] mb-2">Revoke Seller Approval</h3>
            <p className="text-sm text-[#9E8079] mb-4">You are revoking approval for <strong>{rejectModal.name}</strong>. Please provide a reason.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full border border-[#EAE3DC] rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-[#C8896A]"
              placeholder="Reason for rejection..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={reject}
                disabled={!rejectReason.trim() || processing === rejectModal.id}
                className="flex-1 py-2 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 disabled:opacity-50 transition-colors"
              >
                Confirm Revoke
              </button>
              <button onClick={() => setRejectModal(null)} className="flex-1 py-2 bg-[#F5F0EB] text-[#2D1F1A] rounded-xl text-sm font-medium hover:bg-[#EAE3DC] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
