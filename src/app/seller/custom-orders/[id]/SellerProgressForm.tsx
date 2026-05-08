'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

type Props = { orderId: number }

const inputClass = 'mt-1.5 w-full border border-[#EAE3DC] rounded-xl px-3.5 py-2.5 text-sm text-[#2D1F1A] bg-white focus:outline-none focus:border-[#7D9B76] focus:ring-2 focus:ring-[#7D9B76]/10 transition-all placeholder:text-[#C4AEA4]'
const labelClass = 'block text-xs font-medium text-[#6B4C3B]'

export default function SellerProgressForm({ orderId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function submit() {
    if (!title.trim()) { setError('Title is required.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/seller/custom-orders/${orderId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined, imageUrl: imageUrl.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to add progress.')
      } else {
        setSuccess(true)
        setTitle('')
        setDescription('')
        setImageUrl('')
        setTimeout(() => {
          setSuccess(false)
          setOpen(false)
          router.refresh()
        }, 1200)
      }
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#7D9B76]/10 hover:bg-[#7D9B76]/20 border border-[#7D9B76]/30 text-[#7D9B76] text-sm font-semibold rounded-xl transition-all"
        >
          <Plus size={14} />
          Add Progress Update
        </button>
      ) : (
        <div className="border border-[#7D9B76]/30 bg-[#7D9B76]/5 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[#2D1F1A]">Add Progress Update</h3>
          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              <AlertCircle size={12} className="shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs">
              <CheckCircle2 size={12} className="shrink-0" />
              Progress update added!
            </div>
          )}
          <div>
            <label className={labelClass}>Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Materials prepared, Design sketched, Work 50% done" />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputClass} resize-none`} placeholder="Optional details about this progress update…" />
          </div>
          <div>
            <label className={labelClass}>Progress Image URL</label>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={inputClass} placeholder="https://... (optional photo of progress)" />
            {imageUrl && (
              <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-[#EAE3DC]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={loading || success}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#7D9B76] hover:bg-[#5E7E5A] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              {loading ? 'Adding…' : 'Add Update'}
            </button>
            <button onClick={() => { setOpen(false); setError('') }} className="px-4 py-2 text-sm text-[#9E8079] hover:text-[#2D1F1A] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
