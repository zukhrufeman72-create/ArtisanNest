import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/dal'

export async function GET(req: NextRequest) {
  await requireAdmin()
  const { searchParams } = req.nextUrl
  const days = Number(searchParams.get('days') ?? 30)
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [
    totalRevenue,
    totalOrders,
    totalUsers,
    totalProducts,
    newUsers,
    newOrders,
    topProducts,
    topCategories,
    revenueByDay,
    ordersByStatus,
    visitorCount,
    topPages,
  ] = await Promise.all([
    prisma.order.aggregate({ where: { status: 'DELIVERED' }, _sum: { totalPrice: true } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: from } } }),
    prisma.order.count({ where: { createdAt: { gte: from } } }),
    prisma.product.findMany({
      orderBy: { purchaseCount: 'desc' },
      take: 5,
      select: { id: true, name: true, purchaseCount: true, price: true, image: true },
    }),
    prisma.product.groupBy({
      by: ['categoryId'],
      _count: { id: true },
      _sum: { purchaseCount: true },
      orderBy: { _sum: { purchaseCount: 'desc' } },
      take: 5,
    }),
    prisma.$queryRaw<{ date: string; revenue: number; orders: number }[]>`
      SELECT
        DATE(createdAt) as date,
        SUM(totalPrice) as revenue,
        COUNT(*) as orders
      FROM \`Order\`
      WHERE createdAt >= ${from}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `,
    prisma.order.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.visitorLog.count({ where: { createdAt: { gte: from } } }),
    prisma.visitorLog.groupBy({
      by: ['path'],
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 10,
      where: { createdAt: { gte: from } },
    }),
  ])

  // Enrich category names
  const categoryIds = topCategories.map((c) => c.categoryId).filter(Boolean) as number[]
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  })
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  return NextResponse.json({
    summary: {
      totalRevenue: totalRevenue._sum.totalPrice ?? 0,
      totalOrders,
      totalUsers,
      totalProducts,
      newUsers,
      newOrders,
      visitorCount,
    },
    topProducts,
    topCategories: topCategories.map((c) => ({
      categoryId: c.categoryId,
      name: categoryMap[c.categoryId!] ?? 'Unknown',
      productCount: c._count.id,
      totalPurchases: c._sum.purchaseCount ?? 0,
    })),
    revenueByDay: revenueByDay.map((d) => ({
      date: d.date,
      revenue: Number(d.revenue),
      orders: Number(d.orders),
    })),
    ordersByStatus: ordersByStatus.reduce((acc, s) => {
      acc[s.status] = s._count.id
      return acc
    }, {} as Record<string, number>),
    topPages: topPages.map((p) => ({ path: p.path, views: p._count.path })),
  })
}
