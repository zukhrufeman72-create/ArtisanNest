import { prisma } from '@/lib/prisma'
import { ShoppingBag } from 'lucide-react'

export default async function CustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      orders: { select: { id: true, totalPrice: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Customers</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">{customers.length} registered customers</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE3DC]">
          <h2 className="font-semibold text-[#2D1F1A]">All Customers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F2EF] text-left">
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">#</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Customer</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Email</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Orders</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Total Spent</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EFE6]">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#9E8079]">
                    No customers yet
                  </td>
                </tr>
              ) : (
                customers.map((customer, i) => {
                  const totalSpent = customer.orders.reduce((sum, o) => sum + o.totalPrice, 0)
                  return (
                    <tr key={customer.id} className="hover:bg-[#FDF8F4] transition-colors">
                      <td className="px-5 py-3.5 text-[#C4AEA4] text-xs">{i + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#7D9B76]/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-[#7D9B76]">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-[#2D1F1A]">{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[#9E8079]">{customer.email}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-[#2D1F1A] font-medium">
                          <ShoppingBag size={13} className="text-[#7D9B76]" />
                          {customer.orders.length}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-[#2D1F1A]">
                        ${totalSpent.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-[#9E8079] text-xs">
                        {new Date(customer.createdAt).toLocaleDateString()}
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
