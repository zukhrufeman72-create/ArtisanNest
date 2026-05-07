'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { Upload, Trash2, Star, ArrowLeft, ArrowRight, ImagePlus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface ProductImage {
  id: number
  url: string
  altText: string | null
  isPrimary: boolean
  sortOrder: number
}

export default function ProductGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [images, setImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [altInput, setAltInput] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/products/${id}/images`)
    const data = await res.json()
    setImages(data.images ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => { void load() }, [load])

  async function handleUpload(file: File) {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!upRes.ok) { setUploading(false); return }
    const { url } = await upRes.json()
    await fetch(`/api/products/${id}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, isPrimary: images.length === 0 }),
    })
    setUploading(false)
    void load()
  }

  async function addByUrl() {
    if (!urlInput.trim()) return
    setUploading(true)
    await fetch(`/api/products/${id}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlInput.trim(), altText: altInput.trim() || null, isPrimary: images.length === 0 }),
    })
    setUrlInput('')
    setAltInput('')
    setUploading(false)
    void load()
  }

  async function setPrimary(imageId: number) {
    await fetch(`/api/products/${id}/images`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId, isPrimary: true }),
    })
    void load()
  }

  async function deleteImage(imageId: number) {
    setDeleting(imageId)
    await fetch(`/api/products/${id}/images?imageId=${imageId}`, { method: 'DELETE' })
    setDeleting(null)
    void load()
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Step banner */}
        <div className="flex items-center gap-2 text-xs font-medium text-[#9E8079]">
          <span className="px-2.5 py-1 rounded-full bg-[#EAE3DC] text-[#6B4C3B]">Step 1 — Details ✓</span>
          <ArrowRight size={12} />
          <span className="px-2.5 py-1 rounded-full bg-[#EAE3DC] text-[#6B4C3B]">Step 2 — Variants ✓</span>
          <ArrowRight size={12} />
          <span className="px-2.5 py-1 rounded-full bg-[#C8896A] text-white">Step 3 — Photos</span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href={`/seller/products/${id}/variants`}
            className="p-2 bg-white rounded-xl border border-[#EAE3DC] hover:bg-[#F5F0EB] transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#2D1F1A]">Product Gallery</h1>
            <p className="text-sm text-[#9E8079]">{images.length} image{images.length !== 1 ? 's' : ''} · First image is displayed as primary</p>
          </div>
          <Link
            href="/seller/products"
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-colors"
          >
            Done — View Products
          </Link>
        </div>

        {/* Upload zone */}
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6">
          <h3 className="font-semibold text-[#2D1F1A] mb-4 flex items-center gap-2">
            <ImagePlus size={18} className="text-[#C8896A]" />
            Add Images
          </h3>

          {/* Drag-and-drop upload */}
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? [])
                for (const file of files) await handleUpload(file)
              }}
            />
            <div className="border-2 border-dashed border-[#EAE3DC] rounded-xl p-8 text-center hover:border-[#C8896A] hover:bg-[#C8896A]/5 transition-all group">
              <Upload size={32} className="mx-auto text-[#9E8079] group-hover:text-[#C8896A] mb-2 transition-colors" />
              <p className="text-sm font-medium text-[#2D1F1A]">Drop images here or click to browse</p>
              <p className="text-xs text-[#9E8079] mt-1">PNG, JPG, WebP up to 10MB each</p>
            </div>
          </label>

          {/* URL input */}
          <div className="mt-4 flex gap-2 flex-wrap">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Or paste image URL..."
              className="flex-1 min-w-[200px] border border-[#EAE3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C8896A]"
            />
            <input
              value={altInput}
              onChange={(e) => setAltInput(e.target.value)}
              placeholder="Alt text (optional)"
              className="w-48 border border-[#EAE3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C8896A]"
            />
            <button
              onClick={addByUrl}
              disabled={!urlInput.trim() || uploading}
              className="px-4 py-2 bg-[#C8896A] text-white rounded-xl text-sm font-medium hover:bg-[#B8795A] disabled:opacity-50 transition-colors"
            >
              {uploading ? 'Adding…' : 'Add'}
            </button>
          </div>
        </div>

        {/* Gallery grid */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-[#C8896A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : images.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-12 text-center text-[#9E8079]">
            No images yet. Upload your first product photo.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <div
                key={img.id}
                className={`group relative bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                  img.isPrimary ? 'border-[#C8896A] shadow-lg' : 'border-[#EAE3DC] hover:border-[#C8896A]/50'
                }`}
              >
                {/* Image */}
                <div className="aspect-square relative bg-[#F5F0EB]">
                  <img
                    src={img.url}
                    alt={img.altText ?? `Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Primary badge */}
                  {img.isPrimary && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-[#C8896A] text-white text-xs font-medium rounded-full">
                      <Star size={9} fill="white" />
                      Primary
                    </div>
                  )}

                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!img.isPrimary && (
                      <button
                        onClick={() => setPrimary(img.id)}
                        className="p-2 bg-white rounded-xl hover:bg-[#F5F0EB] transition-colors"
                        title="Set as primary"
                      >
                        <Star size={15} className="text-[#C8896A]" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteImage(img.id)}
                      disabled={deleting === img.id}
                      className="p-2 bg-white rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-50"
                      title="Delete image"
                    >
                      <Trash2 size={15} className="text-rose-500" />
                    </button>
                  </div>
                </div>

                {/* Alt text */}
                {img.altText && (
                  <div className="p-2">
                    <p className="text-xs text-[#9E8079] truncate">{img.altText}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-center text-[#9E8079]">
          Click the star icon on any image to set it as the primary display image.
        </p>
      </div>
    </div>
  )
}
