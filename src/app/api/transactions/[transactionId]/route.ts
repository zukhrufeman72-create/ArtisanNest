import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

// ── GET /api/transactions/:transactionId ──────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> },
) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { transactionId } = await params
  const id = Number(transactionId)
  if (!id) return NextResponse.json({ error: 'Invalid transaction ID.' }, { status: 400 })

  const transaction = await prisma.paymentTransaction.findUnique({
    where: { id },
    include: {
      customer: { select: { name: true, email: true } },
      order: {
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          shippingAddress: true,
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  image: true,
                  seller: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 })
  }

  // Role-based access: customer can only see their own, seller sees related orders, admin sees all
  if (session.role === 'CUSTOMER' && transaction.customerId !== session.userId) {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
  }

  if (session.role === 'SELLER') {
    const hasProduct = transaction.order.items.some(
      (item) => (item.product as { seller?: { name: string }; sellerId?: number } & typeof item.product)
    )
    // Verify seller has a product in this order
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        orderId: transaction.orderId,
        product: { sellerId: session.userId },
      },
    })
    if (!orderItem) return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
    void hasProduct
  }

  return NextResponse.json({ transaction })
}
