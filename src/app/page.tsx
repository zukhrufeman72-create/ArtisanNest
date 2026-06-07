import { prisma } from '@/lib/prisma'
import { getOptionalSession } from '@/lib/dal'
import NavbarWrapper from "@/components/NavbarWrapper"
import Hero from "@/components/Hero"
import DealsBanner from "@/components/DealsBanner"
import FeaturedProducts from "@/components/FeaturedProducts"
import Categories from "@/components/Categories"
import TrendingSection from "@/components/TrendingSection"
import WhyChooseUs from "@/components/WhyChooseUs"
import Testimonials from "@/components/Testimonials"
import Newsletter from "@/components/Newsletter"
import Footer from "@/components/Footer"

async function getHomeData(userId?: number) {
  try {
    const [dbProducts, dbCategories, wishlistIds] = await Promise.all([
      prisma.product.findMany({
        where: { isApproved: true, isActive: true, stock: { gt: 0 } },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true, name: true, shortDescription: true,
          price: true, discountPrice: true, stock: true, image: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          category: { select: { name: true } },
          seller: { select: { id: true, name: true } },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { products: { where: { isApproved: true, isActive: true } } } } },
      }),
      userId
        ? prisma.wishlist
            .findMany({ where: { userId }, select: { productId: true } })
            .then((ws) => ws.map((w) => w.productId))
        : Promise.resolve([] as number[]),
    ])

    const products = dbProducts.map(({ images, ...p }) => ({
      ...p,
      image: images[0]?.url ?? p.image,
    }))

    return { products, categories: dbCategories, wishlistIds }
  } catch (error) {
    console.error('[Home] Failed to load database content:', error)
    return { products: [], categories: [], wishlistIds: [] }
  }
}

export default async function Home() {
  const session = await getOptionalSession()
  const { products, categories, wishlistIds } = await getHomeData(session?.userId)

  return (
    <>
      <NavbarWrapper />
      <main>
        <Hero />
        <DealsBanner />
        <FeaturedProducts products={products} wishlistIds={wishlistIds} />
        <Categories categories={categories} />
        <TrendingSection products={products.slice(0, 4)} wishlistIds={wishlistIds} />
        <WhyChooseUs />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
    </>
  )
}
