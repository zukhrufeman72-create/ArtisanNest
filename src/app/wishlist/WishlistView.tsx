'use client'

import { useState } from 'react'
import { Heart, ShoppingCart, MessageCircle, Package, Trash2, Star } from 'lucide-react'
import { formatPrice } from '@/lib/currency'
import Link from 'next/link'

type WishlistProduct = {
  id: number
  name: string
  shortDescription: string
  price: number
  discountPrice: number | null
  image: string
  stock: number
  isApproved: boolean
  isActive: boolean
  seller: { id: number; name: string }
  category: { name: string }
  _count: { reviews: number }
}

type WishlistItem = {
  id: number
  productId: number
  product: WishlistProduct
}

type Props = { initialItems: WishlistItem[] }

export default function WishlistView({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [removing, setRemoving] = useState<number | null>(null)
  const [addingToCart, setAddingToCart] = useState<number | null>(null)
  const [cartAdded, setCartAdded] = useState<Set<number>>(new Set())

  async function removeFromWishlist(productId: number) {
    setRemoving(productId)
    try {
      await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      setItems((prev) => prev.filter((i) => i.productId !== productId))
    } catch { /* silent */ } finally {
      setRemoving(null)
    }
  }

  async function addToCart(productId: number) {
    setAddingToCart(productId)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      })
      if (res.ok) {
        const data = await res.json()
        setCartAdded((prev) => new Set([...prev, productId]))
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: data.cartCount } }))
        setTimeout(() => setCartAdded((prev) => { const n = new Set(prev); n.delete(productId); return n }), 2500)
      }
    } catch { /* silent */ } finally {
      setAddingToCart(null)
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {items.map((item) => {
        const p = item.product
        const displayPrice = p.discountPrice ?? p.price
        const hasSale = !!p.discountPrice
        const isRemoving = removing === p.id
        const isAddingCart = addingToCart === p.id
        const wasAdded = cartAdded.has(p.id)
        const unavailable = !p.isApproved || !p.isActive || p.stock === 0

        return (
          <div
            key={item.id}
            className={`bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isRemoving ? 'opacity-40 scale-95' : ''}`}
          >
            {/* Image */}
            <div className="relative h-52 bg-[#F5F2EF] overflow-hidden">
              {p.image ? (
                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={32} className="text-[#C4AEA4]" />
                </div>
              )}
              {hasSale && (
                <span className="absolute top-2 left-2 bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">SALE</span>
              )}
              {unavailable && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                  <span className="text-xs font-semibold text-[#9E8079] bg-white/90 px-3 py-1 rounded-full">
                    {p.stock === 0 ? 'Out of Stock' : 'Unavailable'}
                  </span>
                </div>
              )}
              {/* Remove heart */}
              <button
                onClick={() => removeFromWishlist(p.id)}
                disabled={isRemoving}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-all hover:scale-110 group/heart"
              >
                <Heart size={14} className="fill-rose-500 text-rose-500 group-hover/heart:fill-[#C4AEA4] group-hover/heart:text-[#C4AEA4] transition-colors" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-[10px] font-medium text-[#C8896A] uppercase tracking-wider mb-1">{p.category.name}</p>
              <h3 className="font-semibold text-[#2D1F1A] text-sm leading-snug line-clamp-2 mb-1">{p.name}</h3>
              <p className="text-[11px] text-[#9E8079] mb-2">by {p.seller.name}</p>

              {p._count.reviews > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map((i) => <Star key={i} size={9} className="text-amber-400 fill-amber-400" />)}
                  <span className="text-[10px] text-[#9E8079]">({p._count.reviews})</span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-[#2D1F1A]">{formatPrice(displayPrice)}</span>
                {hasSale && <span className="text-xs text-[#9E8079] line-through">{formatPrice(p.price)}</span>}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => addToCart(p.id)}
                  disabled={isAddingCart || unavailable}
                  className={`w-full py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    wasAdded
                      ? 'bg-[#7D9B76] text-white'
                      : unavailable
                      ? 'bg-[#F5F2EF] text-[#C4AEA4] cursor-not-allowed'
                      : 'bg-[#C8896A] hover:bg-[#A8694A] text-white hover:shadow-md'
                  }`}
                >
                  <ShoppingCart size={12} />
                  {wasAdded ? 'Added!' : unavailable ? 'Unavailable' : 'Add to Cart'}
                </button>
                <Link
                  href={`/chat/${p.seller.id}`}
                  className="w-full py-2 text-xs font-medium text-[#9E8079] hover:text-[#C8896A] border border-[#EAE3DC] hover:border-[#C8896A]/40 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <MessageCircle size={12} /> Chat with Seller
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
