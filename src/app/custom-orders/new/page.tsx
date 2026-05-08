import { requireCustomer } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import CustomOrderForm from './CustomOrderForm'

export const metadata = { title: 'Request Custom Order — ArtisanNest' }

export default async function NewCustomOrderPage() {
  await requireCustomer()

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <CustomOrderForm categories={categories} />
    </div>
  )
}
