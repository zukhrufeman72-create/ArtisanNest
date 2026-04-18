import { prisma } from '@/lib/prisma'
import { Users, Package, ShoppingBag, TrendingUp, UserCheck, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { RevenueChart, OrdersChart } from '@/components/admin/OverviewChart'

export default async function AdminDashboard() {
  const [userCount, sellerCount, customerCount, productCount, orderCount, revenueData, recentUsers, recentOrders] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'SELLER' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalPrice: true } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, totalPrice: true, status: true, createdAt: true,
          user: { select: { name: true } },
        },
      }),
    ])

  const revenue = revenueData._sum.totalPrice ?? 0

  const stats = [
    {
      label: 'Total Users',
      value: userCount,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      href: '/admin/users',
      change: '+12%',
    },
    {
      label: 'Active Sellers',
      value: sellerCount,
      icon: UserCheck,
      color: 'bg-[#C8896A]/10 text-[#C8896A]',
      href: '/admin/users/sellers',
      change: '+5%',
    },
    {
      label: 'Total Orders',
      value: orderCount,
      icon: ShoppingBag,
      color: 'bg-[#7D9B76]/10 text-[#7D9B76]',
      href: '/admin/orders',
      change: '+18%',
    },
    {
      label: 'Total Revenue',
      value: `$${revenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-600',
      href: '/admin/reports',
      change: '+22%',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Dashboard</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">Welcome back — here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white rounded-2xl border border-[#EAE3DC] p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                <Icon size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-[#2D1F1A] leading-tight">{stat.value}</p>
                <p className="text-sm text-[#9E8079]">{stat.label}</p>
                <p className="text-xs text-[#7D9B76] font-medium mt-0.5">{stat.change} this month</p>
              </div>
              <ArrowUpRight size={16} className="ml-auto text-[#C4AEA4] group-hover:text-[#C8896A] transition-colors shrink-0" />
            </Link>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Revenue chart — wider */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#EAE3DC] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-[#2D1F1A]">Revenue Overview</h2>
              <p className="text-xs text-[#9E8079] mt-0.5">Last 7 months</p>
            </div>
            <span className="text-xs font-medium text-[#7D9B76] bg-[#7D9B76]/10 px-2.5 py-1 rounded-full">
              +22% vs last year
            </span>
          </div>
          <RevenueChart />
        </div>

        {/* Orders chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE3DC] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-[#2D1F1A]">Orders</h2>
              <p className="text-xs text-[#9E8079] mt-0.5">Monthly volume</p>
            </div>
          </div>
          <OrdersChart />
        </div>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent users */}
        <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center justify-between">
            <h2 className="font-semibold text-[#2D1F1A]">Recent Users</h2>
            <Link href="/admin/users" className="text-xs text-[#C8896A] hover:underline font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-[#F5EFE6]">
            {recentUsers.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-[#9E8079]">No users yet</p>
            ) : (
              recentUsers.map((user) => (
                <div key={user.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-[#FDF8F4] transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#C8896A]/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#C8896A]">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2D1F1A] truncate">{user.name}</p>
                    <p className="text-xs text-[#9E8079] truncate">{user.email}</p>
                  </div>
                  <RoleBadge role={user.role} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center justify-between">
            <h2 className="font-semibold text-[#2D1F1A]">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-[#C8896A] hover:underline font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-[#F5EFE6]">
            {recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-[#9E8079]">No orders yet</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-[#FDF8F4] transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#7D9B76]/10 flex items-center justify-center shrink-0">
                    <ShoppingBag size={14} className="text-[#7D9B76]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2D1F1A] truncate">{order.user.name}</p>
                    <p className="text-xs text-[#9E8079]">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#2D1F1A]">${order.totalPrice.toFixed(2)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
        <h2 className="font-semibold text-[#2D1F1A] mb-4">Marketplace Snapshot</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: 'Customers', value: customerCount, color: 'text-blue-600' },
            { label: 'Sellers', value: sellerCount, color: 'text-[#C8896A]' },
            { label: 'Products', value: productCount, color: 'text-purple-600' },
            { label: 'Orders', value: orderCount, color: 'text-[#7D9B76]' },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-xl bg-[#F5F2EF]">
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-sm text-[#9E8079] mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    SELLER: 'bg-[#C8896A]/10 text-[#C8896A]',
    CUSTOMER: 'bg-[#7D9B76]/10 text-[#7D9B76]',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${map[role] ?? 'bg-gray-100 text-gray-600'}`}>
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'text-amber-600',
    PAID: 'text-blue-600',
    SHIPPED: 'text-purple-600',
    DELIVERED: 'text-[#7D9B76]',
    CANCELLED: 'text-rose-500',
  }
  return (
    <span className={`text-[10px] font-semibold ${map[status] ?? 'text-gray-500'}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}
