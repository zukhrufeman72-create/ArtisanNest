'use client'

import { useActionState } from 'react'
import { addProduct, updateProduct } from '@/app/actions/seller'
import { Package, DollarSign, Image as ImageIcon, Tag, Layers, Globe, FileText } from 'lucide-react'

type Category = { id: number; name: string }

type ProductData = {
  id: number
  name: string
  shortDescription: string
  price: number
  discountPrice: number | null
  stock: number
  image: string
  categoryId: number
  material: string | null
  origin: string | null
}

type Props = {
  categories: Category[]
  product?: ProductData
}

export default function ProductForm({ categories, product }: Props) {
  const isEdit = !!product
  const action = isEdit ? updateProduct : addProduct
  const [state, formAction, isPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      const result = await action(formData)
      return result ?? null
    },
    null,
  )

  return (
    <form action={formAction} className="space-y-6">
      {isEdit && <input type="hidden" name="productId" value={product.id} />}

      {state?.error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Name */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
            Product Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Package size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8079]" />
            <input
              name="name"
              required
              defaultValue={product?.name}
              placeholder="e.g. Handwoven Wool Basket"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76] transition-all"
            />
          </div>
        </div>

        {/* Short Description */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
            Short Description <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <FileText size={15} className="absolute left-3.5 top-3 text-[#9E8079]" />
            <textarea
              name="shortDescription"
              required
              rows={2}
              defaultValue={product?.shortDescription}
              placeholder="Brief description of your product…"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76] transition-all resize-none"
            />
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
            Price ($) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8079]" />
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={product?.price}
              placeholder="0.00"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76] transition-all"
            />
          </div>
        </div>

        {/* Discount Price */}
        <div>
          <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
            Discount Price ($) <span className="text-[#C4AEA4] font-normal normal-case">optional</span>
          </label>
          <div className="relative">
            <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8079]" />
            <input
              name="discountPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.discountPrice ?? ''}
              placeholder="0.00"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76] transition-all"
            />
          </div>
        </div>

        {/* Stock */}
        <div>
          <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
            Stock <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Layers size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8079]" />
            <input
              name="stock"
              type="number"
              min="0"
              required
              defaultValue={product?.stock ?? 1}
              placeholder="0"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76] transition-all"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
            Category <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8079]" />
            <select
              name="categoryId"
              required
              defaultValue={product?.categoryId ?? ''}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76] transition-all appearance-none"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Image URL */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
            Image URL <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <ImageIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8079]" />
            <input
              name="image"
              type="url"
              required
              defaultValue={product?.image}
              placeholder="https://example.com/image.jpg"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76] transition-all"
            />
          </div>
        </div>

        {/* Material */}
        <div>
          <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
            Material <span className="text-[#C4AEA4] font-normal normal-case">optional</span>
          </label>
          <input
            name="material"
            defaultValue={product?.material ?? ''}
            placeholder="e.g. Wool, Cotton, Clay…"
            className="w-full px-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76] transition-all"
          />
        </div>

        {/* Origin */}
        <div>
          <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
            Origin <span className="text-[#C4AEA4] font-normal normal-case">optional</span>
          </label>
          <div className="relative">
            <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8079]" />
            <input
              name="origin"
              defaultValue={product?.origin ?? ''}
              placeholder="e.g. Lahore, Pakistan"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76] transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (isEdit ? 'Saving…' : 'Adding…') : isEdit ? 'Save Changes' : 'Add Product'}
        </button>
        <a
          href="/seller/products"
          className="px-6 py-2.5 bg-[#F5F2EF] text-[#6B4C3B] text-sm font-semibold rounded-xl hover:bg-[#EAE3DC] transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
