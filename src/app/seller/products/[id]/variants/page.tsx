'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Edit2, Save, X, Loader2,
  Package, CheckCircle, AlertCircle, Layers, Images,
} from 'lucide-react'
import { formatPrice } from '@/lib/currency'

type Variant = {
  id: number
  color: string | null
  size: string | null
  material: string | null
  design: string | null
  sku: string | null
  price: number
  stockQuantity: number
  imageUrl: string | null
  status: 'AVAILABLE' | 'OUT_OF_STOCK' | 'DISCONTINUED'
}

const STATUS_BADGE = {
  AVAILABLE:    'bg-green-50 text-green-700 border-green-200',
  OUT_OF_STOCK: 'bg-rose-50 text-rose-700 border-rose-200',
  DISCONTINUED: 'bg-gray-50 text-gray-500 border-gray-200',
}

const COLORS = ['Red', 'Blue', 'Green', 'Black', 'White', 'Brown', 'Beige', 'Pink', 'Purple', 'Orange', 'Yellow', 'Multi-color']
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size', 'Custom']

const EMPTY_FORM = { color: '', size: '', material: '', design: '', sku: '', price: '', stockQuantity: '', imageUrl: '' }

export default function VariantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params)
  const [variants, setVariants] = useState<Variant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => { fetchVariants() }, [productId])

  async function fetchVariants() {
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${productId}/variants`)
      const data = await res.json()
      setVariants(data.variants ?? [])
    } catch {
      showToast('error', 'Failed to load variants.')
    } finally {
      setLoading(false)
    }
  }

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  function startEdit(variant: Variant) {
    setEditingId(variant.id)
    setForm({
      color: variant.color ?? '',
      size: variant.size ?? '',
      material: variant.material ?? '',
      design: variant.design ?? '',
      sku: variant.sku ?? '',
      price: String(variant.price),
      stockQuantity: String(variant.stockQuantity),
      imageUrl: variant.imageUrl ?? '',
    })
    setShowForm(true)
  }

  function resetForm() {
    setForm({ ...EMPTY_FORM })
    setEditingId(null)
    setShowForm(false)
  }

  async function handleSave() {
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) {
      showToast('error', 'Valid price is required.')
      return
    }
    if (form.stockQuantity === '' || isNaN(Number(form.stockQuantity)) || Number(form.stockQuantity) < 0) {
      showToast('error', 'Valid stock quantity is required.')
      return
    }
    if (!form.color && !form.size && !form.material && !form.design) {
      showToast('error', 'At least one attribute (color, size, material, or design) is required.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        color: form.color || null,
        size: form.size || null,
        material: form.material || null,
        design: form.design || null,
        sku: form.sku || null,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        imageUrl: form.imageUrl || null,
      }

      const url = editingId ? `/api/variants/${editingId}` : `/api/products/${productId}/variants`
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save variant.')
      showToast('success', editingId ? 'Variant updated!' : 'Variant added!')
      resetForm()
      fetchVariants()
    } catch (e) {
      showToast('error', (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(variantId: number) {
    if (!confirm('Delete this variant? This cannot be undone.')) return
    setDeletingId(variantId)
    try {
      const res = await fetch(`/api/variants/${variantId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete variant.')
      showToast('success', 'Variant deleted.')
      fetchVariants()
    } catch (e) {
      showToast('error', (e as Error).message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-medium animate-in slide-in-from-top-2 duration-200 ${
          toast.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Step banner */}
      <div className="flex items-center gap-2 text-xs font-medium text-[#9E8079]">
        <span className="px-2.5 py-1 rounded-full bg-[#EAE3DC] text-[#6B4C3B]">Step 1 — Details ✓</span>
        <ArrowRight size={12} />
        <span className="px-2.5 py-1 rounded-full bg-[#C8896A] text-white">Step 2 — Variants</span>
        <ArrowRight size={12} />
        <span className="px-2.5 py-1 rounded-full bg-[#EAE3DC] text-[#6B4C3B]">Step 3 — Photos</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/seller/products/${productId}/edit`}
            className="flex items-center gap-1.5 text-sm text-[#9E8079] hover:text-[#2D1F1A] transition-colors"
          >
            <ArrowLeft size={15} /> Back to Product
          </Link>
          <span className="text-[#EAE3DC]">|</span>
          <h1 className="text-xl font-serif font-bold text-[#2D1F1A] flex items-center gap-2">
            <Layers size={20} className="text-[#C8896A]" /> Product Variants
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!showForm && (
            <button
              onClick={() => { resetForm(); setShowForm(true) }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-colors"
            >
              <Plus size={15} /> Add Variant
            </button>
          )}
          <Link
            href={`/seller/products/${productId}/gallery`}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#B8795A] transition-colors"
          >
            <Images size={15} /> Next: Photos
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5 space-y-4">
          <h2 className="font-semibold text-[#2D1F1A]">{editingId ? 'Edit Variant' : 'New Variant'}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LBL}>Color</label>
              <select value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} className={INPUT}>
                <option value="">No color</option>
                {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={LBL}>Size</label>
              <select value={form.size} onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))} className={INPUT}>
                <option value="">No size</option>
                {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={LBL}>Material</label>
              <input value={form.material} onChange={(e) => setForm((p) => ({ ...p, material: e.target.value }))} placeholder="e.g. Cotton, Wood, Ceramic" className={INPUT} />
            </div>
            <div>
              <label className={LBL}>Design / Pattern</label>
              <input value={form.design} onChange={(e) => setForm((p) => ({ ...p, design: e.target.value }))} placeholder="e.g. Floral, Geometric" className={INPUT} />
            </div>
            <div>
              <label className={LBL}>Price (PKR) *</label>
              <input type="number" min="0" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder="0" className={INPUT} />
            </div>
            <div>
              <label className={LBL}>Stock Quantity *</label>
              <input type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm((p) => ({ ...p, stockQuantity: e.target.value }))} placeholder="0" className={INPUT} />
            </div>
            <div>
              <label className={LBL}>SKU (optional)</label>
              <input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} placeholder="Unique SKU code" className={INPUT} />
            </div>
            <div>
              <label className={LBL}>Image URL (optional)</label>
              <input value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="https://..." className={INPUT} />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving...' : editingId ? 'Update Variant' : 'Add Variant'}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#F5F2EF] text-[#2D1F1A] text-sm font-medium rounded-xl hover:bg-[#EAE3DC] transition-colors"
            >
              <X size={15} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Variants List */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center gap-2">
          <Package size={16} className="text-[#C8896A]" />
          <h2 className="font-semibold text-[#2D1F1A]">Variants</h2>
          <span className="ml-auto text-xs text-[#9E8079]">{variants.length} variant{variants.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-[#F5F2EF] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : variants.length === 0 ? (
          <div className="py-16 text-center">
            <Layers size={36} className="mx-auto text-[#C4AEA4] mb-3" />
            <p className="text-sm text-[#9E8079]">No variants yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 text-sm text-[#7D9B76] font-medium hover:underline"
            >
              + Add your first variant
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#F5EFE6]">
            {variants.map((v) => (
              <div key={v.id} className="px-5 py-4 flex items-center gap-4 hover:bg-[#FDF8F4] transition-colors">
                {/* Color swatch */}
                {v.color && (
                  <div
                    className="w-8 h-8 rounded-lg border border-[#EAE3DC] shrink-0"
                    style={{ backgroundColor: v.color.toLowerCase() === 'multi-color' ? 'conic-gradient(red, yellow, green, blue, red)' : v.color.toLowerCase() }}
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5">
                    {v.color && <Chip label={v.color} />}
                    {v.size && <Chip label={v.size} />}
                    {v.material && <Chip label={v.material} />}
                    {v.design && <Chip label={v.design} />}
                  </div>
                  {v.sku && <p className="text-[10px] text-[#C4AEA4] mt-0.5 font-mono">SKU: {v.sku}</p>}
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bold text-[#2D1F1A]">{formatPrice(v.price)}</p>
                  <p className="text-xs text-[#9E8079]">Stock: {v.stockQuantity}</p>
                </div>

                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGE[v.status]}`}>
                  {v.status === 'OUT_OF_STOCK' ? 'Out' : v.status === 'DISCONTINUED' ? 'Disc.' : 'In Stock'}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(v)}
                    className="p-1.5 text-[#9E8079] hover:text-[#C8896A] hover:bg-[#C8896A]/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    disabled={deletingId === v.id}
                    className="p-1.5 text-[#9E8079] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40"
                    title="Delete"
                  >
                    {deletingId === v.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span className="inline-block text-xs font-medium text-[#2D1F1A] bg-[#F5F2EF] border border-[#EAE3DC] px-2 py-0.5 rounded-full">
      {label}
    </span>
  )
}

const LBL = 'block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5'
const INPUT = 'w-full px-3 py-2 text-sm text-[#2D1F1A] bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76] transition-colors'
