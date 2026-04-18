import { prisma } from '@/lib/prisma'
import { approveProduct, rejectProduct } from '@/app/actions/admin'
import { Package, CheckCircle, XCircle } from 'lucide-react'

export default async function ApprovalsPage() {
  const pending = await prisma.product.findMany({
    where: { isApproved: false },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      shortDescription: true,
      price: true,
      stock: true,
      createdAt: true,
      seller: { select: { name: true, email: true } },
      category: { select: { name: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Product Approvals</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">
          {pending.length} product{pending.length !== 1 ? 's' : ''} awaiting approval
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-12 text-center">
          <CheckCircle size={40} className="text-[#7D9B76] mx-auto mb-3" />
          <p className="font-semibold text-[#2D1F1A]">All caught up!</p>
          <p className="text-sm text-[#9E8079] mt-1">No products pending approval.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-[#EAE3DC] p-5 flex flex-col sm:flex-row gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <Package size={22} className="text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#2D1F1A]">{product.name}</p>
                    <p className="text-xs text-[#9E8079] mt-0.5">{product.shortDescription}</p>
                  </div>
                  <span className="text-xs bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full font-semibold shrink-0">
                    Pending Review
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#9E8079]">
                  <span>Seller: <strong className="text-[#2D1F1A]">{product.seller.name}</strong></span>
                  <span>Category: <strong className="text-[#2D1F1A]">{product.category.name}</strong></span>
                  <span>Price: <strong className="text-[#2D1F1A]">${product.price.toFixed(2)}</strong></span>
                  <span>Stock: <strong className="text-[#2D1F1A]">{product.stock}</strong></span>
                  <span>Submitted: <strong className="text-[#2D1F1A]">{new Date(product.createdAt).toLocaleDateString()}</strong></span>
                </div>
                <div className="mt-4 flex gap-2">
                  <form action={approveProduct}>
                    <input type="hidden" name="productId" value={product.id} />
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#7D9B76] text-white text-xs font-semibold rounded-xl hover:bg-[#6a8663] transition-colors"
                    >
                      <CheckCircle size={13} /> Approve
                    </button>
                  </form>
                  <form action={rejectProduct}>
                    <input type="hidden" name="productId" value={product.id} />
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-600 text-xs font-semibold rounded-xl hover:bg-rose-100 transition-colors"
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
