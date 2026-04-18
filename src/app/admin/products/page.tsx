import { prisma } from '@/lib/prisma'
import { approveProduct, rejectProduct } from '@/app/actions/admin'
import { Package, CheckCircle, XCircle, Search, Pencil } from 'lucide-react'
import Link from 'next/link'
import AdminDeleteProduct from '@/components/admin/AdminDeleteProduct'

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; approved?: string; category?: string }>
}) {
  const { q, approved, category } = await searchParams

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        ...(approved === 'true' ? { isApproved: true } : approved === 'false' ? { isApproved: false } : {}),
        ...(q ? { name: { contains: q } } : {}),
        ...(category ? { categoryId: parseInt(category) } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        shortDescription: true,
        price: true,
        discountPrice: true,
        stock: true,
        image: true,
        isApproved: true,
        isActive: true,
        createdAt: true,
        seller: { select: { name: true, email: true } },
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  const pendingCount = products.filter((p) => !p.isApproved).length

  function filterHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const merged = { q, approved, category, ...overrides }
    if (merged.q) params.set('q', merged.q)
    if (merged.approved) params.set('approved', merged.approved)
    if (merged.category) params.set('category', merged.category)
    const s = params.toString()
    return `/admin/products${s ? `?${s}` : ''}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">All Products</h1>
          <p className="text-sm text-[#9E8079] mt-0.5">
            {products.length} product{products.length !== 1 ? 's' : ''}
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-600 font-semibold">· {pendingCount} pending approval</span>
            )}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] px-5 py-4 flex flex-wrap gap-4 items-end">
        {/* Search */}
        <form method="GET" action="/admin/products" className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079]" />
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search products…"
            className="pl-8 pr-3 py-2 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/25 focus:border-[#C8896A] transition-all w-52"
          />
          {approved && <input type="hidden" name="approved" value={approved} />}
          {category && <input type="hidden" name="category" value={category} />}
        </form>

        {/* Status filter */}
        <div>
          <p className="text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">Status</p>
          <div className="flex gap-2">
            {[
              { label: 'All', value: '' },
              { label: '✅ Approved', value: 'true' },
              { label: '⏳ Pending', value: 'false' },
            ].map((f) => (
              <a
                key={f.value}
                href={filterHref({ approved: f.value || undefined })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  (approved ?? '') === f.value
                    ? 'bg-[#C8896A] text-white'
                    : 'bg-[#F5F2EF] text-[#6B4C3B] hover:bg-[#EAE3DC]'
                }`}
              >
                {f.label}
              </a>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div>
          <p className="text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">Category</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={filterHref({ category: undefined })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !category ? 'bg-[#C8896A] text-white' : 'bg-[#F5F2EF] text-[#6B4C3B] hover:bg-[#EAE3DC]'
              }`}
            >
              All
            </a>
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={filterHref({ category: String(cat.id) })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  category === String(cat.id)
                    ? 'bg-[#C8896A] text-white'
                    : 'bg-[#F5F2EF] text-[#6B4C3B] hover:bg-[#EAE3DC]'
                }`}
              >
                {cat.name}
              </a>
            ))}
          </div>
        </div>

        {(q || approved || category) && (
          <a
            href="/admin/products"
            className="text-xs text-rose-500 hover:text-rose-600 px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors self-end"
          >
            Clear filters ×
          </a>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F2EF] text-left">
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Product</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Seller</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Category</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Price</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Stock</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Added</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EFE6]">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#F5F2EF] flex items-center justify-center">
                        <Package size={20} className="text-[#C4AEA4]" />
                      </div>
                      <p className="text-sm text-[#9E8079]">No products found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-[#FDF8F4] transition-colors group">
                    {/* Product */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#F5F2EF] shrink-0 border border-[#EAE3DC]">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={14} className="text-[#C4AEA4]" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#2D1F1A] max-w-37.5 truncate">{product.name}</p>
                          <p className="text-[10px] text-[#C4AEA4] truncate max-w-37.5">{product.shortDescription}</p>
                        </div>
                      </div>
                    </td>
                    {/* Seller */}
                    <td className="px-5 py-3.5">
                      <p className="text-[#2D1F1A] font-medium text-xs">{product.seller.name}</p>
                      <p className="text-[10px] text-[#9E8079]">{product.seller.email}</p>
                    </td>
                    {/* Category */}
                    <td className="px-5 py-3.5 text-[#9E8079] text-xs">{product.category.name}</td>
                    {/* Price */}
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#2D1F1A]">${product.price.toFixed(2)}</p>
                      {product.discountPrice && (
                        <p className="text-[10px] text-[#7D9B76]">${product.discountPrice.toFixed(2)}</p>
                      )}
                    </td>
                    {/* Stock */}
                    <td className="px-5 py-3.5">
                      <span className={`font-semibold text-sm ${product.stock === 0 ? 'text-rose-500' : product.stock < 5 ? 'text-amber-500' : 'text-[#2D1F1A]'}`}>
                        {product.stock}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      {product.isApproved ? (
                        <span className="inline-flex items-center gap-1 text-[#7D9B76] text-xs font-semibold bg-[#7D9B76]/8 px-2 py-0.5 rounded-full">
                          <CheckCircle size={11} /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
                          <XCircle size={11} /> Pending
                        </span>
                      )}
                    </td>
                    {/* Added */}
                    <td className="px-5 py-3.5 text-[#9E8079] text-xs">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Approve / Reject for pending */}
                        {!product.isApproved && (
                          <>
                            <form action={approveProduct}>
                              <input type="hidden" name="productId" value={product.id} />
                              <button
                                type="submit"
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#7D9B76] text-white text-xs font-semibold rounded-lg hover:bg-[#6a8663] transition-colors"
                              >
                                <CheckCircle size={11} /> Approve
                              </button>
                            </form>
                            <form action={rejectProduct}>
                              <input type="hidden" name="productId" value={product.id} />
                              <button
                                type="submit"
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg hover:bg-rose-100 transition-colors border border-rose-100"
                              >
                                <XCircle size={11} /> Reject
                              </button>
                            </form>
                          </>
                        )}
                        {/* Edit — always visible */}
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="p-1.5 text-[#9E8079] hover:text-[#C8896A] hover:bg-[#C8896A]/10 rounded-lg transition-colors"
                          title="Edit product"
                        >
                          <Pencil size={14} />
                        </Link>
                        {/* Delete — always visible */}
                        <AdminDeleteProduct productId={product.id} productName={product.name} />
                      </div>
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
