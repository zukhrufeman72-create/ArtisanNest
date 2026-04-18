import AnimatedSection from "./AnimatedSection"
import { features } from "@/lib/data"

export default function WhyChooseUs() {
  return (
    <section className="py-20 lg:py-28 bg-[#FDF8F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <AnimatedSection className="text-center mb-14">
          <p className="font-serif italic text-[#C8896A] text-lg mb-2">Our promise</p>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-[#2D1F1A] mb-4">
            Why Choose ArtisanNest?
          </h2>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#C8896A]/40" />
            <span className="text-[#C8896A] text-lg">✦</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#C8896A]/40" />
          </div>
          <p className="text-[#6B4C3B]/70 max-w-xl mx-auto text-sm leading-relaxed">
            We believe in quality, authenticity, and the power of handmade craftsmanship. Here&apos;s what sets us apart.
          </p>
        </AnimatedSection>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <AnimatedSection key={f.id} delay={i * 80}>
              <div className="group bg-white rounded-2xl p-7 border border-[#E8D5C4]/60 hover:border-[#C8896A]/30 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center h-full">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${f.bg} text-3xl mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  {f.emoji}
                </div>
                <h3 className={`font-serif font-bold text-[#2D1F1A] text-lg mb-3 group-hover:${f.text} transition-colors`}>
                  {f.title}
                </h3>
                <p className="text-[#6B4C3B]/70 text-sm leading-relaxed">
                  {f.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Stats bar */}
        <AnimatedSection delay={200} className="mt-14">
          <div className="bg-white rounded-2xl border border-[#E8D5C4]/60 shadow-sm p-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-x divide-[#E8D5C4]/60">
              {[
                { value: "2,400+", label: "Unique Products", emoji: "🛍️" },
                { value: "850+", label: "Verified Artisans", emoji: "✋" },
                { value: "12K+", label: "Happy Customers", emoji: "😊" },
                { value: "4.9 / 5", label: "Average Rating", emoji: "⭐" },
              ].map((s, i) => (
                <div key={i} className={`text-center ${i > 0 ? "pl-8" : ""}`}>
                  <div className="text-2xl mb-1">{s.emoji}</div>
                  <div className="font-serif text-3xl font-bold text-[#C8896A]">{s.value}</div>
                  <div className="text-xs text-[#9E8079] font-medium mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
