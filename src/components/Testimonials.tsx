import AnimatedSection from "./AnimatedSection"
import { testimonials } from "@/lib/data"

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function Testimonials() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <AnimatedSection className="text-center mb-14">
          <p className="font-serif italic text-[#C8896A] text-lg mb-2">Voices of delight</p>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-[#2D1F1A] mb-4">
            What Our Customers Say
          </h2>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#C8896A]/40" />
            <span className="text-[#C8896A] text-lg">✦</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#C8896A]/40" />
          </div>
          <p className="text-[#6B4C3B]/70 max-w-xl mx-auto text-sm leading-relaxed">
            Real stories from real people who found something special on ArtisanNest.
          </p>
        </AnimatedSection>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <AnimatedSection key={t.id} delay={i * 100}>
              <div className="group bg-[#FDF8F3] rounded-2xl p-7 border border-[#E8D5C4]/60 hover:border-[#C8896A]/30 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                {/* Quote mark */}
                <div className="text-5xl font-serif text-[#C8896A]/20 leading-none mb-3 select-none">&ldquo;</div>

                <Stars count={t.rating} />

                <p className="text-[#6B4C3B]/80 text-sm leading-relaxed mt-4 flex-1">
                  {t.text}
                </p>

                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-[#E8D5C4]/60">
                  <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-sm font-bold shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-[#2D1F1A] text-sm">{t.name}</div>
                    <div className="text-xs text-[#9E8079]">{t.location}</div>
                  </div>
                  <div className="ml-auto">
                    <svg className="w-5 h-5 text-[#C8896A]/30" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                    </svg>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Trust badges */}
        <AnimatedSection delay={200} className="mt-12">
          <div className="flex flex-wrap items-center justify-center gap-6 text-center">
            {[
              { emoji: "🏆", label: "Top Rated Store 2024" },
              { emoji: "✅", label: "Verified Artisans" },
              { emoji: "🔐", label: "Secure Checkout" },
              { emoji: "↩️", label: "Easy Returns" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 bg-[#F5EFE6] rounded-full px-5 py-2.5 border border-[#E8D5C4]/60">
                <span>{b.emoji}</span>
                <span className="text-sm font-medium text-[#6B4C3B]">{b.label}</span>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
