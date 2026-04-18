import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import ProductsView from '@/components/seller/ProductsView'

export default async function MyProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string; minPrice?: string; maxPrice?: string; stock?: string }>
}) {
  const session = await verifySession()
  const { q, status, category, minPrice, maxPrice, stock } = await searchParams

  const minP = minPrice ? parseFloat(minPrice) : undefined
  const maxP = maxPrice ? parseFloat(maxPrice) : undefined

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        sellerId: session.userId,
        ...(q ? { name: { contains: q } } : {}),
        ...(status === 'approved' ? { isApproved: true } : status === 'pending' ? { isApproved: false } : {}),
        ...(category ? { categoryId: parseInt(category) } : {}),
        ...(minP !== undefined || maxP !== undefined ? { price: { ...(minP !== undefined ? { gte: minP } : {}), ...(maxP !== undefined ? { lte: maxP } : {}) } } : {}),
        ...(stock === 'instock' ? { stock: { gt: 0 } } : stock === 'outofstock' ? { stock: 0 } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, shortDescription: true, price: true,
        discountPrice: true, stock: true, image: true,
        isApproved: true, isActive: true, createdAt: true,
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  return (
    <ProductsView
      products={products}
      categories={categories}
      currentFilters={{ q, status, category, minPrice, maxPrice, stock }}
    />
  )
}
