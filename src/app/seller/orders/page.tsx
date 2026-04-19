import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import SellerOrdersView from './SellerOrdersView'

export default async function SellerOrdersPage() {
  const session = await verifySession()

  const orders = await prisma.order.findMany({
    where: { items: { some: { product: { sellerId: session.userId } } } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      totalPrice: true,
      subtotal: true,
      shippingFee: true,
      tax: true,
      discount: true,
      status: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      shippingMethod: true,
      shippingAddress: true,
      addressLabel: true,
      paymentMethod: true,
      paymentStatus: true,
      couponCode: true,
      orderNotes: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      items: {
        where: { product: { sellerId: session.userId } },
        select: {
          id: true,
          quantity: true,
          price: true,
          product: { select: { id: true, name: true, image: true } },
        },
      },
    },
  })

  const totalEarnings = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0),
    0,
  )

  return (
    <SellerOrdersView
      orders={orders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() }))}
      totalEarnings={totalEarnings}
    />
  )
}
