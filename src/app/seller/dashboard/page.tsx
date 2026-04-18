import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { Package, ShoppingBag, TrendingUp, Clock, ArrowUpRight, PlusCircle } from 'lucide-react'
import Link from 'next/link'

export default async function SellerDashboard() {
  const session = await verifySession()

  const [productCount, pendingCount, allOrderItems, recentProducts, recentOrders] = await Promise.all([
    prisma.product.count({ where: { sellerId: session.userId } }),
    prisma.order.count({
      where: {
        status: 'PENDING',
        items: { some: { product: { sellerId: session.userId } } },
      },
    }),
    prisma.orderItem.findMany({
      where: { product: { sellerId: session.userId } },
      select: { price: true, quantity: true },
    }),
    prisma.product.findMany({
      where: { sellerId: session.userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, price: true, stock: true, isApproved: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { items: { some: { product: { sellerId: session.userId } } } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        user: { select: { name: true } },
        items: { where: { product: { sellerId: session.userId } }, select: { quantity: true } },
      },
    }),
  ])

  const totalOrders = await prisma.order.count({
    where: { items: { some: { product: { sellerId: session.userId } } } },
  })
  const totalEarnings = allOrderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const stats = [
    {
      label: 'My Products',
      value: productCount,
      icon: Package,
      color: 'bg-[#C8896A]/10 text-[#C8896A]',
      href: '/seller/products',
      change: 'manage listings',
    },
    {
      label: 'Total Orders',
      value: totalOrders,
      icon: ShoppingBag,
      color: 'bg-[#7D9B76]/10 text-[#7D9B76]',
      href: '/seller/orders',
      change: 'view all',
    },
    {
      label: 'Total Earnings',
      value: `$${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      color: 'bg-blue-50 text-blue-600',
      href: '/seller/earnings',
      change: 'see report',
    },
    {
      label: 'Pending Orders',
      value: pendingCount,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
      href: '/seller/orders?status=PENDING',
      change: 'needs action',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Dashboard</h1>
          <p className="text-sm text-[#9E8079] mt-0.5">Track your products, orders, and earnings.</p>
        </div>
        <Link
          href="/seller/products/add"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-colors"
        >
          <PlusCircle size={16} />
          Add Product
        </Link>
      </div>

      {/* Stats */}
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
                <p className="text-xs text-[#7D9B76] font-medium mt-0.5">{stat.change}</p>
              </div>
              <ArrowUpRight size={16} className="ml-auto text-[#C4AEA4] group-hover:text-[#7D9B76] transition-colors shrink-0" />
            </Link>
          )
        })}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent products */}
        <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center justify-between">
            <h2 className="font-semibold text-[#2D1F1A]">Recent Products</h2>
            <Link href="/seller/products" className="text-xs text-[#7D9B76] hover:underline font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-[#F5EFE6]">
            {recentProducts.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-[#9E8079]">No products yet</p>
                <Link href="/seller/products/add" className="mt-2 inline-block text-xs text-[#7D9B76] font-semibold hover:underline">
                  + Add your first product
                </Link>
              </div>
            ) : (
              recentProducts.map((product) => (
                <div key={product.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-[#FDF8F4] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[#C8896A]/10 flex items-center justify-center shrink-0">
                    <Package size={14} className="text-[#C8896A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2D1F1A] truncate">{product.name}</p>
                    <p className="text-xs text-[#9E8079]">Stock: {product.stock}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#2D1F1A]">${product.price.toFixed(2)}</p>
                    <span className={`text-[10px] font-semibold ${product.isApproved ? 'text-[#7D9B76]' : 'text-amber-500'}`}>
                      {product.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center justify-between">
            <h2 className="font-semibold text-[#2D1F1A]">Recent Orders</h2>
            <Link href="/seller/orders" className="text-xs text-[#7D9B76] hover:underline font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-[#F5EFE6]">
            {recentOrders.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#9E8079]">No orders yet</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-[#FDF8F4] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[#7D9B76]/10 flex items-center justify-center shrink-0">
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

      {/* Quick actions */}
      <div className="bg-linear-to-r from-[#7D9B76]/10 to-[#C8896A]/10 rounded-2xl border border-[#EAE3DC] p-5">
        <h2 className="font-semibold text-[#2D1F1A] mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Add Product', href: '/seller/products/add', color: 'bg-[#7D9B76] text-white hover:bg-[#6a8663]' },
            { label: 'View Orders', href: '/seller/orders', color: 'bg-[#C8896A] text-white hover:bg-[#b3775a]' },
            { label: 'Update Inventory', href: '/seller/inventory', color: 'bg-white text-[#2D1F1A] border border-[#EAE3DC] hover:bg-[#F5F2EF]' },
            { label: 'See Earnings', href: '/seller/earnings', color: 'bg-white text-[#2D1F1A] border border-[#EAE3DC] hover:bg-[#F5F2EF]' },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${a.color}`}
            >
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
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
