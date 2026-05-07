'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Store, Upload, MapPin, Phone, Clock, Tag, Globe,
  CheckCircle, AlertCircle, Edit2, Save, X, Loader2,
  Image as ImageIcon, Info,
} from 'lucide-react'

type ShopProfile = {
  id: number
  shopName: string
  shopLogo: string | null
  shopBanner: string | null
  description: string | null
  address: string | null
  contactNumber: string | null
  businessCategory: string | null
  openingTime: string | null
  closingTime: string | null
  status: 'PENDING' | 'ACTIVE' | 'BLOCKED' | 'INACTIVE'
  createdAt: string
}

const STATUS_CONFIG = {
  PENDING:  { label: 'Pending Review', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  ACTIVE:   { label: 'Active',         color: 'bg-green-50 text-green-700 border-green-200' },
  BLOCKED:  { label: 'Blocked',        color: 'bg-rose-50 text-rose-700 border-rose-200' },
  INACTIVE: { label: 'Inactive',       color: 'bg-gray-50 text-gray-600 border-gray-200' },
}

const CATEGORIES = [
  'Handmade Jewelry', 'Pottery & Ceramics', 'Textile & Fabric',
  'Woodcraft', 'Leather Goods', 'Painting & Art',
  'Embroidery', 'Crochet & Knitting', 'Paper Crafts',
  'Glass Art', 'Metal Work', 'Other Crafts',
]

export default function SellerShopPage() {
  const [profile, setProfile] = useState<ShopProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    shopName: '', shopLogo: '', shopBanner: '', description: '',
    address: '', contactNumber: '', businessCategory: '', openingTime: '', closingTime: '',
  })

  useEffect(() => { fetchProfile() }, [])

  async function fetchProfile() {
    setLoading(true)
    try {
      const res = await fetch('/api/seller/shop-profile')
      const data = await res.json()
      setProfile(data.profile)
      if (data.profile) {
        setForm({
          shopName: data.profile.shopName ?? '',
          shopLogo: data.profile.shopLogo ?? '',
          shopBanner: data.profile.shopBanner ?? '',
          description: data.profile.description ?? '',
          address: data.profile.address ?? '',
          contactNumber: data.profile.contactNumber ?? '',
          businessCategory: data.profile.businessCategory ?? '',
          openingTime: data.profile.openingTime ?? '',
          closingTime: data.profile.closingTime ?? '',
        })
        setEditing(false)
      } else {
        setEditing(true)
      }
    } catch {
      showToast('error', 'Failed to load shop profile.')
    } finally {
      setLoading(false)
    }
  }

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  async function uploadImage(file: File, field: 'shopLogo' | 'shopBanner') {
    const setter = field === 'shopLogo' ? setUploadingLogo : setUploadingBanner
    setter(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setForm((prev) => ({ ...prev, [field]: data.url }))
    } catch (e) {
      showToast('error', (e as Error).message)
    } finally {
      setter(false)
    }
  }

  async function handleSave() {
    if (!form.shopName.trim()) {
      showToast('error', 'Shop name is required.')
      return
    }
    setSaving(true)
    try {
      const method = profile ? 'PUT' : 'POST'
      const res = await fetch('/api/seller/shop-profile', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed.')
      showToast('success', profile ? 'Shop profile updated!' : 'Shop profile created!')
      setProfile(data.profile)
      setEditing(false)
    } catch (e) {
      showToast('error', (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-[#EAE3DC] rounded-xl" />
        <div className="h-48 bg-[#EAE3DC] rounded-2xl" />
        <div className="h-80 bg-[#EAE3DC] rounded-2xl" />
      </div>
    )
  }

  const statusCfg = profile ? STATUS_CONFIG[profile.status] : null

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-medium animate-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Shop Profile</h1>
          <p className="text-sm text-[#9E8079] mt-0.5">Manage your shop information visible to customers.</p>
        </div>
        {profile && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#b3775a] transition-colors"
          >
            <Edit2 size={15} /> Edit Profile
          </button>
        )}
      </div>

      {/* Status Banner */}
      {profile && statusCfg && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium ${statusCfg.color}`}>
          <Info size={16} className="shrink-0" />
          <span>Shop Status: <strong>{statusCfg.label}</strong></span>
          {profile.status === 'PENDING' && (
            <span className="ml-1 text-xs opacity-75">— Under admin review. You&apos;ll be notified once approved.</span>
          )}
        </div>
      )}

      {/* Form / View Card */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        {/* Banner */}
        <div
          className="relative h-40 bg-gradient-to-r from-[#7D9B76]/20 to-[#C8896A]/20 flex items-center justify-center group cursor-pointer overflow-hidden"
          onClick={() => editing && bannerRef.current?.click()}
        >
          {form.shopBanner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.shopBanner} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#9E8079]">
              <ImageIcon size={32} />
              <span className="text-xs">Shop Banner</span>
            </div>
          )}
          {editing && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingBanner ? (
                <Loader2 size={24} className="text-white animate-spin" />
              ) : (
                <span className="text-white text-sm font-medium flex items-center gap-2">
                  <Upload size={16} /> Upload Banner
                </span>
              )}
            </div>
          )}
          <input
            ref={bannerRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) uploadImage(file, 'shopBanner')
            }}
          />
        </div>

        {/* Logo + Info */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-8 mb-5">
            {/* Logo */}
            <div
              className="relative w-20 h-20 rounded-2xl border-4 border-white bg-[#F5F2EF] flex items-center justify-center shadow-md cursor-pointer group overflow-hidden shrink-0"
              onClick={() => editing && logoRef.current?.click()}
            >
              {form.shopLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.shopLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Store size={28} className="text-[#C8896A]" />
              )}
              {editing && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                  {uploadingLogo ? (
                    <Loader2 size={16} className="text-white animate-spin" />
                  ) : (
                    <Upload size={16} className="text-white" />
                  )}
                </div>
              )}
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadImage(file, 'shopLogo')
                }}
              />
            </div>
            <div className="pb-1">
              {editing ? (
                <input
                  value={form.shopName}
                  onChange={(e) => setForm((p) => ({ ...p, shopName: e.target.value }))}
                  placeholder="Your Shop Name *"
                  className="text-xl font-serif font-bold text-[#2D1F1A] bg-transparent border-b-2 border-[#C8896A] outline-none pb-0.5 w-full max-w-xs"
                />
              ) : (
                <h2 className="text-xl font-serif font-bold text-[#2D1F1A]">{profile?.shopName}</h2>
              )}
              <p className="text-xs text-[#9E8079] mt-0.5">
                {editing ? 'Click logo/banner to upload images' : profile?.businessCategory ?? 'Handcraft Shop'}
              </p>
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Business Category" icon={<Tag size={14} />}>
              {editing ? (
                <select
                  value={form.businessCategory}
                  onChange={(e) => setForm((p) => ({ ...p, businessCategory: e.target.value }))}
                  className={INPUT}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <span className={VALUE}>{profile?.businessCategory || '—'}</span>
              )}
            </Field>

            <Field label="Contact Number" icon={<Phone size={14} />}>
              {editing ? (
                <input
                  value={form.contactNumber}
                  onChange={(e) => setForm((p) => ({ ...p, contactNumber: e.target.value }))}
                  placeholder="+92 300 0000000"
                  className={INPUT}
                />
              ) : (
                <span className={VALUE}>{profile?.contactNumber || '—'}</span>
              )}
            </Field>

            <Field label="Opening Time" icon={<Clock size={14} />}>
              {editing ? (
                <input
                  type="time"
                  value={form.openingTime}
                  onChange={(e) => setForm((p) => ({ ...p, openingTime: e.target.value }))}
                  className={INPUT}
                />
              ) : (
                <span className={VALUE}>{profile?.openingTime || '—'}</span>
              )}
            </Field>

            <Field label="Closing Time" icon={<Clock size={14} />}>
              {editing ? (
                <input
                  type="time"
                  value={form.closingTime}
                  onChange={(e) => setForm((p) => ({ ...p, closingTime: e.target.value }))}
                  className={INPUT}
                />
              ) : (
                <span className={VALUE}>{profile?.closingTime || '—'}</span>
              )}
            </Field>

            <div className="sm:col-span-2">
              <Field label="Address" icon={<MapPin size={14} />}>
                {editing ? (
                  <input
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Shop address"
                    className={INPUT}
                  />
                ) : (
                  <span className={VALUE}>{profile?.address || '—'}</span>
                )}
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Description" icon={<Globe size={14} />}>
                {editing ? (
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Tell customers about your shop, story, and specialty..."
                    rows={3}
                    className={`${INPUT} resize-none`}
                  />
                ) : (
                  <span className={`${VALUE} whitespace-pre-line`}>{profile?.description || '—'}</span>
                )}
              </Field>
            </div>
          </div>

          {/* Actions */}
          {editing && (
            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[#EAE3DC]">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? 'Saving...' : profile ? 'Save Changes' : 'Create Shop Profile'}
              </button>
              {profile && (
                <button
                  onClick={() => { setEditing(false); fetchProfile() }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#F5F2EF] text-[#2D1F1A] text-sm font-medium rounded-xl hover:bg-[#EAE3DC] transition-colors"
                >
                  <X size={15} /> Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info box if no profile */}
      {!profile && !loading && (
        <div className="bg-[#FDF8F4] border border-[#EAE3DC] rounded-2xl p-5 text-sm text-[#9E8079]">
          <p className="font-medium text-[#2D1F1A] mb-1">No shop profile yet</p>
          <p>Fill in your shop details above and click &quot;Create Shop Profile&quot; to get started. Your shop will be reviewed by admin before it goes live.</p>
        </div>
      )}
    </div>
  )
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
        {icon} {label}
      </label>
      {children}
    </div>
  )
}

const INPUT = 'w-full px-3 py-2 text-sm text-[#2D1F1A] bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76] transition-colors'
const VALUE = 'text-sm text-[#2D1F1A]'
