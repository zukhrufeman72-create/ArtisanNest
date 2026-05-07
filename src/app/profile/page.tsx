import { requireCustomer } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import NavbarWrapper from '@/components/NavbarWrapper'
import Footer from '@/components/Footer'
import ProfileView from './ProfileView'

export const metadata = {
  title: 'My Profile — ArtisanNest',
  description: 'Manage your name, email, and password.',
}

export default async function CustomerProfilePage() {
  // Requires authenticated CUSTOMER — redirects admin/seller to /
  const session = await requireCustomer()

  const [user, orderCount, wishlistCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true, createdAt: true },
    }),
    prisma.order.count({ where: { userId: session.userId } }),
    prisma.wishlist.count({ where: { userId: session.userId } }),
  ])

  return (
    <>
      <NavbarWrapper />
      <main className="min-h-screen bg-[#F5F2EF]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ProfileView
            name={user?.name ?? ''}
            email={user?.email ?? ''}
            createdAt={user?.createdAt?.toISOString() ?? ''}
            orderCount={orderCount}
            wishlistCount={wishlistCount}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
