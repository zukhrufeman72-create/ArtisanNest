'use client'

import { useState, useCallback } from 'react'
import { Star, ThumbsUp, ChevronDown, ChevronUp, MessageCircle, CheckCircle, Send } from 'lucide-react'

interface ReviewResponse {
  id: number
  response: string
  createdAt: string
  seller: { name: string }
}

interface Review {
  id: number
  rating: number
  comment: string | null
  images: string | null
  helpfulCount: number
  isVerified: boolean
  createdAt: string
  user: { id: number; name: string; avatar: string | null }
  response: ReviewResponse | null
  helpful: { userId: number }[]
}

interface ProductReviewsProps {
  productId: number
  initialReviews: Review[]
  total: number
  pages: number
  averageRating: number
  totalCount: number
  ratingBreakdown: Record<number, number>
  currentUserId?: number
  canReview: boolean
}

function StarRow({ rating, filled }: { rating: number; filled: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={13}
          className={s <= rating ? (filled ? 'text-amber-400 fill-amber-400' : 'text-amber-300 fill-amber-300') : 'text-[#EAE3DC] fill-[#EAE3DC]'}
        />
      ))}
    </div>
  )
}

function RatingBar({ count, total }: { count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex-1 h-1.5 bg-[#EAE3DC] rounded-full overflow-hidden">
      <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

function ReviewCard({ review, currentUserId, productId, onHelpful }: {
  review: Review
  currentUserId?: number
  productId: number
  onHelpful: (id: number, helpful: boolean) => void
}) {
  const [showReply, setShowReply] = useState(false)
  const isHelpful = currentUserId ? review.helpful.some((h) => h.userId === currentUserId) : false
  const images: string[] = review.images ? JSON.parse(review.images) : []

  const toggleHelpful = async () => {
    const res = await fetch(`/api/reviews/${review.id}/helpful`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json() as { helpful: boolean }
      onHelpful(review.id, data.helpful)
    }
  }

  const initials = review.user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="py-5 border-b border-[#F5EFE6] last:border-0">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C8896A] to-[#8B5E45] flex items-center justify-center text-white text-xs font-bold shrink-0">
          {review.user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={review.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#2D1F1A]">{review.user.name}</span>
            {review.isVerified && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-[#7D9B76] bg-[#7D9B76]/10 px-1.5 py-0.5 rounded-full">
                <CheckCircle size={9} /> Verified Purchase
              </span>
            )}
            <span className="text-[10px] text-[#9E8079] ml-auto">
              {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <StarRow rating={review.rating} filled />
          </div>

          {review.comment && (
            <p className="text-sm text-[#6B4C3B] mt-2 leading-relaxed">{review.comment}</p>
          )}

          {images.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={img} alt="" className="w-16 h-16 rounded-xl object-cover border border-[#EAE3DC]" />
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={toggleHelpful}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                isHelpful ? 'text-[#C8896A] font-semibold' : 'text-[#9E8079] hover:text-[#C8896A]'
              }`}
            >
              <ThumbsUp size={12} className={isHelpful ? 'fill-current' : ''} />
              Helpful {review.helpfulCount > 0 && `(${review.helpfulCount})`}
            </button>

            {review.response && (
              <button
                onClick={() => setShowReply((v) => !v)}
                className="flex items-center gap-1 text-xs text-[#9E8079] hover:text-[#2D1F1A] transition-colors"
              >
                <MessageCircle size={12} />
                Seller reply {showReply ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            )}
          </div>

          {review.response && showReply && (
            <div className="mt-3 bg-[#F5F0EB] rounded-xl p-3 border-l-2 border-[#C8896A]">
              <p className="text-[10px] font-bold text-[#C8896A] uppercase tracking-wide mb-1">
                {review.response.seller.name} · Seller
              </p>
              <p className="text-xs text-[#6B4C3B] leading-relaxed">{review.response.response}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewForm({ productId, onSubmit }: { productId: number; onSubmit: (review: Review) => void }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!rating) { setError('Please select a rating.'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to submit review.'); return }
      onSubmit(data.review as Review)
      setRating(0)
      setComment('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-[#FDF8F4] rounded-2xl border border-[#EAE3DC] p-5">
      <h4 className="font-semibold text-[#2D1F1A] mb-4 flex items-center gap-2">
        <Star size={15} className="text-amber-400" /> Write a Review
      </h4>

      {/* Star picker */}
      <div className="flex items-center gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(s)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={28}
              className={`transition-colors ${s <= (hovered || rating) ? 'text-amber-400 fill-amber-400' : 'text-[#EAE3DC] fill-[#EAE3DC]'}`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="text-sm font-medium text-[#9E8079] ml-2">
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
          </span>
        )}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience with this product..."
        rows={3}
        className="w-full px-4 py-3 text-sm bg-white border border-[#EAE3DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A] text-[#2D1F1A] placeholder:text-[#C4AEA4] resize-none"
      />

      {error && <p className="text-xs text-rose-500 mt-2">{error}</p>}

      <button
        onClick={submit}
        disabled={submitting || !rating}
        className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#A8694A] transition-colors disabled:opacity-60"
      >
        {submitting ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send size={14} />
        )}
        Submit Review
      </button>
    </div>
  )
}

export default function ProductReviews({
  productId,
  initialReviews,
  total,
  pages,
  averageRating,
  totalCount,
  ratingBreakdown,
  currentUserId,
  canReview,
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)

  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    const next = page + 1
    const res = await fetch(`/api/products/${productId}/reviews?page=${next}`)
    if (res.ok) {
      const data = await res.json() as { reviews: Review[] }
      setReviews((prev) => [...prev, ...data.reviews])
      setPage(next)
    }
    setLoadingMore(false)
  }, [page, productId])

  const handleHelpful = (id: number, helpful: boolean) => {
    setReviews((prev) => prev.map((r) => {
      if (r.id !== id) return r
      const newHelpful = helpful
        ? [...r.helpful, { userId: currentUserId! }]
        : r.helpful.filter((h) => h.userId !== currentUserId)
      return { ...r, helpful: newHelpful, helpfulCount: r.helpfulCount + (helpful ? 1 : -1) }
    }))
  }

  const handleNewReview = (review: Review) => {
    setReviews((prev) => [review, ...prev])
    setHasReviewed(true)
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
        <h3 className="font-serif font-bold text-lg text-[#2D1F1A] mb-4">Customer Reviews</h3>

        <div className="flex items-start gap-6 flex-wrap">
          <div className="text-center shrink-0">
            <div className="text-5xl font-serif font-bold text-[#2D1F1A]">{averageRating.toFixed(1)}</div>
            <StarRow rating={Math.round(averageRating)} filled />
            <p className="text-xs text-[#9E8079] mt-1">{totalCount} review{totalCount !== 1 ? 's' : ''}</p>
          </div>

          <div className="flex-1 min-w-40 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-[#9E8079] w-3">{star}</span>
                <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                <RatingBar count={ratingBreakdown[star] ?? 0} total={totalCount} />
                <span className="text-xs text-[#9E8079] w-5 text-right">{ratingBreakdown[star] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review form */}
      {canReview && !hasReviewed && (
        <ReviewForm productId={productId} onSubmit={handleNewReview} />
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] py-12 text-center text-[#9E8079]">
          <Star size={32} className="mx-auto opacity-20 mb-3" />
          <p className="text-sm">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] px-5">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              productId={productId}
              onHelpful={handleHelpful}
            />
          ))}

          {page < pages && (
            <div className="py-4 text-center border-t border-[#F5EFE6]">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 mx-auto px-5 py-2 text-sm text-[#C8896A] font-medium hover:text-[#A8694A] transition-colors disabled:opacity-60"
              >
                {loadingMore ? (
                  <div className="w-4 h-4 border-2 border-[#C8896A] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ChevronDown size={15} />
                )}
                Load more reviews
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
