'use client'

import { useState, useEffect } from 'react'
import { Tag, Clock, ChevronRight, Zap } from 'lucide-react'
import Link from 'next/link'

interface Deal {
  id: number
  title: string
  description: string | null
  discountType: string
  discountValue: number
  endDate: string
  bannerImage: string | null
  isGlobal: boolean
}

function useCountdown(endDate: string) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 })

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, new Date(endDate).getTime() - Date.now())
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft({ h, m, s })
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [endDate])

  return timeLeft
}

function DealCard({ deal }: { deal: Deal }) {
  const { h, m, s } = useCountdown(deal.endDate)
  const pad = (n: number) => String(n).padStart(2, '0')
  const discount = deal.discountType === 'PERCENTAGE'
    ? `${deal.discountValue}% OFF`
    : `PKR ${deal.discountValue.toLocaleString()} OFF`

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: deal.bannerImage
          ? `linear-gradient(135deg, rgba(45,31,26,0.85), rgba(200,137,106,0.7)), url(${deal.bannerImage}) center/cover`
          : 'linear-gradient(135deg, #2D1F1A, #C8896A)',
      }}
    >
      <div className="p-5 sm:p-7">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-[#F5D0A9]" />
              <span className="text-[10px] font-bold text-[#F5D0A9] uppercase tracking-widest">Flash Deal</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mb-1">{deal.title}</h3>
            {deal.description && (
              <p className="text-sm text-white/70 mb-3 max-w-sm">{deal.description}</p>
            )}
            <div className="inline-flex items-center gap-2 bg-[#C8896A] text-white px-3 py-1.5 rounded-full">
              <Tag size={13} />
              <span className="text-sm font-bold">{discount}</span>
            </div>
          </div>

          {/* Countdown */}
          <div className="shrink-0">
            <div className="flex items-center gap-1 mb-1.5">
              <Clock size={12} className="text-white/60" />
              <span className="text-[10px] text-white/60 uppercase tracking-wider">Ends in</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[{ v: h, l: 'h' }, { v: m, l: 'm' }, { v: s, l: 's' }].map(({ v, l }) => (
                <div key={l} className="text-center">
                  <div className="bg-black/30 backdrop-blur-sm text-white font-mono text-xl font-bold w-12 h-12 rounded-xl flex items-center justify-center">
                    {pad(v)}
                  </div>
                  <div className="text-[9px] text-white/50 mt-0.5 uppercase">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Link
          href="/shop"
          className="mt-4 inline-flex items-center gap-1.5 bg-white text-[#2D1F1A] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#F5EFE6] transition-colors"
        >
          Shop Now <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}

export default function DealsBanner() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    fetch('/api/deals?status=ACTIVE')
      .then((r) => r.json())
      .then((data) => setDeals(data.deals ?? []))
      .catch(() => null)
  }, [])

  if (deals.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-[#C8896A] rounded-full" />
          <h2 className="font-serif text-xl font-bold text-[#2D1F1A]">Active Deals</h2>
          <span className="text-xs bg-[#C8896A]/10 text-[#C8896A] font-semibold px-2 py-0.5 rounded-full">{deals.length}</span>
        </div>
        {deals.length > 1 && (
          <div className="flex items-center gap-1.5">
            {deals.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'w-6 bg-[#C8896A]' : 'w-1.5 bg-[#EAE3DC]'}`}
              />
            ))}
          </div>
        )}
      </div>
      <DealCard deal={deals[idx]} />
    </section>
  )
}
