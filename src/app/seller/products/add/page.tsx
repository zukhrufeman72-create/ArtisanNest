import { prisma } from '@/lib/prisma'
import ProductForm from '@/components/seller/ProductForm'
import { PlusCircle } from 'lucide-react'

export default async function AddProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Add Product</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">List a new handmade item on the marketplace</p>
      </div>

      {categories.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
          No categories available yet. Ask an admin to create some categories first.
        </div>
      ) : null}

      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#EAE3DC]">
          <div className="w-8 h-8 rounded-lg bg-[#7D9B76]/10 flex items-center justify-center">
            <PlusCircle size={16} className="text-[#7D9B76]" />
          </div>
          <h2 className="font-semibold text-[#2D1F1A]">Product Details</h2>
        </div>
        <ProductForm categories={categories} />
      </div>

      <div className="bg-[#F5F2EF] rounded-2xl border border-[#EAE3DC] p-4 text-xs text-[#9E8079]">
        <strong className="text-[#6B4C3B]">Note:</strong> New products require admin approval before appearing in the marketplace. You&apos;ll be notified once reviewed.
      </div>
    </div>
  )
}
