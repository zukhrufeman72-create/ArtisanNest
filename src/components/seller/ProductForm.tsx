'use client'

import { useActionState, useState, useRef, useCallback } from 'react'
import { addProduct, updateProduct } from '@/app/actions/seller'
import {
  Package, DollarSign, Tag, Layers, Globe, FileText,
  Upload, X, ImageIcon, CheckCircle, Loader2,
} from 'lucide-react'

type Category = { id: number; name: string }
type ProductData = {
  id: number; name: string; shortDescription: string; price: number
  discountPrice: number | null; stock: number; image: string
  categoryId: number; material: string | null; origin: string | null
}
type Props = { categories: Category[]; product?: ProductData }

function ImageUpload({ defaultValue }: { defaultValue?: string }) {
  const [imageUrl, setImageUrl] = useState(defaultValue ?? '')
  const [preview, setPreview] = useState(defaultValue ?? '')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploadError('')
    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)
    setUploading(true)

    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) { setUploadError(data.error); setPreview('') }
      else setImageUrl(data.url)
    } catch {
      setUploadError('Upload failed. Please try again.')
      setPreview('')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <input type="hidden" name="image" value={imageUrl} required={!imageUrl} />

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-[#7D9B76]/30 group">
          <img src={preview} alt="Preview" className="w-full h-52 object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="bg-white rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm font-medium text-[#2D1F1A]">
                <Loader2 size={16} className="text-[#7D9B76] animate-spin" />
                Uploading…
              </div>
            </div>
          )}
          {!uploading && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => { setPreview(''); setImageUrl(''); if (inputRef.current) inputRef.current.value = '' }}
                className="bg-white text-rose-600 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-lg"
              >
                <X size={12} /> Remove
              </button>
            </div>
          )}
          {!uploading && imageUrl && (
            <div className="absolute top-2 right-2">
              <span className="bg-[#7D9B76] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle size={10} /> Uploaded
              </span>
            </div>
          )}
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center h-44 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
            dragOver
              ? 'border-[#7D9B76] bg-[#7D9B76]/5 scale-[1.01]'
              : 'border-[#EAE3DC] bg-[#F5F2EF] hover:border-[#7D9B76]/50 hover:bg-[#7D9B76]/5'
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors ${dragOver ? 'bg-[#7D9B76]/15' : 'bg-white border border-[#EAE3DC]'}`}>
            {dragOver ? <Upload size={20} className="text-[#7D9B76]" /> : <ImageIcon size={20} className="text-[#9E8079]" />}
          </div>
          <p className="text-sm font-medium text-[#2D1F1A]">
            {dragOver ? 'Drop to upload' : 'Click or drag image here'}
          </p>
          <p className="text-xs text-[#9E8079] mt-1">JPEG, PNG, WebP · max 5 MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={onFileChange}
        className="hidden"
      />

      {uploadError && (
        <p className="mt-2 text-xs text-rose-600 flex items-center gap-1">
          <X size={12} /> {uploadError}
        </p>
      )}
    </div>
  )
}

export default function ProductForm({ categories, product }: Props) {
  const isEdit = !!product
  const action = isEdit ? updateProduct : addProduct
  const [state, formAction, isPending] = useActionState(
    async (_prev: any, formData: FormData) => (await action(formData)) ?? null,
    null,
  )

  return (
    <form action={formAction} className="space-y-0">
      {isEdit && <input type="hidden" name="productId" value={product.id} />}

      {state?.error && (
        <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column: Details ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Section: Basic Info */}
          <Section title="Basic Information" icon={<Package size={15} className="text-[#7D9B76]" />}>
            <Field label="Product Name" required>
              <input name="name" required defaultValue={product?.name}
                placeholder="e.g. Handwoven Wool Basket"
                className={input()} />
            </Field>
            <Field label="Short Description" required>
              <textarea name="shortDescription" required rows={3} defaultValue={product?.shortDescription}
                placeholder="Describe your product in a few sentences…"
                className={`${input()} resize-none`} />
            </Field>
          </Section>

          {/* Section: Pricing & Stock */}
          <Section title="Pricing & Stock" icon={<DollarSign size={15} className="text-[#7D9B76]" />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price ($)" required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079] text-sm font-medium">$</span>
                  <input name="price" type="number" step="0.01" min="0" required defaultValue={product?.price}
                    placeholder="0.00" className={`${input()} pl-7`} />
                </div>
              </Field>
              <Field label="Discount Price" hint="optional">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079] text-sm font-medium">$</span>
                  <input name="discountPrice" type="number" step="0.01" min="0" defaultValue={product?.discountPrice ?? ''}
                    placeholder="0.00" className={`${input()} pl-7`} />
                </div>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Stock Quantity" required>
                <div className="relative">
                  <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079]" />
                  <input name="stock" type="number" min="0" required defaultValue={product?.stock ?? 1}
                    placeholder="1" className={`${input()} pl-9`} />
                </div>
              </Field>
              <Field label="Category" required>
                <div className="relative">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079]" />
                  <select name="categoryId" required defaultValue={product?.categoryId ?? ''}
                    className={`${input()} pl-9 appearance-none`}>
                    <option value="">Select…</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </Field>
            </div>
          </Section>

          {/* Section: Additional Details */}
          <Section title="Additional Details" icon={<Globe size={15} className="text-[#7D9B76]" />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Material" hint="optional">
                <input name="material" defaultValue={product?.material ?? ''} placeholder="e.g. Wool, Clay…"
                  className={input()} />
              </Field>
              <Field label="Origin" hint="optional">
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079]" />
                  <input name="origin" defaultValue={product?.origin ?? ''} placeholder="e.g. Lahore, PK"
                    className={`${input()} pl-9`} />
                </div>
              </Field>
            </div>
          </Section>
        </div>

        {/* ── Right column: Image ── */}
        <div className="space-y-5">
          <Section title="Product Image" icon={<ImageIcon size={15} className="text-[#7D9B76]" />}>
            <ImageUpload defaultValue={product?.image} />
          </Section>

          {/* Approval notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>⏳ Review required</strong><br />
              New products need admin approval before going live. You&apos;ll be notified once reviewed.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-6 border-t border-[#EAE3DC] mt-6">
        <button type="submit" disabled={isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-colors disabled:opacity-60">
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isPending ? (isEdit ? 'Saving…' : 'Adding…') : isEdit ? 'Save Changes' : 'Submit Product'}
        </button>
        <a href="/seller/products"
          className="px-6 py-2.5 bg-[#F5F2EF] text-[#6B4C3B] text-sm font-semibold rounded-xl hover:bg-[#EAE3DC] transition-colors">
          Cancel
        </a>
      </div>
    </form>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function input() {
  return 'w-full px-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/25 focus:border-[#7D9B76] transition-all'
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#EAE3DC] flex items-center gap-2 bg-[#F5F2EF]/50">
        {icon}
        <p className="text-xs font-semibold text-[#6B4C3B] uppercase tracking-wide">{title}</p>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
        {label}
        {required && <span className="text-rose-400 ml-0.5">*</span>}
        {hint && <span className="text-[#C4AEA4] font-normal normal-case ml-1">({hint})</span>}
      </label>
      {children}
    </div>
  )
}
