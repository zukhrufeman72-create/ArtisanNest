import { requireAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import AdminShell from '@/components/admin/AdminShell'

export const metadata = {
  title: 'Admin Dashboard — ArtisanNest',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Enforces ADMIN role — non-admins are redirected to /
  const session = await requireAdmin()

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
