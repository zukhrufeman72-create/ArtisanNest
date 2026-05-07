import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import StockManager from './StockManager'

export default async function InventoryPage() {
  const session = await verifySession()

  const products = await prisma.product.findMany({
    where: { sellerId: session.userId },
    orderBy: [{ stock: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      stock: true,
      price: true,
      isActive: true,
      isApproved: true,
      category: { select: { name: true } },
    },
  })

  return <StockManager products={products} />
}
