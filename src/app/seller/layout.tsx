import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SellerShell from '@/components/seller/SellerShell'

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession()
  if (session.role !== 'SELLER') redirect('/')

  const seller = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true },
  })

  return (
    <SellerShell sellerName={seller?.name ?? 'Seller'} sellerEmail={seller?.email ?? ''}>
      {children}
    </SellerShell>
  )
}
