import { requireCustomer } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import NavbarWrapper from '@/components/NavbarWrapper'
import Footer from '@/components/Footer'
import CheckoutForm from './CheckoutForm'

export const metadata = {
  title: 'Checkout — ArtisanNest',
}

export default async function CheckoutPage() {
  // Server-side guard: only authenticated CUSTOMER role may view checkout
  const session = await requireCustomer()

  const cart = await prisma.cart.findUnique({
    where: { userId: session.userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              discountPrice: true,
              image: true,
              stock: true,
              isApproved: true,
              isActive: true,
              seller: { select: { name: true } },
              category: { select: { name: true } },
            },
          },
        },
        orderBy: { id: 'asc' },
      },
    },
  })

  if (!cart || cart.items.length === 0) redirect('/cart')

  // Filter out unavailable products before rendering
  const availableItems = cart.items.filter(
    (item) => item.product.isApproved && item.product.isActive,
  )
  if (availableItems.length === 0) redirect('/cart')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true },
  })

  return (
    <>
      <NavbarWrapper />
      <main className="min-h-screen bg-[#F5F2EF]">
        <CheckoutForm cartItems={availableItems} user={user!} />
      </main>
      <Footer />
    </>
  )
}
