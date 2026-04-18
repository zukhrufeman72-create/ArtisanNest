import { prisma } from '@/lib/prisma'
import { Package, CheckCircle, XCircle } from 'lucide-react'

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; approved?: string }>
}) {
  const { q, approved } = await searchParams

  const products = await prisma.product.findMany({
    where: {
      ...(approved === 'true' ? { isApproved: true } : approved === 'false' ? { isApproved: false } : {}),
      ...(q ? { name: { contains: q } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      isApproved: true,
      isActive: true,
      createdAt: true,
      seller: { select: { name: true } },
      category: { select: { name: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">All Products</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">{products.length} products</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        {/* Filters */}
        <div className="px-5 py-4 border-b border-[#EAE3DC] flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            {[
              { label: 'All', value: '' },
              { label: 'Approved', value: 'true' },
              { label: 'Pending', value: 'false' },
            ].map((f) => (
              <a
                key={f.value}
                href={f.value ? `?approved=${f.value}` : '?'}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  approved === f.value || (!approved && f.value === '')
                    ? 'bg-[#C8896A] text-white'
                    : 'bg-[#F5F2EF] text-[#6B4C3B] hover:bg-[#EAE3DC]'
                }`}
              >
                {f.label}
              </a>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F2EF] text-left">
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">#</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Product</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Seller</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Category</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Price</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Stock</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EFE6]">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-[#9E8079]">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product, i) => (
                  <tr key={product.id} className="hover:bg-[#FDF8F4] transition-colors">
                    <td className="px-5 py-3.5 text-[#C4AEA4] text-xs">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                          <Package size={14} className="text-purple-500" />
                        </div>
                        <span className="font-medium text-[#2D1F1A] max-w-[160px] truncate">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#9E8079]">{product.seller.name}</td>
                    <td className="px-5 py-3.5 text-[#9E8079]">{product.category.name}</td>
                    <td className="px-5 py-3.5 font-semibold text-[#2D1F1A]">${product.price.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-[#2D1F1A]">{product.stock}</td>
                    <td className="px-5 py-3.5">
                      {product.isApproved ? (
                        <span className="flex items-center gap-1 text-[#7D9B76] text-xs font-semibold">
                          <CheckCircle size={13} /> Approved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                          <XCircle size={13} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[#9E8079] text-xs">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
