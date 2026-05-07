'use client'

import { useState } from 'react'
import { Pencil, X, Save } from 'lucide-react'

interface CategoryData {
  id: number
  name: string
  description: string | null
  image: string | null
  color: string | null
  icon: string | null
  sortOrder: number
  isActive: boolean
}

export default function CategoryEditor({ category }: { category: CategoryData }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: category.name,
    description: category.description ?? '',
    image: category.image ?? '',
    color: category.color ?? '#C8896A',
    icon: category.icon ?? '',
    sortOrder: category.sortOrder,
    isActive: category.isActive,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setError('')
    setSaving(true)
    const res = await fetch(`/api/admin/categories/${category.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Failed to save.')
      setSaving(false)
      return
    }
    setSaving(false)
    setOpen(false)
    window.location.reload()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-[#C8896A] hover:bg-[#C8896A]/10 transition-colors border border-[#C8896A]/30"
      >
        <Pencil size={11} /> Edit
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#2D1F1A]">Edit Category</h3>
              <button onClick={() => setOpen(false)}><X size={18} className="text-[#9E8079]" /></button>
            </div>

            {error && <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#2D1F1A]">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C8896A]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#2D1F1A]">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#C8896A]"
                  placeholder="Brief description of this category..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#2D1F1A]">Image URL</label>
                <input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C8896A]"
                  placeholder="https://..."
                />
                {form.image && (
                  <img src={form.image} alt="preview" className="mt-2 h-20 rounded-xl object-cover w-full" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#2D1F1A]">Brand Color</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-[#EAE3DC] cursor-pointer"
                    />
                    <input
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="flex-1 border border-[#EAE3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C8896A]"
                      placeholder="#C8896A"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#2D1F1A]">Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C8896A]"
                    min={0}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#2D1F1A]">Icon (emoji or text)</label>
                <input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="mt-1 w-full border border-[#EAE3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C8896A]"
                  placeholder="🧶 or leave empty"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 accent-[#C8896A]"
                />
                <label htmlFor="catActive" className="text-sm text-[#2D1F1A]">Active (visible on site)</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={save}
                disabled={saving || !form.name.trim()}
                className="flex items-center gap-2 flex-1 justify-center py-2.5 bg-[#C8896A] text-white rounded-xl text-sm font-medium hover:bg-[#B8795A] disabled:opacity-50 transition-colors"
              >
                {saving
                  ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Save size={15} />
                }
                Save Changes
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 bg-[#F5F0EB] text-[#2D1F1A] rounded-xl text-sm font-medium hover:bg-[#EAE3DC] transition-colors"
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
