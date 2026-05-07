'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Sparkles } from 'lucide-react'

interface Product {
  id: number
  name: string
  price: number
  image: string | null
  avgRating: number
  reviewCount: number
  purchaseCount: number
  category: { id: number; name: string }
  seller: { id: number; name: string }
}

interface Props {
  productId?: number
  categoryId?: number
  title?: string
  limit?: number
}

export default function ProductRecommendations({
  productId,
  categoryId,
  title = 'You May Also Like',
  limit = 6,
}: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams({ limit: String(limit) })
    if (productId) params.set('productId', String(productId))
    if (categoryId) params.set('categoryId', String(categoryId))

    fetch(`/api/products/recommendations?${params}`)
      .then((r) => r.json())
      .then((d) => { setProducts(d.products ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [productId, categoryId, limit])

  if (!loading && products.length === 0) return null

  return (
    <section className="py-8">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles size={18} className="text-[#C8896A]" />
        <h2 className="text-xl font-serif font-bold text-[#2D1F1A]">{title}</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden animate-pulse">
              <div className="aspect-square bg-[#EAE3DC]" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-[#EAE3DC] rounded" />
                <div className="h-3 bg-[#EAE3DC] rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="aspect-square relative bg-[#F5F0EB] overflow-hidden">
                {p.image ? (
                  <Image
                    src={p.image ?? undefined}
                    alt={p.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#EAE3DC]">
                    <Sparkles size={24} />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h4 className="font-medium text-[#2D1F1A] text-xs leading-tight line-clamp-2 mb-1">{p.name}</h4>
                <div className="flex items-center gap-0.5 mb-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={9}
                      className={i < Math.round(p.avgRating) ? 'text-amber-400 fill-amber-400' : 'text-[#EAE3DC]'}
                    />
                  ))}
                  <span className="text-xs text-[#9E8079] ml-0.5">({p.reviewCount})</span>
                </div>
                <p className="font-bold text-[#C8896A] text-sm">PKR {p.price.toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
