import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { updateSellerProfile } from '@/app/actions/seller'
import { User, Lock, Package, Star, ShoppingBag } from 'lucide-react'

export default async function SellerProfilePage() {
  const session = await verifySession()

  const [seller, productCount, reviewCount, orderCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true, createdAt: true },
    }),
    prisma.product.count({ where: { sellerId: session.userId } }),
    prisma.review.count({ where: { product: { sellerId: session.userId } } }),
    prisma.order.count({ where: { items: { some: { product: { sellerId: session.userId } } } } }),
  ])

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Profile</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">Manage your seller account</p>
      </div>

      {/* Avatar + stats */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-[#7D9B76] flex items-center justify-center text-white text-3xl font-bold shrink-0">
          {seller?.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xl font-bold text-[#2D1F1A]">{seller?.name}</p>
          <p className="text-sm text-[#9E8079]">{seller?.email}</p>
          <p className="text-xs text-[#C4AEA4] mt-1">Member since {seller ? new Date(seller.createdAt).toLocaleDateString() : '—'}</p>
        </div>
        <div className="flex gap-6 text-center">
          {[
            { label: 'Products', value: productCount, icon: Package },
            { label: 'Orders', value: orderCount, icon: ShoppingBag },
            { label: 'Reviews', value: reviewCount, icon: Star },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label}>
                <p className="text-2xl font-bold text-[#2D1F1A]">{s.value}</p>
                <p className="text-xs text-[#9E8079] flex items-center gap-1 justify-center">
                  <Icon size={11} /> {s.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center gap-2">
          <User size={16} className="text-[#7D9B76]" />
          <h2 className="font-semibold text-[#2D1F1A]">Profile Information</h2>
        </div>
        <form action={updateSellerProfile} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
              Full Name
            </label>
            <input
              name="name"
              defaultValue={seller?.name}
              required
              className="w-full px-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              defaultValue={seller?.email}
              required
              className="w-full px-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76] transition-all"
            />
          </div>
          <div className="pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center gap-2">
          <Lock size={16} className="text-[#7D9B76]" />
          <h2 className="font-semibold text-[#2D1F1A]">Change Password</h2>
        </div>
        <form action={updateSellerProfile} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
              Current Password
            </label>
            <input
              name="currentPassword"
              type="password"
              className="w-full px-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
              New Password
            </label>
            <input
              name="newPassword"
              type="password"
              className="w-full px-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76] transition-all"
            />
          </div>
          <div className="pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-colors"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
