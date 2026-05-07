'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Mic, MicOff, SlidersHorizontal, X, Star, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: number
  name: string
  price: number
  image: string | null
  avgRating: number
  reviewCount: number
  purchaseCount: number
  category: { id: number; name: string; color: string | null }
  seller: { id: number; name: string }
  variants: { id: number; color: string | null; size: string | null }[]
}

interface Category {
  id: number
  name: string
  color: string | null
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Filters
  const [categoryId, setCategoryId] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRating, setMinRating] = useState('')
  const [sortBy, setSortBy] = useState('score')

  // Load categories
  useEffect(() => {
    fetch('/api/categories').then((r) => r.json()).then((d) => setCategories(d.categories ?? [])).catch(() => {})
  }, [])

  const search = useCallback(async (p = 1) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: '20', sortBy })
    if (query) params.set('q', query)
    if (categoryId) params.set('categoryId', categoryId)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (minRating) params.set('minRating', minRating)
    const res = await fetch(`/api/products/search?${params}`)
    const data = await res.json()
    setProducts(data.products ?? [])
    setTotal(data.total ?? 0)
    setPages(data.pages ?? 1)
    setPage(p)
    setLoading(false)
  }, [query, categoryId, minPrice, maxPrice, minRating, sortBy])

  useEffect(() => {
    const timer = setTimeout(() => { void search(1) }, 400)
    return () => clearTimeout(timer)
  }, [search])

  function startVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice search is not supported in your browser.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setQuery(transcript)
    }
    recognition.onerror = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
  }

  function stopVoiceSearch() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  function clearFilters() {
    setCategoryId('')
    setMinPrice('')
    setMaxPrice('')
    setMinRating('')
    setSortBy('score')
  }

  const hasActiveFilters = categoryId || minPrice || maxPrice || minRating || sortBy !== 'score'

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={11}
        className={i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-[#EAE3DC]'}
      />
    ))
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      {/* Search header */}
      <div className="bg-white border-b border-[#EAE3DC] sticky top-0 z-20 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-3 items-center">
            {/* Search input */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search handcrafted products..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#EAE3DC] bg-[#F5F0EB] text-sm focus:outline-none focus:border-[#C8896A] focus:bg-white transition-colors"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E8079] hover:text-[#2D1F1A]"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Voice search */}
            <button
              onClick={listening ? stopVoiceSearch : startVoiceSearch}
              className={`p-3 rounded-xl border transition-all ${
                listening
                  ? 'bg-rose-500 text-white border-rose-500 animate-pulse'
                  : 'bg-white border-[#EAE3DC] text-[#9E8079] hover:border-[#C8896A] hover:text-[#C8896A]'
              }`}
              title={listening ? 'Stop listening' : 'Voice search'}
            >
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                hasActiveFilters
                  ? 'bg-[#C8896A] text-white border-[#C8896A]'
                  : 'bg-white border-[#EAE3DC] text-[#9E8079] hover:border-[#C8896A]'
              }`}
            >
              <SlidersHorizontal size={16} />
              Filters
              {hasActiveFilters && (
                <span className="w-5 h-5 rounded-full bg-white text-[#C8896A] text-xs font-bold flex items-center justify-center">
                  !
                </span>
              )}
            </button>
          </div>

          {/* Voice listening indicator */}
          {listening && (
            <div className="mt-2 flex items-center gap-2 text-sm text-rose-600">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Listening... speak now
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Filters sidebar */}
        {showFilters && (
          <aside className="w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5 space-y-5 sticky top-24">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#2D1F1A]">Filters</h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-[#C8896A] hover:underline">Clear all</button>
                )}
              </div>

              {/* Sort */}
              <div>
                <label className="text-sm font-medium text-[#2D1F1A] block mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-[#EAE3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C8896A]"
                >
                  <option value="score">Relevance</option>
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium text-[#2D1F1A] block mb-2">Category</label>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-2 cursor-pointer py-1">
                    <input
                      type="radio" name="cat" value="" checked={!categoryId}
                      onChange={() => setCategoryId('')}
                      className="accent-[#C8896A]"
                    />
                    <span className="text-sm text-[#2D1F1A]">All Categories</span>
                  </label>
                  {categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="radio" name="cat" value={String(c.id)} checked={categoryId === String(c.id)}
                        onChange={() => setCategoryId(String(c.id))}
                        className="accent-[#C8896A]"
                      />
                      <span className="text-sm text-[#2D1F1A]">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <label className="text-sm font-medium text-[#2D1F1A] block mb-2">Price Range (PKR)</label>
                <div className="flex gap-2">
                  <input
                    type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min" min={0}
                    className="w-1/2 border border-[#EAE3DC] rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-[#C8896A]"
                  />
                  <input
                    type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max" min={0}
                    className="w-1/2 border border-[#EAE3DC] rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-[#C8896A]"
                  />
                </div>
              </div>

              {/* Min rating */}
              <div>
                <label className="text-sm font-medium text-[#2D1F1A] block mb-2">Minimum Rating</label>
                <div className="flex gap-2">
                  {[0, 3, 3.5, 4, 4.5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setMinRating(r ? String(r) : '')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        (r === 0 && !minRating) || minRating === String(r)
                          ? 'bg-[#C8896A] text-white border-[#C8896A]'
                          : 'bg-white border-[#EAE3DC] text-[#9E8079] hover:border-[#C8896A]'
                      }`}
                    >
                      {r === 0 ? 'Any' : `${r}+`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Results header */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[#9E8079]">
              {loading ? 'Searching…' : `${total.toLocaleString()} result${total !== 1 ? 's' : ''}${query ? ` for "${query}"` : ''}`}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden animate-pulse">
                  <div className="aspect-square bg-[#EAE3DC]" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-[#EAE3DC] rounded" />
                    <div className="h-3 bg-[#EAE3DC] rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#EAE3DC] p-16 text-center">
              <Search size={40} className="mx-auto text-[#EAE3DC] mb-3" />
              <p className="font-medium text-[#2D1F1A]">No products found</p>
              <p className="text-sm text-[#9E8079] mt-1">Try a different search or clear your filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}`}
                    className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    <div className="aspect-square relative bg-[#F5F0EB] overflow-hidden">
                      {p.image && (
                        <Image
                          src={p.image ?? undefined}
                          alt={p.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      {p.category.color && (
                        <div
                          className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: p.category.color }}
                        >
                          {p.category.name}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-[#2D1F1A] text-sm leading-tight line-clamp-2 mb-1">{p.name}</h4>
                      <p className="text-xs text-[#9E8079] mb-1.5">{p.seller.name}</p>
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex">{renderStars(p.avgRating)}</div>
                        <span className="text-xs text-[#9E8079]">({p.reviewCount})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[#C8896A]">PKR {p.price.toLocaleString()}</p>
                        {p.purchaseCount > 0 && (
                          <span className="text-xs text-[#9E8079]">{p.purchaseCount} sold</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    disabled={page === 1}
                    onClick={() => search(page - 1)}
                    className="p-2 rounded-xl border border-[#EAE3DC] bg-white disabled:opacity-40 hover:bg-[#F5F0EB] transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm text-[#9E8079]">Page {page} of {pages}</span>
                  <button
                    disabled={page === pages}
                    onClick={() => search(page + 1)}
                    className="p-2 rounded-xl border border-[#EAE3DC] bg-white disabled:opacity-40 hover:bg-[#F5F0EB] transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
