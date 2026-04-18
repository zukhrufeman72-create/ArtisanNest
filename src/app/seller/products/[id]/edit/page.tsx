import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProductForm from '@/components/seller/ProductForm'
import { Pencil } from 'lucide-react'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession()
  const { id } = await params
  const productId = parseInt(id, 10)

  const [product, categories] = await Promise.all([
    prisma.product.findFirst({
      where: { id: productId, sellerId: session.userId },
      select: {
        id: true,
        name: true,
        shortDescription: true,
        price: true,
        discountPrice: true,
        stock: true,
        image: true,
        categoryId: true,
        material: true,
        origin: true,
      },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  if (!product) notFound()

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Edit Product</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">Update your listing details</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#EAE3DC]">
          <div className="w-8 h-8 rounded-lg bg-[#C8896A]/10 flex items-center justify-center">
            <Pencil size={15} className="text-[#C8896A]" />
          </div>
          <div>
            <h2 className="font-semibold text-[#2D1F1A]">{product.name}</h2>
            <p className="text-xs text-[#9E8079]">Editing product #{product.id}</p>
          </div>
        </div>
        <ProductForm categories={categories} product={product} />
      </div>
    </div>
  )
}
