import { prisma } from '@/lib/prisma'
import { UserCheck, Package, Star } from 'lucide-react'

export default async function SellersPage() {
  const sellers = await prisma.user.findMany({
    where: { role: 'SELLER' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      isVerified: true,
      createdAt: true,
      products: { select: { id: true, isApproved: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Sellers</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">{sellers.length} registered sellers</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE3DC]">
          <h2 className="font-semibold text-[#2D1F1A]">All Sellers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F2EF] text-left">
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">#</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Seller</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Email</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Products</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Approved</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EFE6]">
              {sellers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#9E8079]">
                    No sellers yet
                  </td>
                </tr>
              ) : (
                sellers.map((seller, i) => {
                  const approvedCount = seller.products.filter((p) => p.isApproved).length
                  return (
                    <tr key={seller.id} className="hover:bg-[#FDF8F4] transition-colors">
                      <td className="px-5 py-3.5 text-[#C4AEA4] text-xs">{i + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#C8896A]/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-[#C8896A]">
                              {seller.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-[#2D1F1A]">{seller.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[#9E8079]">{seller.email}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-[#2D1F1A] font-medium">
                          <Package size={13} className="text-[#C8896A]" />
                          {seller.products.length}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[#9E8079]">{approvedCount}</td>
                      <td className="px-5 py-3.5 text-[#9E8079] text-xs">
                        {new Date(seller.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
