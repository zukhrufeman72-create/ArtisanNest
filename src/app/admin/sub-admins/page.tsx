'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Shield, Trash2, X, Check, RefreshCw } from 'lucide-react'

interface SubAdmin {
  id: number
  name: string
  email: string
  permissions: string | null
  createdAt: string
  lastLoginAt: string | null
}

const ALL_PERMISSIONS = [
  'manage_products', 'manage_orders', 'manage_users', 'manage_categories',
  'manage_reviews', 'manage_complaints', 'manage_refunds', 'view_analytics',
  'manage_deals', 'manage_shops', 'manage_delivery',
]

const EMPTY_FORM = { name: '', email: '', password: '', permissions: [] as string[] }

export default function SubAdminsPage() {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    fetch('/api/admin/sub-admins')
      .then((r) => r.json())
      .then((data: { subAdmins?: SubAdmin[] }) => {
        setSubAdmins(data.subAdmins ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  function refresh() { setLoading(true); load() }

  function togglePermission(perm: string) {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }))
  }

  async function create() {
    setError('')
    if (!form.name || !form.email || !form.password) {
      setError('Name, email, and password are required.')
      return
    }
    setSaving(true)
    const res = await fetch('/api/admin/sub-admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to create.'); setSaving(false); return }
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaving(false)
    void load()
  }

  async function remove(id: number) {
    if (!confirm('Delete this sub-admin?')) return
    setDeleting(id)
    await fetch(`/api/admin/sub-admins/${id}`, { method: 'DELETE' })
    setDeleting(null)
    void load()
  }


  return (
    <div className="min-h-screen bg-[#F5F0EB] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#2D1F1A]">Sub-Admins</h1>
            <p className="text-sm text-[#9E8079] mt-0.5">Manage restricted admin accounts (Super Admin only)</p>
          </div>
          <div className="flex gap-3">
            <button onClick={refresh} className="p-2 bg-white rounded-xl border border-[#EAE3DC] hover:bg-[#F5F0EB] transition-colors">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#C8896A] text-white rounded-xl text-sm font-medium hover:bg-[#B8795A] transition-colors"
            >
              <Plus size={16} />
              Add Sub-Admin
            </button>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-[#2D1F1A]">Create Sub-Admin Account</h3>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-[#9E8079]" /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-200">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              {[
                { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Admin Name' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'admin@example.com' },
                { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="text-sm font-medium text-[#2D1F1A]">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form] as string}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C8896A]"
                  />
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium text-[#2D1F1A] mb-3">Permissions</p>
              <div className="flex flex-wrap gap-2">
                {ALL_PERMISSIONS.map((perm) => (
                  <button
                    key={perm}
                    onClick={() => togglePermission(perm)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      form.permissions.includes(perm)
                        ? 'bg-[#C8896A] text-white border-[#C8896A]'
                        : 'bg-white text-[#9E8079] border-[#EAE3DC] hover:border-[#C8896A]'
                    }`}
                  >
                    {form.permissions.includes(perm) && <Check size={10} className="inline mr-1" />}
                    {perm.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={create}
                disabled={saving}
                className="px-6 py-2.5 bg-[#C8896A] text-white rounded-xl text-sm font-medium hover:bg-[#B8795A] disabled:opacity-50 transition-colors"
              >
                Create Sub-Admin
              </button>
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-[#F5F0EB] text-[#2D1F1A] rounded-xl text-sm font-medium hover:bg-[#EAE3DC] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-[#C8896A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : subAdmins.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-12 text-center text-[#9E8079]">
            No sub-admins yet. Create one to delegate admin access.
          </div>
        ) : (
          <div className="space-y-3">
            {subAdmins.map((admin) => {
              const perms: string[] = admin.permissions ? JSON.parse(admin.permissions) : []
              return (
                <div key={admin.id} className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#C8896A]/20 flex items-center justify-center">
                        <Shield size={18} className="text-[#C8896A]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#2D1F1A]">{admin.name}</h4>
                        <p className="text-sm text-[#9E8079]">{admin.email}</p>
                        <p className="text-xs text-[#9E8079] mt-0.5">
                          Joined {new Date(admin.createdAt).toLocaleDateString()}
                          {admin.lastLoginAt && ` · Last login ${new Date(admin.lastLoginAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        Sub-Admin
                      </span>
                      <button
                        onClick={() => remove(admin.id)}
                        disabled={deleting === admin.id}
                        className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  {perms.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {perms.map((p) => (
                        <span key={p} className="px-2 py-0.5 bg-[#C8896A]/10 text-[#C8896A] text-xs rounded-full">
                          {p.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
