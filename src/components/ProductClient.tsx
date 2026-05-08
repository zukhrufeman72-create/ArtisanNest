'use client'

import { useState } from 'react'
import { ShoppingBag, Heart, ChevronLeft, ChevronRight, Star, Shield, Truck, RefreshCw, ChevronDown, ChevronUp, Loader2, CheckCircle } from 'lucide-react'
import { formatPrice } from '@/lib/currency'

type Variant = {
  id: number
  color: string | null
  size: string | null
  material: string | null
  design: string | null
  price: number
  stockQuantity: number
  status: string
  imageUrl: string | null
}

interface Props {
  images: string[]
  name: string
  price: number
  discountPrice: number | null
  stock: number
  shortDescription: string
  material: string | null
  origin: string | null
  variants: Variant[]
  activeDealLabel: string | null
  activeDealDiscount: string | null
  avgRating: number
  totalReviews: number
  productId: number
}

export default function ProductClient({
  images, name, price, discountPrice, stock,
  shortDescription, material, origin, variants,
  activeDealLabel, activeDealDiscount,
  avgRating, totalReviews, productId,
}: Props) {
  const [activeImg, setActiveImg] = useState(0)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [wishlisted, setWishlisted] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(true)
  const [cartLoading, setCartLoading] = useState(false)
  const [cartAdded, setCartAdded] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [loginPrompt, setLoginPrompt] = useState(false)

  const safeImages = images.length > 0 ? images : ['/placeholder-product.jpg']

  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[]
  const sizes  = [...new Set(variants.map((v) => v.size).filter(Boolean))]  as string[]

  // Find matching variant to show its price/stock if selected
  const matchedVariant = variants.find((v) => {
    if (selectedColor && v.color !== selectedColor) return false
    if (selectedSize  && v.size  !== selectedSize)  return false
    return true
  })

  const displayPrice = matchedVariant ? matchedVariant.price : (discountPrice ?? price)
  const displayStock = matchedVariant ? matchedVariant.stockQuantity : stock
  const hasDiscount  = (!!discountPrice && !matchedVariant) || !!activeDealLabel

  const canAddToCart = displayStock > 0

  async function handleAddToCart() {
    if (cartLoading || cartAdded || !canAddToCart) return
    setCartLoading(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: qty, variantId: matchedVariant?.id }),
      })
      const data = await res.json()
      if (res.status === 401) { setLoginPrompt(true); return }
      if (data.success) {
        setCartAdded(true)
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: data.cartCount } }))
        setTimeout(() => setCartAdded(false), 2500)
      }
    } catch { /* silent */ }
    finally { setCartLoading(false) }
  }

  async function handleWishlist() {
    if (wishlistLoading) return
    setWishlistLoading(true)
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      if (res.status === 401) { setLoginPrompt(true); return }
      const data = await res.json()
      if ('added' in data) setWishlisted(data.added)
    } catch { /* silent */ }
    finally { setWishlistLoading(false) }
  }

  function prev() { setActiveImg((i) => (i === 0 ? safeImages.length - 1 : i - 1)) }
  function next() { setActiveImg((i) => (i === safeImages.length - 1 ? 0 : i + 1)) }

  return (
    <div className="grid lg:grid-cols-2 gap-8 xl:gap-12 relative">
      {/* Login prompt overlay */}
      {loginPrompt && (
        <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-[#C8896A]/10 flex items-center justify-center mb-3">
            <ShoppingBag size={20} className="text-[#C8896A]" />
          </div>
          <p className="text-sm font-semibold text-[#2D1F1A] mb-1">Sign in required</p>
          <p className="text-xs text-[#9E8079] text-center mb-4">Please sign in to add items to your cart or wishlist.</p>
          <button
            onClick={() => { setLoginPrompt(false); window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'login' } })) }}
            className="px-5 py-2 bg-[#C8896A] text-white text-xs font-semibold rounded-xl hover:bg-[#A8694A] transition-colors"
          >
            Sign In
          </button>
          <button onClick={() => setLoginPrompt(false)} className="mt-2 text-xs text-[#9E8079] hover:text-[#2D1F1A] transition-colors">
            Dismiss
          </button>
        </div>
      )}

      {/* ── Left: gallery ── */}
      <div className="flex gap-3">
        {/* Vertical thumbnail strip */}
        {safeImages.length > 1 && (
          <div className="flex flex-col gap-2 w-16 shrink-0">
            {safeImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                  activeImg === i ? 'border-[#C8896A] shadow-md' : 'border-[#EAE3DC] hover:border-[#C8896A]/60'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Main image */}
        <div className="relative flex-1 aspect-square bg-[#F5F2EF] rounded-2xl overflow-hidden group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={safeImages[activeImg]}
            alt={name}
            className="w-full h-full object-cover transition-all duration-300"
          />

          {/* Nav arrows */}
          {safeImages.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* Discount badge */}
          {activeDealLabel && (
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-rose-500 text-white text-xs font-bold rounded-full">
              {activeDealDiscount} · Limited time
            </div>
          )}
        </div>
      </div>

      {/* ── Right: product info ── */}
      <div className="space-y-5">
        {/* Price */}
        <div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-bold text-[#2D1F1A]">{formatPrice(displayPrice)}</span>
            {hasDiscount && price !== displayPrice && (
              <span className="text-lg text-[#9E8079] line-through">{formatPrice(price)}</span>
            )}
            {activeDealLabel && (
              <span className="text-sm font-bold text-rose-500">{activeDealDiscount} off</span>
            )}
          </div>
          {activeDealLabel && (
            <p className="text-xs text-rose-500 font-medium mt-0.5">{activeDealLabel} · Limited time sale</p>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A] leading-tight">{name}</h1>

        {/* Rating */}
        {totalReviews > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} size={14}
                  className={s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-[#EAE3DC] fill-[#EAE3DC]'}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-[#2D1F1A]">{avgRating.toFixed(1)}</span>
            <span className="text-sm text-[#9E8079]">({totalReviews} review{totalReviews !== 1 ? 's' : ''})</span>
          </div>
        )}

        {/* Colour picker */}
        {colors.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-[#2D1F1A] mb-2">
              Primary colour
              {selectedColor && <span className="ml-2 font-normal text-[#9E8079]">{selectedColor}</span>}
            </label>
            <div className="relative">
              <select
                value={selectedColor ?? ''}
                onChange={(e) => setSelectedColor(e.target.value || null)}
                className="w-full appearance-none border border-[#C4AEA4] rounded-xl px-4 py-3 text-sm text-[#2D1F1A] bg-white focus:outline-none focus:border-[#C8896A] cursor-pointer pr-10"
              >
                <option value="">Select a colour</option>
                {colors.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E8079] pointer-events-none" />
            </div>
          </div>
        )}

        {/* Size picker */}
        {sizes.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-[#2D1F1A] mb-2">
              Size
              {selectedSize && <span className="ml-2 font-normal text-[#9E8079]">{selectedSize}</span>}
            </label>
            <div className="flex gap-2 flex-wrap">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(selectedSize === s ? null : s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                    selectedSize === s
                      ? 'border-[#2D1F1A] bg-[#2D1F1A] text-white'
                      : 'border-[#EAE3DC] text-[#6B4C3B] hover:border-[#C8896A]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Qty */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#2D1F1A]">Qty:</span>
          <div className="flex items-center border border-[#EAE3DC] rounded-xl overflow-hidden">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-10 h-10 flex items-center justify-center text-lg text-[#6B4C3B] hover:bg-[#F5F0EB] transition-colors"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-semibold text-[#2D1F1A]">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(displayStock, q + 1))}
              className="w-10 h-10 flex items-center justify-center text-lg text-[#6B4C3B] hover:bg-[#F5F0EB] transition-colors"
            >
              +
            </button>
          </div>
          {displayStock < 5 && displayStock > 0 && (
            <span className="text-xs text-amber-600 font-semibold">Only {displayStock} left!</span>
          )}
          {displayStock === 0 && (
            <span className="text-xs text-rose-500 font-semibold">Out of stock</span>
          )}
        </div>

        {/* CTA buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart || cartLoading}
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold text-sm rounded-2xl transition-all hover:shadow-lg disabled:cursor-not-allowed ${
              cartAdded
                ? 'bg-[#7D9B76] text-white'
                : 'bg-[#2D1F1A] hover:bg-[#3D2F2A] text-white disabled:opacity-40'
            }`}
          >
            {cartLoading ? (
              <><Loader2 size={17} className="animate-spin" /> Adding…</>
            ) : cartAdded ? (
              <><CheckCircle size={17} /> Added to Basket!</>
            ) : (
              <><ShoppingBag size={17} /> Add to Basket</>
            )}
          </button>
          <button
            onClick={handleWishlist}
            disabled={wishlistLoading}
            className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${
              wishlisted
                ? 'border-rose-400 bg-rose-50 text-rose-500'
                : 'border-[#EAE3DC] text-[#9E8079] hover:border-rose-400 hover:text-rose-400 hover:bg-rose-50'
            }`}
          >
            {wishlistLoading
              ? <Loader2 size={18} className="animate-spin" />
              : <Heart size={20} fill={wishlisted ? 'currentColor' : 'none'} />
            }
          </button>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: <Truck size={14} />, text: 'Free shipping over PKR 2,000' },
            { icon: <RefreshCw size={14} />, text: '7-day easy returns' },
            { icon: <Shield size={14} />, text: 'Secure payment' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex flex-col items-center gap-1.5 bg-[#F5F0EB] rounded-xl p-3 text-center">
              <div className="text-[#7D9B76]">{icon}</div>
              <p className="text-[10px] text-[#9E8079] leading-snug">{text}</p>
            </div>
          ))}
        </div>

        {/* Item details accordion */}
        <div className="border border-[#EAE3DC] rounded-2xl overflow-hidden">
          <button
            onClick={() => setDetailsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-[#F5F0EB] transition-colors"
          >
            <span className="font-semibold text-[#2D1F1A] text-sm">Item details</span>
            {detailsOpen ? <ChevronUp size={16} className="text-[#9E8079]" /> : <ChevronDown size={16} className="text-[#9E8079]" />}
          </button>
          {detailsOpen && (
            <div className="px-5 pb-5 pt-3 bg-white border-t border-[#EAE3DC] space-y-2 text-sm text-[#6B4C3B]">
              <p className="leading-relaxed">{shortDescription}</p>
              {material && (
                <p className="flex items-center gap-2">
                  <span className="font-semibold text-[#2D1F1A]">Materials:</span> {material}
                </p>
              )}
              {origin && (
                <p className="flex items-center gap-2">
                  <span className="font-semibold text-[#2D1F1A]">Origin:</span> {origin}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
