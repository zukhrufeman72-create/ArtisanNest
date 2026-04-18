'use client'

import { useState } from 'react'
import { Heart, ShoppingCart, Star, Package, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export type PublicProduct = {
  id: number
  name: string
  shortDescription: string
  price: number
  discountPrice: number | null
  stock: number
  image: string
  category: { name: string }
  seller: { name: string }
  _count: { reviews: number }
}

type Props = {
  product: PublicProduct
  isWishlisted?: boolean
  compact?: boolean
}

export default function PublicProductCard({ product, isWishlisted = false, compact = false }: Props) {
  const [wishlisted, setWishlisted] = useState(isWishlisted)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const [cartAdded, setCartAdded] = useState(false)
  const [loginPrompt, setLoginPrompt] = useState(false)

  const hasSale = product.discountPrice && product.discountPrice < product.price
  const displayPrice = hasSale ? product.discountPrice! : product.price

  async function handleAddToCart() {
    if (cartLoading || cartAdded) return
    setCartLoading(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      })
      const data = await res.json()
      if (res.status === 401) {
        setLoginPrompt(true)
        return
      }
      if (data.success) {
        setCartAdded(true)
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: data.cartCount } }))
        setTimeout(() => setCartAdded(false), 2500)
      }
    } catch {
      // silent fail
    } finally {
      setCartLoading(false)
    }
  }

  async function handleWishlist() {
    if (wishlistLoading) return
    setWishlistLoading(true)
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      })
      if (res.status === 401) { setLoginPrompt(true); return }
      const data = await res.json()
      if ('added' in data) setWishlisted(data.added)
    } catch {
      // silent fail
    } finally {
      setWishlistLoading(false)
    }
  }

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#E8D5C4]/60 hover:border-[#C8896A]/30 hover:-translate-y-1 flex flex-col">

      {/* Login prompt */}
      {loginPrompt && (
        <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-[#C8896A]/10 flex items-center justify-center mb-3">
            <ShoppingCart size={20} className="text-[#C8896A]" />
          </div>
          <p className="text-sm font-semibold text-[#2D1F1A] mb-1">Sign in required</p>
          <p className="text-xs text-[#9E8079] text-center mb-4">Please sign in to add items to your cart or wishlist.</p>
          <Link href="/auth/login"
            className="px-5 py-2 bg-[#C8896A] text-white text-xs font-semibold rounded-xl hover:bg-[#A8694A] transition-colors">
            Sign In
          </Link>
          <button onClick={() => setLoginPrompt(false)}
            className="mt-2 text-xs text-[#9E8079] hover:text-[#2D1F1A] transition-colors">
            Dismiss
          </button>
        </div>
      )}

      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-[#F5F2EF] shrink-0">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={36} className="text-[#C4AEA4]" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {hasSale && (
            <span className="bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Sale</span>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Few Left</span>
          )}
          {product.stock === 0 && (
            <span className="bg-[#9E8079] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Sold Out</span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          disabled={wishlistLoading}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
            wishlisted
              ? 'bg-rose-500 text-white'
              : 'bg-white/80 backdrop-blur-sm text-[#9E8079] hover:bg-rose-50 hover:text-rose-500 opacity-0 group-hover:opacity-100'
          }`}
          title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {wishlistLoading
            ? <Loader2 size={13} className="animate-spin" />
            : <Heart size={13} fill={wishlisted ? 'currentColor' : 'none'} />
          }
        </button>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="text-xs text-[#9E8079] font-medium mb-0.5">{product.category.name}</div>
        <h3 className="font-semibold text-[#2D1F1A] text-sm leading-snug mb-1 group-hover:text-[#C8896A] transition-colors line-clamp-2 flex-1">
          {product.name}
        </h3>

        {/* Seller */}
        <p className="text-[11px] text-[#C4AEA4] mb-2">by {product.seller.name}</p>

        {/* Reviews */}
        {product._count.reviews > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={9} className="text-amber-400 fill-amber-400" />
            ))}
            <span className="text-[10px] text-[#9E8079]">({product._count.reviews})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-bold text-[#2D1F1A] text-base">${displayPrice.toFixed(2)}</span>
          {hasSale && (
            <span className="text-xs text-[#9E8079] line-through">${product.price.toFixed(2)}</span>
          )}
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          disabled={cartLoading || product.stock === 0}
          className={`w-full py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
            cartAdded
              ? 'bg-[#7D9B76] text-white'
              : product.stock === 0
              ? 'bg-[#F5F2EF] text-[#C4AEA4] cursor-not-allowed'
              : 'bg-[#F5EFE6] text-[#C8896A] hover:bg-[#C8896A] hover:text-white group-hover:bg-[#C8896A] group-hover:text-white'
          }`}
        >
          {cartLoading ? (
            <><Loader2 size={13} className="animate-spin" /> Adding…</>
          ) : cartAdded ? (
            <><CheckCircle size={13} /> Added to Cart!</>
          ) : product.stock === 0 ? (
            'Out of Stock'
          ) : (
            <><ShoppingCart size={13} /> Add to Cart</>
          )}
        </button>
      </div>
    </div>
  )
}
