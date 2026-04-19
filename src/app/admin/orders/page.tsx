import { prisma } from '@/lib/prisma'
import AdminOrdersView from './AdminOrdersView'

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
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
      stripePaymentId: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
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

  const totalRevenue = orders.reduce((s, o) => s + o.totalPrice, 0)

  return (
    <AdminOrdersView
      orders={orders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() }))}
      totalRevenue={totalRevenue}
    />
  )
}
