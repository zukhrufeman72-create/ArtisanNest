import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import AdminShell from '@/components/admin/AdminShell'

export const metadata = {
  title: 'Admin Dashboard — ArtisanNest',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession()

  const admin = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true },
  })

  return (
    <AdminShell adminName={admin?.name ?? 'Admin'} adminEmail={admin?.email ?? ''}>
      {children}
    </AdminShell>
  )
}
