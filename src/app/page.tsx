import { prisma } from '@/lib/prisma'
import { getOptionalSession } from '@/lib/dal'
import NavbarWrapper from "@/components/NavbarWrapper"
import Hero from "@/components/Hero"
import FeaturedProducts from "@/components/FeaturedProducts"
import Categories from "@/components/Categories"
import TrendingSection from "@/components/TrendingSection"
import WhyChooseUs from "@/components/WhyChooseUs"
import Testimonials from "@/components/Testimonials"
import Newsletter from "@/components/Newsletter"
import Footer from "@/components/Footer"

export default async function Home() {
  const session = await getOptionalSession()

  const [dbProducts, dbCategories, wishlistIds] = await Promise.all([
    prisma.product.findMany({
      where: { isApproved: true, isActive: true, stock: { gt: 0 } },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true, name: true, shortDescription: true,
        price: true, discountPrice: true, stock: true, image: true,
        category: { select: { name: true } },
        seller: { select: { id: true, name: true } },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: { where: { isApproved: true, isActive: true } } } } },
    }),
    session?.userId
      ? prisma.wishlist
          .findMany({ where: { userId: session.userId }, select: { productId: true } })
          .then((ws) => ws.map((w) => w.productId))
      : Promise.resolve([] as number[]),
  ])

  return (
    <>
      <NavbarWrapper />
      <main>
        <Hero />
        <FeaturedProducts products={dbProducts} wishlistIds={wishlistIds} />
        <Categories categories={dbCategories} />
        <TrendingSection products={dbProducts.slice(0, 4)} wishlistIds={wishlistIds} />
        <WhyChooseUs />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
    </>
  )
}
