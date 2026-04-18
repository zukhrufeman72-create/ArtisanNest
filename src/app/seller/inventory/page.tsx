import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { updateStock } from '@/app/actions/seller'
import { Warehouse, AlertTriangle, CheckCircle } from 'lucide-react'

export default async function InventoryPage() {
  const session = await verifySession()

  const products = await prisma.product.findMany({
    where: { sellerId: session.userId },
    orderBy: { stock: 'asc' },
    select: {
      id: true,
      name: true,
      stock: true,
      price: true,
      isActive: true,
      isApproved: true,
      category: { select: { name: true } },
    },
  })

  const outOfStock = products.filter((p) => p.stock === 0).length
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 5).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Inventory</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">Manage your product stock levels</p>
      </div>

      {/* Alerts */}
      {(outOfStock > 0 || lowStock > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {outOfStock > 0 && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
              <AlertTriangle size={18} className="text-rose-500 shrink-0" />
              <p className="text-sm text-rose-700">
                <strong>{outOfStock}</strong> product{outOfStock !== 1 ? 's' : ''} out of stock
              </p>
            </div>
          )}
          {lowStock > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <AlertTriangle size={18} className="text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700">
                <strong>{lowStock}</strong> product{lowStock !== 1 ? 's' : ''} running low (under 5)
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center gap-2">
          <Warehouse size={16} className="text-[#C8896A]" />
          <h2 className="font-semibold text-[#2D1F1A]">Stock Levels</h2>
        </div>

        {products.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-[#9E8079]">No products yet</p>
        ) : (
          <div className="divide-y divide-[#F5EFE6]">
            {products.map((product) => (
              <div key={product.id} className="px-5 py-4 flex items-center gap-4 hover:bg-[#FDF8F4] transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  product.stock === 0 ? 'bg-rose-50' : product.stock < 5 ? 'bg-amber-50' : 'bg-[#7D9B76]/10'
                }`}>
                  {product.stock === 0 ? (
                    <AlertTriangle size={16} className="text-rose-500" />
                  ) : product.stock < 5 ? (
                    <AlertTriangle size={16} className="text-amber-500" />
                  ) : (
                    <CheckCircle size={16} className="text-[#7D9B76]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#2D1F1A] truncate">{product.name}</p>
                  <p className="text-xs text-[#9E8079]">{product.category.name} · ${product.price.toFixed(2)}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-10 text-right ${
                    product.stock === 0 ? 'text-rose-500' : product.stock < 5 ? 'text-amber-500' : 'text-[#2D1F1A]'
                  }`}>
                    {product.stock}
                  </span>
                  <form action={updateStock} className="flex items-center gap-2">
                    <input type="hidden" name="productId" value={product.id} />
                    <input
                      name="stock"
                      type="number"
                      min="0"
                      defaultValue={product.stock}
                      className="w-20 px-2.5 py-1.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-lg text-[#2D1F1A] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/30 focus:border-[#7D9B76] text-center"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-[#7D9B76] text-white text-xs font-semibold rounded-lg hover:bg-[#6a8663] transition-colors"
                    >
                      Update
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
