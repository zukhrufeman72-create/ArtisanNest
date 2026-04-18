import { getOptionalSession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import CartView from '@/components/CartView'
import CartLoginGate from './CartLoginGate'
import NavbarWrapper from '@/components/NavbarWrapper'
import Footer from '@/components/Footer'

export default async function CartPage() {
  const session = await getOptionalSession()

  if (!session?.userId) {
    return (
      <>
        <NavbarWrapper />
        <main className="min-h-screen bg-[#F5F2EF] flex items-center justify-center px-4">
          <CartLoginGate />
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
