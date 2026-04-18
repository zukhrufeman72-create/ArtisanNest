import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { deleteProduct } from '@/app/actions/seller'
import { Package, PlusCircle, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

export default async function MyProductsPage() {
  const session = await verifySession()

  const products = await prisma.product.findMany({
    where: { sellerId: session.userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      price: true,
      discountPrice: true,
      stock: true,
      isApproved: true,
      isActive: true,
      createdAt: true,
      category: { select: { name: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">My Products</h1>
          <p className="text-sm text-[#9E8079] mt-0.5">{products.length} listing{products.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/seller/products/add"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-colors"
        >
          <PlusCircle size={16} />
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        {products.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#C8896A]/10 flex items-center justify-center mx-auto mb-4">
              <Package size={24} className="text-[#C8896A]" />
            </div>
            <p className="font-semibold text-[#2D1F1A]">No products yet</p>
            <p className="text-sm text-[#9E8079] mt-1 mb-4">Start listing your handmade crafts</p>
            <Link
              href="/seller/products/add"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-colors"
            >
              <PlusCircle size={15} /> Add your first product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F2EF] text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Product</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Category</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Price</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Stock</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5EFE6]">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-[#FDF8F4] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#C8896A]/10 flex items-center justify-center shrink-0">
                          <Package size={14} className="text-[#C8896A]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#2D1F1A] truncate max-w-[160px]">{product.name}</p>
                          <p className="text-[10px] text-[#9E8079]">{new Date(product.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#9E8079]">{product.category.name}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#2D1F1A]">${product.price.toFixed(2)}</p>
                      {product.discountPrice && (
                        <p className="text-xs text-[#7D9B76]">Sale: ${product.discountPrice.toFixed(2)}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`font-medium ${product.stock === 0 ? 'text-rose-500' : product.stock < 5 ? 'text-amber-500' : 'text-[#2D1F1A]'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {product.isApproved ? (
                        <span className="flex items-center gap-1 text-[#7D9B76] text-xs font-semibold">
                          <CheckCircle size={12} /> Approved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                          <XCircle size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/seller/products/${product.id}/edit`}
                          className="p-1.5 text-[#9E8079] hover:text-[#7D9B76] hover:bg-[#7D9B76]/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </Link>
                        <form action={deleteProduct}>
                          <input type="hidden" name="productId" value={product.id} />
                          <button
                            type="submit"
                            className="p-1.5 text-[#9E8079] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
