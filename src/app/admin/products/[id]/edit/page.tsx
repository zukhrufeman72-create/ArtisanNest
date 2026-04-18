import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { adminUpdateProduct } from '@/app/actions/admin'
import {
  Package, DollarSign, Tag, Layers, Globe,
  CheckCircle, ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

export default async function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const productId = parseInt(id)

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: { seller: { select: { name: true, email: true } }, category: true },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  if (!product) notFound()

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="p-2 rounded-xl text-[#9E8079] hover:text-[#2D1F1A] hover:bg-[#EAE3DC] transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Edit Product</h1>
          <p className="text-sm text-[#9E8079] mt-0.5">
            by <strong className="text-[#6B4C3B]">{product.seller.name}</strong> · {product.seller.email}
          </p>
        </div>
      </div>

      <form action={adminUpdateProduct} className="space-y-0">
        <input type="hidden" name="productId" value={product.id} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-5">

            {/* Basic Info */}
            <Section title="Basic Information" icon={<Package size={15} className="text-[#C8896A]" />}>
              <Field label="Product Name" required>
                <input name="name" required defaultValue={product.name}
                  className={input()} />
              </Field>
              <Field label="Short Description" required>
                <textarea name="shortDescription" required rows={3} defaultValue={product.shortDescription}
                  className={`${input()} resize-none`} />
              </Field>
            </Section>

            {/* Pricing & Stock */}
            <Section title="Pricing & Stock" icon={<DollarSign size={15} className="text-[#C8896A]" />}>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Price ($)" required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079] text-sm font-medium">$</span>
                    <input name="price" type="number" step="0.01" min="0" required defaultValue={product.price}
                      className={`${input()} pl-7`} />
                  </div>
                </Field>
                <Field label="Discount Price" hint="optional">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079] text-sm font-medium">$</span>
                    <input name="discountPrice" type="number" step="0.01" min="0" defaultValue={product.discountPrice ?? ''}
                      className={`${input()} pl-7`} />
                  </div>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Stock Quantity" required>
                  <div className="relative">
                    <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079]" />
                    <input name="stock" type="number" min="0" required defaultValue={product.stock}
                      className={`${input()} pl-9`} />
                  </div>
                </Field>
                <Field label="Category" required>
                  <div className="relative">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079]" />
                    <select name="categoryId" required defaultValue={product.categoryId}
                      className={`${input()} pl-9 appearance-none`}>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </Field>
              </div>
            </Section>

            {/* Additional Details */}
            <Section title="Additional Details" icon={<Globe size={15} className="text-[#C8896A]" />}>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Material" hint="optional">
                  <input name="material" defaultValue={product.material ?? ''} className={input()} />
                </Field>
                <Field label="Origin" hint="optional">
                  <div className="relative">
                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079]" />
                    <input name="origin" defaultValue={product.origin ?? ''} className={`${input()} pl-9`} />
                  </div>
                </Field>
              </div>
            </Section>
          </div>

          {/* Right: Image + Approval */}
          <div className="space-y-5">
            {/* Product image preview */}
            <Section title="Product Image" icon={<Package size={15} className="text-[#C8896A]" />}>
              {product.image ? (
                <div className="rounded-xl overflow-hidden border border-[#EAE3DC]">
                  <img src={product.image} alt={product.name} className="w-full h-44 object-cover" />
                </div>
              ) : (
                <div className="h-44 bg-[#F5F2EF] rounded-xl flex items-center justify-center">
                  <Package size={28} className="text-[#C4AEA4]" />
                </div>
              )}
              <p className="text-[10px] text-[#9E8079] mt-2 text-center">Image editing is done by the seller</p>
            </Section>

            {/* Approval status */}
            <Section title="Approval Status" icon={<CheckCircle size={15} className="text-[#C8896A]" />}>
              <div className="space-y-2">
                {[
                  { value: 'true', label: '✅ Approved', desc: 'Live on the marketplace' },
                  { value: 'false', label: '⏳ Pending', desc: 'Hidden from marketplace' },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-start gap-3 p-3 rounded-xl border border-[#EAE3DC] cursor-pointer hover:bg-[#F5F2EF] transition-colors">
                    <input
                      type="radio"
                      name="isApproved"
                      value={opt.value}
                      defaultChecked={String(product.isApproved) === opt.value}
                      className="mt-0.5 accent-[#C8896A]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#2D1F1A]">{opt.label}</p>
                      <p className="text-xs text-[#9E8079]">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Section>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t border-[#EAE3DC] mt-6">
          <button type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#b3775a] transition-colors">
            Save Changes
          </button>
          <Link href="/admin/products"
            className="px-6 py-2.5 bg-[#F5F2EF] text-[#6B4C3B] text-sm font-semibold rounded-xl hover:bg-[#EAE3DC] transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

function input() {
  return 'w-full px-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/25 focus:border-[#C8896A] transition-all'
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
