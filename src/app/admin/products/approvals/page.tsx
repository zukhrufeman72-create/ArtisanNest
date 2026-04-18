import { prisma } from '@/lib/prisma'
import { approveProduct, rejectProduct } from '@/app/actions/admin'
import { Package, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatPrice } from '@/lib/currency'

export default async function ApprovalsPage() {
  const pending = await prisma.product.findMany({
    where: { isApproved: false },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      shortDescription: true,
      price: true,
      discountPrice: true,
      stock: true,
      image: true,
      material: true,
      origin: true,
      createdAt: true,
      seller: { select: { name: true, email: true } },
      category: { select: { name: true } },
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Product Approvals</h1>
          <p className="text-sm text-[#9E8079] mt-0.5">
            {pending.length} product{pending.length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>
        {pending.length > 0 && (
          <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Clock size={12} /> {pending.length} Pending
          </span>
        )}
      </div>

      {/* Empty state */}
      {pending.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#7D9B76]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-[#7D9B76]" />
          </div>
          <p className="font-semibold text-[#2D1F1A]">All caught up!</p>
          <p className="text-sm text-[#9E8079] mt-1">No products pending approval.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Product image */}
                <div className="sm:w-48 h-40 sm:h-auto bg-[#F5F2EF] shrink-0 relative overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={32} className="text-[#C4AEA4]" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="flex items-center gap-1 bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      <Clock size={9} /> Pending
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-5 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <h2 className="font-semibold text-[#2D1F1A] text-base">{product.name}</h2>
                      <p className="text-sm text-[#9E8079] mt-0.5 leading-relaxed max-w-lg">{product.shortDescription}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-[#2D1F1A]">{formatPrice(product.price)}</p>
                      {product.discountPrice && (
                        <p className="text-xs text-[#7D9B76] font-semibold">Sale: {formatPrice(product.discountPrice)}</p>
                      )}
                    </div>
                  </div>

                  {/* Meta chips */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    <MetaChip label="Seller" value={product.seller.name} />
                    <MetaChip label="Email" value={product.seller.email} />
                    <MetaChip label="Category" value={product.category.name} />
                    <MetaChip label="Stock" value={`${product.stock} units`} />
                    {product.material && <MetaChip label="Material" value={product.material} />}
                    {product.origin && <MetaChip label="Origin" value={product.origin} />}
                    <MetaChip label="Submitted" value={new Date(product.createdAt).toLocaleDateString()} />
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 pt-3 border-t border-[#F5EFE6]">
                    <form action={approveProduct}>
                      <input type="hidden" name="productId" value={product.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-all hover:shadow-md hover:-translate-y-px"
                      >
                        <CheckCircle size={15} /> Approve & Publish
                      </button>
                    </form>
                    <form action={rejectProduct}>
                      <input type="hidden" name="productId" value={product.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 text-sm font-semibold rounded-xl hover:bg-rose-100 transition-all border border-rose-200"
                      >
                        <XCircle size={15} /> Reject
                      </button>
                    </form>
                    <p className="text-xs text-[#C4AEA4] ml-2">
                      Approving will make it visible in the marketplace immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#F5F2EF] rounded-lg px-3 py-1.5 text-xs">
      <span className="text-[#9E8079] font-medium">{label}: </span>
      <span className="text-[#2D1F1A] font-semibold">{value}</span>
    </div>
  )
}
