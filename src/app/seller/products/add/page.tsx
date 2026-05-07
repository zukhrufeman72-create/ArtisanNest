import { prisma } from '@/lib/prisma'
import ProductForm from '@/components/seller/ProductForm'
import { PlusCircle } from 'lucide-react'

export default async function AddProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#7D9B76]/10 flex items-center justify-center">
          <PlusCircle size={18} className="text-[#7D9B76]" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Add New Product</h1>
          <p className="text-sm text-[#9E8079] mt-0.5">Step 1 of 3 — Fill in the product details</p>
        </div>
      </div>

      {categories.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
          No categories available yet. Ask an admin to create some categories first.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 lg:p-8">
        <ProductForm categories={categories} />
      </div>
    </div>
  )
}
