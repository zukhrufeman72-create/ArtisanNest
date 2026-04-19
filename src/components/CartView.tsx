'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ShoppingCart, Trash2, Plus, Minus, Package,
  ArrowRight, ShoppingBag, Loader2, Tag,
} from 'lucide-react'
import { formatPrice } from '@/lib/currency'

type CartProduct = {
  id: number
  name: string
  price: number
  discountPrice: number | null
  image: string
  stock: number
  seller: { name: string }
  category: { name: string }
}

type CartItemType = {
  id: number
  quantity: number
  product: CartProduct
}

type Props = {
  initialItems: CartItemType[]
  initialTotal: number
}

function dispatchCartCount(items: CartItemType[]) {
  const count = items.reduce((s, i) => s + i.quantity, 0)
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count } }))
}

export default function CartView({ initialItems, initialTotal }: Props) {
  const [items, setItems] = useState<CartItemType[]>(initialItems)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [, startTransition] = useTransition()

  const subtotal = items.reduce((s, item) => {
    return s + (item.product.discountPrice ?? item.product.price) * item.quantity
  }, 0)
  const itemCount = items.reduce((s, item) => s + item.quantity, 0)
  const shipping = subtotal >= 2000 ? 0 : 250

  async function updateQuantity(itemId: number, newQty: number) {
    if (newQty < 1) { removeItem(itemId); return }
    setUpdatingId(itemId)
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
      })
      if (res.ok) {
        setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, quantity: newQty } : i))
        dispatchCartCount(items.map((i) => i.id === itemId ? { ...i, quantity: newQty } : i))
      }
    } catch { /* silent */ } finally {
      setUpdatingId(null)
    }
  }

  async function removeItem(itemId: number) {
    setRemovingId(itemId)
    try {
      const res = await fetch(`/api/cart/${itemId}`, { method: 'DELETE' })
      if (res.ok) {
        const next = items.filter((i) => i.id !== itemId)
        setItems(next)
        dispatchCartCount(next)
      }
    } catch { /* silent */ } finally {
      setRemovingId(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-[#F5EFE6] flex items-center justify-center mx-auto mb-5">
            <ShoppingCart size={36} className="text-[#C8896A]" />
          </div>
          <h2 className="text-xl font-serif font-bold text-[#2D1F1A] mb-2">Your cart is empty</h2>
          <p className="text-sm text-[#9E8079] mb-6 leading-relaxed">
            Looks like you haven&apos;t added anything yet. Discover beautiful handmade crafts!
          </p>
          <Link
            href="/#products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C8896A] text-white text-sm font-semibold rounded-full hover:bg-[#A8694A] transition-all hover:shadow-md hover:-translate-y-px"
          >
            <ShoppingBag size={16} /> Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* Items list */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[#2D1F1A]">{itemCount} item{itemCount !== 1 ? 's' : ''} in cart</h2>
          <Link href="/#products" className="text-sm text-[#C8896A] hover:text-[#A8694A] transition-colors flex items-center gap-1">
            Continue shopping →
          </Link>
        </div>

        {items.map((item) => {
          const price = item.product.discountPrice ?? item.product.price
          const itemTotal = price * item.quantity
          const isUpdating = updatingId === item.id
          const isRemoving = removingId === item.id

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border border-[#EAE3DC] p-4 flex gap-4 transition-all duration-200 ${isRemoving ? 'opacity-50 scale-95' : 'hover:shadow-md'}`}
            >
              {/* Image */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#F5F2EF] shrink-0">
                {item.product.image ? (
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={20} className="text-[#C4AEA4]" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#2D1F1A] text-sm leading-snug line-clamp-2">{item.product.name}</p>
                    <p className="text-xs text-[#9E8079] mt-0.5 flex items-center gap-1">
                      <Tag size={10} /> {item.product.category.name} · by {item.product.seller.name}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={isRemoving}
                    className="p-1.5 text-[#C4AEA4] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                  >
                    {isRemoving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                  {/* Quantity stepper */}
                  <div className={`flex items-center gap-1 bg-[#F5F2EF] rounded-xl p-1 ${isUpdating ? 'opacity-60' : ''}`}>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={isUpdating || item.quantity <= 1}
                      className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-[#6B4C3B] disabled:opacity-40 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-[#2D1F1A]">
                      {isUpdating ? <Loader2 size={12} className="animate-spin mx-auto" /> : item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={isUpdating || item.quantity >= item.product.stock}
                      className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-[#6B4C3B] disabled:opacity-40 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="font-bold text-[#2D1F1A]">{formatPrice(itemTotal)}</p>
                    {item.quantity > 1 && (
                      <p className="text-[10px] text-[#9E8079]">{formatPrice(price)} each</p>
                    )}
                    {item.product.discountPrice && (
                      <p className="text-[10px] text-rose-400 line-through">{formatPrice(item.product.price * item.quantity)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Order summary */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5 sticky top-24">
          <h2 className="font-semibold text-[#2D1F1A] mb-4">Order Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-[#6B4C3B]">
              <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#6B4C3B]">
              <span>Shipping</span>
              {shipping === 0
                ? <span className="text-[#7D9B76] font-semibold">Free</span>
                : <span className="font-medium">{formatPrice(shipping)}</span>
              }
            </div>
            {shipping > 0 && (
              <p className="text-[11px] text-[#9E8079] bg-[#F5F2EF] rounded-lg px-3 py-2">
                Add {formatPrice(2000 - subtotal)} more for free shipping
              </p>
            )}
          </div>

          <div className="border-t border-[#EAE3DC] mt-4 pt-4">
            <div className="flex justify-between font-bold text-[#2D1F1A] text-base">
              <span>Total</span>
              <span>{formatPrice(subtotal + shipping)}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="mt-5 w-full py-3.5 bg-[#C8896A] hover:bg-[#A8694A] text-white text-sm font-semibold rounded-xl transition-all hover:shadow-md hover:-translate-y-px flex items-center justify-center gap-2"
          >
            Proceed to Checkout <ArrowRight size={16} />
          </Link>

          <Link
            href="/#products"
            className="mt-3 w-full py-2.5 border border-[#EAE3DC] text-[#6B4C3B] text-sm font-semibold rounded-xl hover:bg-[#F5F2EF] transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag size={14} /> Continue Shopping
          </Link>

          {/* Trust badges */}
          <div className="mt-5 pt-4 border-t border-[#EAE3DC] space-y-2">
            {['🔒 Secure checkout', '🚚 Free shipping over Rs. 2,000', '↩️ Easy returns'].map((badge) => (
              <p key={badge} className="text-[11px] text-[#9E8079] flex items-center gap-2">{badge}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
