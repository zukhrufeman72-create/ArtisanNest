'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'

interface AuditLog {
  id: number
  action: string
  entity: string
  entityId: string | null
  oldData: string | null
  newData: string | null
  ipAddress: string | null
  createdAt: string
  userEmail: string | null
  userRole: string | null
  user: { id: number; name: string; email: string } | null
}

const ACTION_COLOR: Record<string, string> = {
  APPROVE: 'bg-emerald-500/15 text-emerald-600',
  REJECT: 'bg-rose-500/15 text-rose-600',
  DELETE: 'bg-rose-500/15 text-rose-600',
  CREATE: 'bg-blue-500/15 text-blue-600',
  UPDATE: 'bg-amber-500/15 text-amber-600',
  BLOCK: 'bg-rose-500/15 text-rose-600',
}

function getActionColor(action: string): string {
  for (const [key, cls] of Object.entries(ACTION_COLOR)) {
    if (action.includes(key)) return cls
  }
  return 'bg-[#9E8079]/15 text-[#9E8079]'
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [action, setAction] = useState('')
  const [entity, setEntity] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (action) params.set('action', action)
    if (entity) params.set('entity', entity)
    fetch(`/api/admin/audit-logs?${params}`)
      .then((r) => r.json())
      .then((data: { logs?: AuditLog[]; total?: number; pages?: number }) => {
        setLogs(data.logs ?? [])
        setTotal(data.total ?? 0)
        setPages(data.pages ?? 1)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page, action, entity])

  useEffect(() => { load() }, [load])

  const entities = ['User', 'Product', 'Order', 'Deal', 'RefundRequest', 'Category', 'Shop']

  return (
    <div className="min-h-screen bg-[#F5F0EB] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2D1F1A]">Audit Trail</h1>
            <p className="text-sm text-[#9E8079] mt-0.5">{total} events logged</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-[#EAE3DC] text-sm hover:bg-[#EAE3DC] transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <input
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1) }}
            placeholder="Filter by action..."
            className="px-4 py-2 rounded-xl border border-[#EAE3DC] bg-white text-sm focus:outline-none focus:border-[#C8896A] w-48"
          />
          <select
            value={entity}
            onChange={(e) => { setEntity(e.target.value); setPage(1) }}
            className="px-4 py-2 rounded-xl border border-[#EAE3DC] bg-white text-sm focus:outline-none focus:border-[#C8896A]"
          >
            <option value="">All Entities</option>
            {entities.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-[#C8896A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-[#9E8079]">No audit logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#EAE3DC] bg-[#F5F0EB]/50">
                    {['Time', 'User', 'Role', 'Action', 'Entity', 'IP', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <>
                      <tr
                        key={log.id}
                        className="border-b border-[#EAE3DC]/50 hover:bg-[#F5F0EB]/30 transition-colors cursor-pointer"
                        onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                      >
                        <td className="px-4 py-3 text-xs text-[#9E8079] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-[#2D1F1A]">{log.user?.name ?? log.userEmail ?? 'System'}</div>
                          <div className="text-xs text-[#9E8079]">{log.user?.email ?? ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#C8896A]/10 text-[#C8896A]">
                            {log.userRole ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-[#2D1F1A]">{log.entity}</span>
                          {log.entityId && <span className="text-xs text-[#9E8079] ml-1">#{log.entityId}</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#9E8079]">{log.ipAddress ?? '—'}</td>
                        <td className="px-4 py-3">
                          {(log.oldData || log.newData) && (
                            <button className="text-xs text-[#C8896A] hover:underline">
                              {expanded === log.id ? 'Hide' : 'Details'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expanded === log.id && (log.oldData || log.newData) && (
                        <tr key={`${log.id}-detail`} className="border-b border-[#EAE3DC] bg-[#F5F0EB]/30">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="grid grid-cols-2 gap-4">
                              {log.oldData && (
                                <div>
                                  <p className="text-xs font-semibold text-rose-600 mb-1">Before</p>
                                  <pre className="text-xs bg-rose-50 text-rose-800 p-2 rounded-lg overflow-auto max-h-24">
                                    {JSON.stringify(JSON.parse(log.oldData), null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.newData && (
                                <div>
                                  <p className="text-xs font-semibold text-emerald-600 mb-1">After</p>
                                  <pre className="text-xs bg-emerald-50 text-emerald-800 p-2 rounded-lg overflow-auto max-h-24">
                                    {JSON.stringify(JSON.parse(log.newData), null, 2)}
                                  </pre>
                                </div>
                              )}
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
