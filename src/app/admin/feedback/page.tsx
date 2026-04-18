import { prisma } from '@/lib/prisma'
import { Star } from 'lucide-react'

export default async function FeedbackPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { name: true } },
      product: { select: { name: true } },
    },
  })

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '—'

  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
    stars: r,
    count: reviews.filter((rv) => rv.rating === r).length,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Customer Feedback</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">{reviews.length} reviews across all products</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5 flex items-center gap-5">
          <div className="text-center shrink-0">
            <p className="text-5xl font-bold text-[#2D1F1A]">{avgRating}</p>
            <div className="flex gap-0.5 mt-2 justify-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  className={Number(avgRating) >= s ? 'text-amber-400 fill-amber-400' : 'text-[#EAE3DC]'}
                />
              ))}
            </div>
            <p className="text-xs text-[#9E8079] mt-1">avg. rating</p>
          </div>
          <div className="flex-1 space-y-2">
            {ratingDist.map((r) => (
              <div key={r.stars} className="flex items-center gap-2 text-xs">
                <span className="text-[#9E8079] w-4">{r.stars}</span>
                <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                <div className="flex-1 h-1.5 bg-[#F5F2EF] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: reviews.length ? `${(r.count / reviews.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-[#9E8079] w-4 text-right">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5 flex flex-col justify-center gap-3">
          {[5, 4, 3].map((threshold) => {
            const count = reviews.filter((r) => r.rating >= threshold).length
            const label = threshold === 5 ? 'Perfect (5★)' : threshold === 4 ? 'Good (4★+)' : 'Average (3★+)'
            const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0
            return (
              <div key={threshold} className="flex items-center justify-between">
                <span className="text-sm text-[#2D1F1A]">{label}</span>
                <span className="text-sm font-bold text-[#C8896A]">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Review list */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE3DC]">
          <h2 className="font-semibold text-[#2D1F1A]">All Reviews</h2>
        </div>
        {reviews.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-[#9E8079]">No reviews yet</p>
        ) : (
          <ul className="divide-y divide-[#F5EFE6]">
            {reviews.map((review) => (
              <li key={review.id} className="px-5 py-4 hover:bg-[#FDF8F4] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#C8896A]/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#C8896A]">
                        {review.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-[#2D1F1A] text-sm">{review.user.name}</p>
                      <p className="text-xs text-[#9E8079]">on {review.product.name}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex gap-0.5 justify-end">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          className={review.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-[#EAE3DC]'}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-[#9E8079] mt-0.5">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-[#6B4C3B] ml-11">{review.comment}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
