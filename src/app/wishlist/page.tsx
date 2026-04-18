import { redirect } from 'next/navigation'
import { getOptionalSession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import NavbarWrapper from '@/components/NavbarWrapper'
import Footer from '@/components/Footer'
import WishlistView from './WishlistView'
import Link from 'next/link'
import { Heart } from 'lucide-react'

export default async function WishlistPage() {
  const session = await getOptionalSession()

  if (!session?.userId) {
    redirect('/auth/login')
  }

  const wishlistItems = await prisma.wishlist.findMany({
    where: { userId: session.userId },
    orderBy: { id: 'desc' },
    select: {
      id: true,
      productId: true,
      product: {
        select: {
          id: true,
          name: true,
          shortDescription: true,
          price: true,
          discountPrice: true,
          image: true,
          stock: true,
          isApproved: true,
          isActive: true,
          seller: { select: { id: true, name: true } },
          category: { select: { name: true } },
          _count: { select: { reviews: true } },
        },
      },
    },
  })

  return (
    <>
      <NavbarWrapper />
      <main className="min-h-screen bg-[#FAF7F4]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <Heart size={20} className="text-rose-500 fill-rose-500" />
                </div>
                <h1 className="text-3xl font-serif font-bold text-[#2D1F1A]">My Wishlist</h1>
              </div>
              <p className="text-sm text-[#9E8079] ml-13">
                {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} saved
              </p>
            </div>
            {wishlistItems.length > 0 && (
              <Link
                href="/#products"
                className="text-sm text-[#C8896A] hover:text-[#A8694A] font-medium transition-colors"
              >
                Continue Shopping →
              </Link>
            )}
          </div>

          {wishlistItems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#EAE3DC] p-16 text-center max-w-md mx-auto">
              <div className="w-20 h-20 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-5">
                <Heart size={36} className="text-rose-300" />
              </div>
              <h2 className="text-xl font-serif font-bold text-[#2D1F1A] mb-2">Your wishlist is empty</h2>
              <p className="text-sm text-[#9E8079] mb-6 leading-relaxed">
                Save items you love by clicking the heart icon on any product.
              </p>
              <Link
                href="/#products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#C8896A] text-white text-sm font-semibold rounded-full hover:bg-[#A8694A] transition-all hover:shadow-md hover:-translate-y-px"
              >
                Discover Products
              </Link>
            </div>
          ) : (
            <WishlistView initialItems={wishlistItems} />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
