'use client'

import { useActionState } from 'react'
import { addProduct, updateProduct } from '@/app/actions/seller'
import {
  Package, DollarSign, Tag, Layers, Globe,
  Loader2, ArrowRight, Info,
} from 'lucide-react'

type Category = { id: number; name: string }
type ProductData = {
  id: number; name: string; shortDescription: string; price: number
  discountPrice: number | null; stock: number
  categoryId: number; material: string | null; origin: string | null
}
type Props = { categories: Category[]; product?: ProductData }

export default function ProductForm({ categories, product }: Props) {
  const isEdit = !!product
  const action = isEdit ? updateProduct : addProduct
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => (await action(formData)) ?? null,
    null,
  )

  return (
    <form action={formAction} className="space-y-6">
      {isEdit && <input type="hidden" name="productId" value={product.id} />}

      {/* Step indicator */}
      {!isEdit && (
        <div className="flex items-center gap-2 text-xs font-medium text-[#9E8079] flex-wrap">
          <span className="px-3 py-1.5 rounded-full bg-[#C8896A] text-white font-semibold">Step 1 — Details</span>
          <ArrowRight size={12} />
          <span className="px-3 py-1.5 rounded-full bg-[#EAE3DC] text-[#6B4C3B]">Step 2 — Variants</span>
          <ArrowRight size={12} />
          <span className="px-3 py-1.5 rounded-full bg-[#EAE3DC] text-[#6B4C3B]">Step 3 — Photos</span>
        </div>
      )}

      {state?.error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl">
          {state.error}
        </div>
      )}

      {/* Row 1: Name + Short Description */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Product Name" icon={<Package size={15} className="text-[#7D9B76]" />}>
          <Field label="Name" required>
            <input
              name="name"
              required
              defaultValue={product?.name}
              placeholder="e.g. Handwoven Wool Basket"
              className={input()}
            />
          </Field>
          <Field label="Short Description" required>
            <textarea
              name="shortDescription"
              required
              rows={4}
              defaultValue={product?.shortDescription}
              placeholder="Describe your product in a few sentences — materials, craftsmanship, use…"
              className={`${input()} resize-none`}
            />
          </Field>
        </Section>

        <Section title="Pricing & Stock" icon={<DollarSign size={15} className="text-[#7D9B76]" />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (PKR)" required>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={product?.price}
                placeholder="0"
                className={input()}
              />
            </Field>
            <Field label="Discount Price" hint="optional">
              <input
                name="discountPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.discountPrice ?? ''}
                placeholder="0"
                className={input()}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Stock Quantity" required>
              <div className="relative">
                <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079]" />
                <input
                  name="stock"
                  type="number"
                  min="0"
                  required
                  defaultValue={product?.stock ?? 1}
                  placeholder="1"
                  className={`${input()} pl-9`}
                />
              </div>
            </Field>
            <Field label="Category" required>
              <div className="relative">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079]" />
                <select
                  name="categoryId"
                  required
                  defaultValue={product?.categoryId ?? ''}
                  className={`${input()} pl-9 appearance-none`}
                >
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </Field>
          </div>
        </Section>
      </div>

      {/* Row 2: Additional Details */}
      <Section title="Additional Details" icon={<Globe size={15} className="text-[#7D9B76]" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Material" hint="optional">
            <input
              name="material"
              defaultValue={product?.material ?? ''}
              placeholder="e.g. Wool, Clay, Cotton, Wood…"
              className={input()}
            />
          </Field>
          <Field label="Origin" hint="optional">
            <div className="relative">
              <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079]" />
              <input
                name="origin"
                defaultValue={product?.origin ?? ''}
                placeholder="e.g. Lahore, PK"
                className={`${input()} pl-9`}
              />
            </div>
          </Field>
        </div>
      </Section>

      {/* Info banner (add mode only) */}
      {!isEdit && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 text-sm text-amber-800">
          <Info size={16} className="shrink-0 mt-0.5 text-amber-500" />
          <span>
            <strong>Photos and variants are added in the next steps.</strong>{' '}
            After submitting, you&apos;ll be taken to the Variants page (Step 2) then the Photos gallery (Step 3).
            Products require admin approval before going live.
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-8 py-3 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-colors disabled:opacity-60"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isPending
            ? isEdit ? 'Saving…' : 'Creating…'
            : isEdit ? 'Save Changes' : 'Continue to Variants →'}
        </button>
        <a
          href="/seller/products"
          className="px-6 py-3 bg-[#F5F2EF] text-[#6B4C3B] text-sm font-semibold rounded-xl hover:bg-[#EAE3DC] transition-colors"
        >
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
    <div className="bg-[#F5F2EF]/40 rounded-2xl border border-[#EAE3DC] overflow-hidden">
      <div className="px-5 py-3 border-b border-[#EAE3DC] flex items-center gap-2 bg-white">
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
