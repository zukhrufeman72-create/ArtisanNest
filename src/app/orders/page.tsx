import { getOptionalSession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import NavbarWrapper from '@/components/NavbarWrapper'
import Footer from '@/components/Footer'
import OrdersView from './OrdersView'

export default async function MyOrdersPage() {
  const session = await getOptionalSession()
  if (!session?.userId) redirect('/auth/login')

  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image: true,
              seller: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  return (
    <>
      <NavbarWrapper />
      <main className="min-h-screen bg-[#F5F2EF]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-[#2D1F1A]">My Orders</h1>
            <p className="text-sm text-[#9E8079] mt-1">
              {orders.length === 0
                ? 'You have no orders yet'
                : `${orders.length} order${orders.length !== 1 ? 's' : ''} placed`}
            </p>
          </div>
          <OrdersView orders={orders} />
        </div>
      </main>
      <Footer />
    </>
  )
}
