'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, Package, Sparkles, Image as ImageIcon, FileText,
  ChevronRight, ChevronLeft, Loader2, AlertCircle, CheckCircle2,
  Plus, Trash2, Gift,
} from 'lucide-react'

type Category = { id: number; name: string }

type ImageEntry = { url: string; imageType: string }

const IMAGE_TYPES = [
  { value: 'reference', label: 'Reference' },
  { value: 'sketch', label: 'Sketch' },
  { value: 'logo', label: 'Logo' },
  { value: 'color_sample', label: 'Color Sample' },
]

const SECTIONS = [
  { id: 'info', label: 'Your Information', icon: User },
  { id: 'product', label: 'Product Details', icon: Package },
  { id: 'personalization', label: 'Personalization', icon: Sparkles },
  { id: 'images', label: 'Reference Images', icon: ImageIcon },
  { id: 'instructions', label: 'Special Instructions', icon: FileText },
]

const inputClass =
  'mt-1.5 w-full border border-[#EAE3DC] rounded-xl px-3.5 py-2.5 text-sm text-[#2D1F1A] bg-white focus:outline-none focus:border-[#C8896A] focus:ring-2 focus:ring-[#C8896A]/10 transition-all placeholder:text-[#C4AEA4]'
const labelClass = 'block text-sm font-medium text-[#6B4C3B]'

export default function CustomOrderForm({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Section 1 — Your Information
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')

  // Section 2 — Product Details
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')
  const [material, setMaterial] = useState('')
  const [designStyle, setDesignStyle] = useState('')
  const [budget, setBudget] = useState('')
  const [deadline, setDeadline] = useState('')

  // Section 3 — Personalization
  const [personalizationText, setPersonalizationText] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [fontStyle, setFontStyle] = useState('')
  const [giftPackaging, setGiftPackaging] = useState(false)

  // Section 4 — Images
  const [images, setImages] = useState<ImageEntry[]>([{ url: '', imageType: 'reference' }])

  // Section 5 — Instructions
  const [specialInstructions, setSpecialInstructions] = useState('')

  function addImage() {
    if (images.length < 4) setImages((prev) => [...prev, { url: '', imageType: 'reference' }])
  }
  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }
  function updateImage(idx: number, field: keyof ImageEntry, value: string) {
    setImages((prev) => prev.map((img, i) => i === idx ? { ...img, [field]: value } : img))
  }

  function validateStep(s: number): string {
    if (s === 1) {
      if (!title.trim()) return 'Product title is required.'
      if (!description.trim()) return 'Product description is required.'
    }
    return ''
  }

  function nextStep() {
    const err = validateStep(step)
    if (err) { setError(err); return }
    setError('')
    setStep((s) => Math.min(s + 1, SECTIONS.length - 1))
  }
  function prevStep() {
    setError('')
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleSubmit() {
    const err = validateStep(step)
    if (err) { setError(err); return }
    setError('')
    setSubmitting(true)

    const validImages = images.filter((img) => img.url.trim())
    try {
      const res = await fetch('/api/custom-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          categoryId: categoryId ? Number(categoryId) : undefined,
          quantity: quantity ? Number(quantity) : 1,
          size: size.trim() || undefined,
          color: color.trim() || undefined,
          material: material.trim() || undefined,
          designStyle: designStyle.trim() || undefined,
          budget: budget ? Number(budget) : undefined,
          deadline: deadline || undefined,
          personalizationText: personalizationText.trim() || undefined,
          customMessage: customMessage.trim() || undefined,
          fontStyle: fontStyle.trim() || undefined,
          giftPackaging,
          specialInstructions: specialInstructions.trim() || undefined,
          customerName: customerName.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          deliveryAddress: deliveryAddress.trim() || undefined,
          imageUrls: validImages.length > 0 ? validImages : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to submit. Please try again.')
        setSubmitting(false)
        return
      }
      router.push('/custom-orders')
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  const progressPct = ((step + 1) / SECTIONS.length) * 100

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#C8896A]/10 flex items-center justify-center">
            <Sparkles size={20} className="text-[#C8896A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2D1F1A]">Request a Custom Order</h1>
            <p className="text-sm text-[#9E8079]">Tell our artisans exactly what you have in mind</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#9E8079]">Step {step + 1} of {SECTIONS.length}</span>
            <span className="text-xs font-medium text-[#C8896A]">{SECTIONS[step].label}</span>
          </div>
          <div className="h-2 bg-[#EAE3DC] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C8896A] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Step tabs */}
        <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1">
          {SECTIONS.map((sec, i) => {
            const Icon = sec.icon
            return (
              <button
                key={sec.id}
                onClick={() => { setError(''); setStep(i) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 shrink-0
                  ${i === step
                    ? 'bg-[#C8896A] text-white shadow-sm'
                    : i < step
                      ? 'bg-[#C8896A]/10 text-[#C8896A]'
                      : 'bg-white text-[#9E8079] border border-[#EAE3DC]'
                  }`}
              >
                <Icon size={12} />
                {sec.label}
                {i < step && <CheckCircle2 size={10} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Section card */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F5EFE6] bg-[#FDF8F3]/60">
          {(() => { const Icon = SECTIONS[step].icon; return (
            <div className="flex items-center gap-2">
              <Icon size={16} className="text-[#C8896A]" />
              <h2 className="font-semibold text-[#2D1F1A] text-sm">{SECTIONS[step].label}</h2>
            </div>
          )})()}
        </div>

        <div className="p-6 space-y-5">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Step 0 — Your Information */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} placeholder="Your full name" />
                </div>
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={inputClass} placeholder="your@email.com" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={inputClass} placeholder="+92 300 0000000" />
              </div>
              <div>
                <label className={labelClass}>Delivery Address</label>
                <textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder="Full delivery address including city and postal code" />
              </div>
              <p className="text-xs text-[#9E8079] bg-[#F5EFE6] rounded-xl p-3">
                This information helps the seller prepare your order and arrange delivery. All fields are optional but recommended.
              </p>
            </div>
          )}

          {/* Step 1 — Product Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Order Title <span className="text-rose-500">*</span></label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Custom embroidered cushion cover" />
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Description <span className="text-rose-500">*</span></label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className={`${inputClass} resize-none`} placeholder="Describe the item in detail — dimensions, style, purpose, any specific requirements..." />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Quantity</label>
                  <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Size / Dimensions</label>
                  <input value={size} onChange={(e) => setSize(e.target.value)} className={inputClass} placeholder="e.g. 12x12 inches" />
                </div>
                <div>
                  <label className={labelClass}>Color Preference</label>
                  <input value={color} onChange={(e) => setColor(e.target.value)} className={inputClass} placeholder="e.g. Navy blue, gold" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Preferred Material</label>
                  <input value={material} onChange={(e) => setMaterial(e.target.value)} className={inputClass} placeholder="e.g. Cotton, silk, clay" />
                </div>
                <div>
                  <label className={labelClass}>Design Style</label>
                  <input value={designStyle} onChange={(e) => setDesignStyle(e.target.value)} className={inputClass} placeholder="e.g. Minimalist, floral, traditional" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Budget (PKR)</label>
                  <input type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} className={inputClass} placeholder="Your maximum budget" />
                </div>
                <div>
                  <label className={labelClass}>Deadline</label>
                  <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} min={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Personalization */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Personalization Text</label>
                <input value={personalizationText} onChange={(e) => setPersonalizationText(e.target.value)} className={inputClass} placeholder="e.g. Name, date, initials to embroider or engrave" />
              </div>
              <div>
                <label className={labelClass}>Custom Message</label>
                <textarea value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder="Any personalized message or quote to include..." />
              </div>
              <div>
                <label className={labelClass}>Font Style Preference</label>
                <input value={fontStyle} onChange={(e) => setFontStyle(e.target.value)} className={inputClass} placeholder="e.g. Cursive, bold, calligraphy" />
              </div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className={`relative mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 shrink-0 ${giftPackaging ? 'bg-[#C8896A] border-[#C8896A]' : 'border-[#EAE3DC] bg-white group-hover:border-[#C8896A]/50'}`}>
                  <input type="checkbox" className="sr-only" checked={giftPackaging} onChange={(e) => setGiftPackaging(e.target.checked)} />
                  {giftPackaging && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-[#2D1F1A]">
                    <Gift size={14} className="text-[#C8896A]" />
                    Gift Packaging
                  </div>
                  <p className="text-xs text-[#9E8079] mt-0.5">Request premium gift wrapping for your order (may incur additional charges)</p>
                </div>
              </label>
            </div>
          )}

          {/* Step 3 — Reference Images */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-[#9E8079]">Paste image URLs to share reference images, sketches, logos, or color samples with the seller. Up to 4 images.</p>
              {images.map((img, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-[#F5EFE6] rounded-xl border border-[#EAE3DC]">
                  <div className="flex-1 space-y-2.5">
                    <div>
                      <label className={labelClass}>Image URL</label>
                      <input
                        value={img.url}
                        onChange={(e) => updateImage(idx, 'url', e.target.value)}
                        className={inputClass}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Image Type</label>
                      <select value={img.imageType} onChange={(e) => updateImage(idx, 'imageType', e.target.value)} className={inputClass}>
                        {IMAGE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    {img.url && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border border-[#EAE3DC]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      </div>
                    )}
                  </div>
                  {images.length > 1 && (
                    <button onClick={() => removeImage(idx)} className="mt-6 p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
              {images.length < 4 && (
                <button onClick={addImage} className="flex items-center gap-2 text-sm font-medium text-[#C8896A] hover:text-[#A8694A] transition-colors">
                  <Plus size={16} />
                  Add Another Image
                </button>
              )}
            </div>
          )}

          {/* Step 4 — Special Instructions */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Special Instructions</label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={6}
                  className={`${inputClass} resize-none`}
                  placeholder="Any other instructions for the seller — allergies to materials, specific techniques, packaging preferences, delivery notes, etc."
                />
              </div>
              {/* Summary */}
              <div className="bg-[#F5EFE6] rounded-xl p-4 space-y-2 border border-[#EAE3DC]">
                <h3 className="text-sm font-semibold text-[#2D1F1A]">Order Summary</h3>
                <div className="text-xs text-[#6B4C3B] space-y-1">
                  <p><span className="font-medium">Title:</span> {title || '—'}</p>
                  <p><span className="font-medium">Description:</span> {description ? description.slice(0, 80) + (description.length > 80 ? '…' : '') : '—'}</p>
                  {budget && <p><span className="font-medium">Budget:</span> Rs. {Number(budget).toLocaleString()}</p>}
                  {deadline && <p><span className="font-medium">Deadline:</span> {new Date(deadline).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                  {giftPackaging && <p className="text-[#C8896A] font-medium">Gift packaging requested</p>}
                  {images.filter((i) => i.url).length > 0 && <p><span className="font-medium">Images:</span> {images.filter((i) => i.url).length} attached</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-t border-[#F5EFE6] bg-[#FDF8F3]/40 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#6B4C3B] hover:text-[#2D1F1A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={15} />
            Back
          </button>

          {step < SECTIONS.length - 1 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#C8896A] hover:bg-[#A8694A] text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              Next
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#C8896A] hover:bg-[#A8694A] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              {submitting ? 'Submitting…' : 'Submit Custom Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
