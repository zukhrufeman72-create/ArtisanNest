'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteProduct } from '@/app/actions/seller'
import {
  LayoutGrid, List, PlusCircle, Search, SlidersHorizontal,
  Package, Pencil, Trash2, CheckCircle, XCircle, Tag,
  ChevronDown, X,
} from 'lucide-react'

type Product = {
  id: number; name: string; shortDescription: string; price: number
  discountPrice: number | null; stock: number; image: string
  isApproved: boolean; isActive: boolean; createdAt: string
  category: { id: number; name: string }
}
type Category = { id: number; name: string }
type Filters = { q?: string; status?: string; category?: string; minPrice?: string; maxPrice?: string; stock?: string }

export default function ProductsView({
  products, categories, currentFilters,
}: { products: Product[]; categories: Category[]; currentFilters: Filters }) {
  const router = useRouter()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [search, setSearch] = useState(currentFilters.q ?? '')
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice ?? '')
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice ?? '')
  const [isPending, startTransition] = useTransition()

  function applyFilters(overrides: Partial<Filters> = {}) {
    const params = new URLSearchParams()
    const merged = { ...currentFilters, ...overrides }
    if (merged.q) params.set('q', merged.q)
    if (merged.status) params.set('status', merged.status)
    if (merged.category) params.set('category', merged.category)
    if (merged.minPrice) params.set('minPrice', merged.minPrice)
    if (merged.maxPrice) params.set('maxPrice', merged.maxPrice)
    if (merged.stock) params.set('stock', merged.stock)
    startTransition(() => router.push(`/seller/products?${params.toString()}`))
  }

  const activeFilterCount = [
    currentFilters.q, currentFilters.status, currentFilters.category,
    currentFilters.minPrice || currentFilters.maxPrice ? 'price' : undefined,
    currentFilters.stock,
  ].filter(Boolean).length

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">My Products</h1>
          <p className="text-sm text-[#9E8079] mt-0.5">{products.length} listing{products.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/seller/products/add"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-all hover:shadow-md hover:-translate-y-px"
        >
          <PlusCircle size={16} /> Add Product
        </Link>
      </div>

      {/* Filter + view bar */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] px-4 py-3 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <form
          onSubmit={(e) => { e.preventDefault(); applyFilters({ q: search || undefined }) }}
          className="relative flex-1 min-w-[180px] max-w-xs"
        >
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#7D9B76]/25 focus:border-[#7D9B76] transition-all"
          />
        </form>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            showFilters || activeFilterCount > 0
              ? 'bg-[#7D9B76]/10 text-[#7D9B76] border border-[#7D9B76]/20'
              : 'bg-[#F5F2EF] text-[#6B4C3B] border border-[#EAE3DC] hover:bg-[#EAE3DC]'
          }`}
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#7D9B76] text-white text-[9px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown size={13} className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {/* Clear all filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={() => { setSearch(''); setMinPrice(''); setMaxPrice(''); startTransition(() => router.push('/seller/products')) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <X size={12} /> Clear
          </button>
        )}

        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-[#F5F2EF] rounded-xl p-1 border border-[#EAE3DC]">
          <button
            onClick={() => setView('grid')}
            className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-white text-[#7D9B76] shadow-sm' : 'text-[#9E8079] hover:text-[#2D1F1A]'}`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-lg transition-all ${view === 'list' ? 'bg-white text-[#7D9B76] shadow-sm' : 'text-[#9E8079] hover:text-[#2D1F1A]'}`}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] px-5 py-4 flex flex-wrap gap-4 items-end">
          {/* Status filter */}
          <div>
            <p className="text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-2">Status</p>
            <div className="flex gap-2">
              {[
                { label: 'All', value: '' },
                { label: '✅ Approved', value: 'approved' },
                { label: '⏳ Pending', value: 'pending' },
              ].map((opt) => (
                <button key={opt.value}
                  onClick={() => applyFilters({ status: opt.value || undefined })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    (currentFilters.status ?? '') === opt.value
                      ? 'bg-[#7D9B76] text-white'
                      : 'bg-[#F5F2EF] text-[#6B4C3B] hover:bg-[#EAE3DC]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <p className="text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyFilters({ category: undefined })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !currentFilters.category ? 'bg-[#7D9B76] text-white' : 'bg-[#F5F2EF] text-[#6B4C3B] hover:bg-[#EAE3DC]'
                }`}
              >All</button>
              {categories.map((cat) => (
                <button key={cat.id}
                  onClick={() => applyFilters({ category: String(cat.id) })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    currentFilters.category === String(cat.id)
                      ? 'bg-[#7D9B76] text-white'
                      : 'bg-[#F5F2EF] text-[#6B4C3B] hover:bg-[#EAE3DC]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div>
            <p className="text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-2">Price Range</p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9E8079] text-xs font-medium">$</span>
                <input
                  type="number" min="0" placeholder="Min" value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-24 pl-6 pr-2 py-1.5 text-xs bg-[#F5F2EF] border border-[#EAE3DC] rounded-lg text-[#2D1F1A] focus:outline-none focus:ring-1 focus:ring-[#7D9B76]/40 focus:border-[#7D9B76]"
                />
              </div>
              <span className="text-[#C4AEA4] text-xs">–</span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9E8079] text-xs font-medium">$</span>
                <input
                  type="number" min="0" placeholder="Max" value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-24 pl-6 pr-2 py-1.5 text-xs bg-[#F5F2EF] border border-[#EAE3DC] rounded-lg text-[#2D1F1A] focus:outline-none focus:ring-1 focus:ring-[#7D9B76]/40 focus:border-[#7D9B76]"
                />
              </div>
              <button
                onClick={() => applyFilters({ minPrice: minPrice || undefined, maxPrice: maxPrice || undefined })}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#7D9B76] text-white hover:bg-[#6a8663] transition-colors"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Stock availability */}
          <div>
            <p className="text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-2">Stock</p>
            <div className="flex gap-2">
              {[
                { label: 'Any', value: '' },
                { label: '✅ In Stock', value: 'instock' },
                { label: '❌ Out of Stock', value: 'outofstock' },
              ].map((opt) => (
                <button key={opt.value}
                  onClick={() => applyFilters({ stock: opt.value || undefined })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    (currentFilters.stock ?? '') === opt.value
                      ? 'bg-[#7D9B76] text-white'
                      : 'bg-[#F5F2EF] text-[#6B4C3B] hover:bg-[#EAE3DC]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-[1px] z-30 flex items-center justify-center">
          <div className="bg-white border border-[#EAE3DC] rounded-2xl px-5 py-3 shadow-xl flex items-center gap-3 text-sm font-medium text-[#2D1F1A]">
            <div className="w-4 h-4 border-2 border-[#EAE3DC] border-t-[#7D9B76] rounded-full animate-spin" />
            Filtering…
          </div>
        </div>
      )}

      {/* Empty state */}
      {products.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#C8896A]/10 flex items-center justify-center mx-auto mb-4">
            <Package size={24} className="text-[#C8896A]" />
          </div>
          <p className="font-semibold text-[#2D1F1A]">No products found</p>
          <p className="text-sm text-[#9E8079] mt-1 mb-4">
            {activeFilterCount > 0 ? 'Try adjusting your filters' : 'Start listing your handmade crafts'}
          </p>
          {activeFilterCount === 0 && (
            <Link href="/seller/products/add"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#7D9B76] text-white text-sm font-semibold rounded-xl hover:bg-[#6a8663] transition-colors">
              <PlusCircle size={15} /> Add your first product
            </Link>
          )}
        </div>
      )}

      {/* GRID VIEW */}
      {products.length > 0 && view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {products.length > 0 && view === 'list' && (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F2EF] text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Product</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Category</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Price</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Stock</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5EFE6]">
                {products.map((product) => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Card view ─────────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Image */}
      <div className="relative h-44 bg-[#F5F2EF] overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={32} className="text-[#C4AEA4]" />
          </div>
        )}
        {/* Approval badge */}
        <div className="absolute top-2.5 left-2.5">
          {product.isApproved ? (
            <span className="flex items-center gap-1 bg-[#7D9B76] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              <CheckCircle size={9} /> Approved
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              <XCircle size={9} /> Pending
            </span>
          )}
        </div>
        {/* Quick actions overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <Link href={`/seller/products/${product.id}/edit`}
            className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg hover:bg-[#F5F2EF] transition-colors">
            <Pencil size={14} className="text-[#6B4C3B]" />
          </Link>
          <DeleteButton productId={product.id} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-semibold text-[#2D1F1A] text-sm leading-tight truncate">{product.name}</p>
        </div>
        <p className="text-xs text-[#9E8079] flex items-center gap-1 mb-3">
          <Tag size={10} /> {product.category.name}
        </p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-base font-bold text-[#2D1F1A]">${product.price.toFixed(2)}</span>
            {product.discountPrice && (
              <span className="ml-1.5 text-xs text-[#7D9B76] font-semibold">${product.discountPrice.toFixed(2)}</span>
            )}
          </div>
          <span className={`text-xs font-semibold ${product.stock === 0 ? 'text-rose-500' : product.stock < 5 ? 'text-amber-500' : 'text-[#9E8079]'}`}>
            {product.stock} in stock
          </span>
        </div>
      </div>
    </div>
  )
}

// ── List row ──────────────────────────────────────────────────────────────────

function ProductRow({ product }: { product: Product }) {
  return (
    <tr className="hover:bg-[#FDF8F4] transition-colors">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F5F2EF] shrink-0">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={14} className="text-[#C4AEA4]" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-[#2D1F1A] truncate max-w-[160px]">{product.name}</p>
            <p className="text-[10px] text-[#9E8079]">{new Date(product.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-sm text-[#9E8079]">{product.category.name}</td>
      <td className="px-5 py-3.5">
        <p className="font-semibold text-[#2D1F1A] text-sm">${product.price.toFixed(2)}</p>
        {product.discountPrice && (
          <p className="text-xs text-[#7D9B76]">${product.discountPrice.toFixed(2)}</p>
        )}
      </td>
      <td className="px-5 py-3.5">
        <span className={`font-semibold text-sm ${product.stock === 0 ? 'text-rose-500' : product.stock < 5 ? 'text-amber-500' : 'text-[#2D1F1A]'}`}>
          {product.stock}
        </span>
      </td>
      <td className="px-5 py-3.5">
        {product.isApproved ? (
          <span className="flex items-center gap-1 text-[#7D9B76] text-xs font-semibold">
            <CheckCircle size={12} /> Approved
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
            <XCircle size={12} /> Pending
          </span>
        )}
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Link href={`/seller/products/${product.id}/edit`}
            className="p-1.5 text-[#9E8079] hover:text-[#7D9B76] hover:bg-[#7D9B76]/10 rounded-lg transition-colors">
            <Pencil size={14} />
          </Link>
          <DeleteButton productId={product.id} />
        </div>
      </td>
    </tr>
  )
}

function DeleteButton({ productId }: { productId: number }) {
  const [isPending, startTransition] = useTransition()
  return (
    <form onSubmit={(e) => { e.preventDefault(); startTransition(() => deleteProduct(new FormData(e.currentTarget))) }}>
      <input type="hidden" name="productId" value={productId} />
      <button type="submit" disabled={isPending}
        className="p-1.5 text-[#9E8079] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 w-9 h-9 flex items-center justify-center"
        title="Delete">
        {isPending ? <div className="w-3 h-3 border border-rose-300 border-t-rose-500 rounded-full animate-spin" /> : <Trash2 size={14} />}
      </button>
    </form>
  )
}
