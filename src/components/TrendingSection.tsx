import AnimatedSection from "./AnimatedSection"
import { trendingProducts } from "@/lib/data"
import Link from "next/link"

export default function TrendingSection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <AnimatedSection>
            <p className="font-serif italic text-[#C8896A] text-lg mb-1">This week&apos;s picks</p>
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-[#2D1F1A]">
              Handmade of the Week
            </h2>
          </AnimatedSection>
          <AnimatedSection direction="right">
            <Link
              href="#"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C8896A] hover:text-[#A8694A] transition-colors group"
            >
              See all trending
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </AnimatedSection>
        </div>

        {/* Cards — horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-5 overflow-x-auto pb-4 lg:grid lg:grid-cols-4 lg:overflow-visible snap-x snap-mandatory">
          {trendingProducts.map((product, i) => (
            <AnimatedSection key={product.id} delay={i * 80} className="min-w-[240px] lg:min-w-0 snap-start flex-shrink-0 lg:flex-shrink">
              <div className="group bg-white rounded-2xl border border-[#E8D5C4]/60 hover:border-[#C8896A]/30 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
                {/* Image */}
                <div className={`relative bg-gradient-to-br ${product.gradient} h-48 flex items-center justify-center`}>
                  <span className="text-7xl group-hover:scale-110 transition-transform duration-300 select-none">
                    {product.emoji}
                  </span>
                  {product.badge && (
                    <span className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                      {product.badge}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="text-xs text-[#9E8079] font-medium mb-1">{product.category}</div>
                  <h3 className="font-semibold text-[#2D1F1A] text-sm mb-3 group-hover:text-[#C8896A] transition-colors leading-snug">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2D1F1A]">${product.price}</span>
                    <button className="w-8 h-8 rounded-full bg-[#F5EFE6] hover:bg-[#C8896A] flex items-center justify-center transition-colors group/btn">
                      <svg className="w-4 h-4 text-[#C8896A] group-hover/btn:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
