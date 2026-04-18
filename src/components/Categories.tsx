import AnimatedSection from "./AnimatedSection"
import { categories } from "@/lib/data"
import Link from "next/link"

export default function Categories() {
  return (
    <section id="categories" className="py-20 lg:py-28 bg-[#FDF8F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <AnimatedSection className="text-center mb-14">
          <p className="font-serif italic text-[#C8896A] text-lg mb-2">Browse by type</p>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-[#2D1F1A] mb-4">
            Shop by Category
          </h2>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#C8896A]/40" />
            <span className="text-[#C8896A] text-lg">✦</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#C8896A]/40" />
          </div>
          <p className="text-[#6B4C3B]/70 max-w-xl mx-auto text-sm leading-relaxed">
            Explore our curated collections — from statement jewelry to statement walls. Find exactly what speaks to you.
          </p>
        </AnimatedSection>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <AnimatedSection key={cat.id} delay={i * 70}>
              <Link href="#">
                <div className={`group bg-gradient-to-br ${cat.gradient} rounded-2xl p-5 text-center border border-white/60 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 cursor-pointer h-full`}>
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {cat.emoji}
                  </div>
                  <div className="font-semibold text-[#2D1F1A] text-xs leading-tight mb-1.5">
                    {cat.name}
                  </div>
                  <div className="text-[10px] text-[#9E8079] font-medium">
                    {cat.count} items
                  </div>
                  <div className="mt-3 flex justify-center">
                    <span className="w-6 h-6 rounded-full bg-white/60 group-hover:bg-[#C8896A] flex items-center justify-center transition-colors duration-300">
                      <svg className="w-3 h-3 text-[#C8896A] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </AnimatedSection>
          ))}
        </div>

        {/* Banner strip */}
        <AnimatedSection delay={200} className="mt-10">
          <div className="relative overflow-hidden bg-gradient-to-r from-[#C8896A] via-[#B8795A] to-[#A8694A] rounded-2xl p-7 lg:p-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="pointer-events-none absolute right-0 top-0 opacity-10 text-[180px] select-none leading-none">🌿</div>
            <div className="text-center lg:text-left">
              <h3 className="font-serif text-2xl lg:text-3xl font-bold text-white mb-2">
                Spring Sale — Up to 40% Off
              </h3>
              <p className="text-white/80 text-sm">Limited time on selected handmade pieces</p>
            </div>
            <Link
              href="#"
              className="shrink-0 inline-flex items-center gap-2 bg-white text-[#C8896A] hover:bg-[#F5EFE6] font-bold px-7 py-3.5 rounded-full transition-all duration-200 text-sm hover:shadow-md"
            >
              Shop the Sale
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
