import { getOptionalSession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import CartView from '@/components/CartView'
import Link from 'next/link'
import { ShoppingCart, LogIn } from 'lucide-react'
import NavbarWrapper from '@/components/NavbarWrapper'
import Footer from '@/components/Footer'

export default async function CartPage() {
  const session = await getOptionalSession()

  if (!session?.userId) {
    return (
      <>
        <NavbarWrapper />
        <main className="min-h-screen bg-[#F5F2EF] flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-10 text-center max-w-sm shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#C8896A]/10 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={28} className="text-[#C8896A]" />
            </div>
            <h1 className="text-xl font-serif font-bold text-[#2D1F1A] mb-2">Sign in to view cart</h1>
            <p className="text-sm text-[#9E8079] mb-6">Your cart is saved to your account.</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#A8694A] transition-colors"
            >
              <LogIn size={15} /> Sign In
            </Link>
            <p className="mt-3 text-xs text-[#9E8079]">
              No account?{' '}
              <Link href="/auth/register" className="text-[#C8896A] hover:underline">Register free</Link>
            </p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true, name: true, price: true, discountPrice: true,
              image: true, stock: true,
              seller: { select: { name: true } },
              category: { select: { name: true } },
            },
          },
        },
        orderBy: { id: 'asc' },
      },
    },
  })

  const items = cart?.items ?? []
  const total = items.reduce((s, i) => s + (i.product.discountPrice ?? i.product.price) * i.quantity, 0)

  return (
    <>
      <NavbarWrapper />
      <main className="min-h-screen bg-[#F5F2EF]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-[#2D1F1A]">Shopping Cart</h1>
            <p className="text-sm text-[#9E8079] mt-1">
              {items.length === 0 ? 'Your cart is empty' : `${items.reduce((s, i) => s + i.quantity, 0)} items`}
            </p>
          </div>

          <CartView initialItems={items} initialTotal={total} />
        </div>
      </main>
      <Footer />
    </>
  )
}
