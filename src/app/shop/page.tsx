import Link from 'next/link'
import { PackageSearch } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getOptionalSession } from '@/lib/dal'
import NavbarWrapper from '@/components/NavbarWrapper'
import Footer from '@/components/Footer'
import PublicProductCard from '@/components/PublicProductCard'

export const dynamic = 'force-dynamic'

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>
}) {
  const rawCategory = (await searchParams).category
  const categoryValue = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory
  const parsedCategoryId = categoryValue ? Number(categoryValue) : undefined
  const categoryId =
    parsedCategoryId && Number.isInteger(parsedCategoryId) && parsedCategoryId > 0
      ? parsedCategoryId
      : undefined

  const [products, categories, selectedCategory, session] = await Promise.all([
    prisma.product.findMany({
      where: {
        isApproved: true,
        isActive: true,
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        shortDescription: true,
        price: true,
        discountPrice: true,
        stock: true,
        image: true,
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true },
        },
        category: { select: { name: true } },
        seller: { select: { id: true, name: true } },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    }),
    categoryId
      ? prisma.category.findUnique({
          where: { id: categoryId },
          select: { id: true, name: true },
        })
      : Promise.resolve(null),
    getOptionalSession(),
  ])

  const wishlistIds = session?.userId
    ? await prisma.wishlist
        .findMany({
          where: { userId: session.userId },
          select: { productId: true },
        })
        .then((items) => new Set(items.map((item) => item.productId)))
    : new Set<number>()

  const displayProducts = products.map(({ images, ...product }) => ({
    ...product,
    image: images[0]?.url ?? product.image,
  }))

  const title = selectedCategory?.name ?? 'All Products'

  return (
    <>
      <NavbarWrapper />
      <main className="min-h-screen bg-[#FDFAF7]">
        <section className="border-b border-[#EAE3DC] bg-[#FDF8F3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
            <p className="text-sm font-semibold text-[#C8896A] mb-2">Shop by category</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2D1F1A]">
              {title}
            </h1>
            <p className="text-sm text-[#9E8079] mt-2">
              {displayProducts.length} product{displayProducts.length === 1 ? '' : 's'} available
            </p>

            <nav aria-label="Product categories" className="flex flex-wrap gap-2 mt-6">
              <Link
                href="/shop"
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  !categoryId
                    ? 'bg-[#C8896A] text-white'
                    : 'bg-white text-[#6B4C3B] border border-[#EAE3DC] hover:border-[#C8896A]'
                }`}
              >
                All Products
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/shop?category=${category.id}`}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                    categoryId === category.id
                      ? 'bg-[#C8896A] text-white'
                      : 'bg-white text-[#6B4C3B] border border-[#EAE3DC] hover:border-[#C8896A]'
                  }`}
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          {displayProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayProducts.map((product) => (
                <PublicProductCard
                  key={product.id}
                  product={product}
                  isWishlisted={wishlistIds.has(product.id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <PackageSearch size={42} className="mx-auto text-[#C4AEA4] mb-4" />
              <h2 className="font-serif text-xl font-bold text-[#2D1F1A]">
                No products in this category yet
              </h2>
              <p className="text-sm text-[#9E8079] mt-2 mb-6">
                Browse all products to discover more handmade pieces.
              </p>
              <Link
                href="/shop"
                className="inline-flex px-5 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-lg hover:bg-[#A8694A] transition-colors"
              >
                View All Products
              </Link>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}
