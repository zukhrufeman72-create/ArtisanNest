import Link from "next/link"

const floatingCards = [
  {
    emoji: "🧵", name: "Macramé Art", price: "$45",
    gradient: "from-orange-100 to-amber-100",
    border: "border-orange-200/60",
    pos: "top-8 right-8",
    rotate: "-rotate-6",
    delay: "0s",
  },
  {
    emoji: "📿", name: "Gem Necklace", price: "$32",
    gradient: "from-purple-100 to-pink-100",
    border: "border-purple-200/60",
    pos: "bottom-14 right-20",
    rotate: "rotate-3",
    delay: "0.9s",
  },
  {
    emoji: "🕯️", name: "Soy Candles", price: "$24",
    gradient: "from-yellow-100 to-amber-100",
    border: "border-yellow-200/60",
    pos: "left-6 bottom-20",
    rotate: "-rotate-3",
    delay: "1.5s",
  },
]

export default function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-5.5rem)] flex items-center bg-gradient-to-br from-[#FDF8F3] via-[#F9F2E8] to-[#F0E4D4] overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none absolute -top-20 right-0 w-[500px] h-[500px] rounded-full bg-[#C8896A]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 w-[480px] h-[480px] rounded-full bg-[#7D9B76]/10 blur-3xl" />

      {/* Dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(#C8896A 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">

          {/* ── Left text column ─────────────────────────────── */}
          <div className="space-y-7 animate-fade-in-up">
            {/* Pill */}
            <span className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-[#E8D5C4] rounded-full px-4 py-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#C8896A] animate-pulse" />
              <span className="text-sm font-medium text-[#C8896A]">New arrivals every week</span>
            </span>

            {/* Headline */}
            <h1 className="font-serif text-5xl lg:text-[58px] xl:text-[68px] font-bold text-[#2D1F1A] leading-[1.08] tracking-tight">
              Discover
              <span className="block italic text-[#C8896A]">the Beauty of</span>
              Handmade Crafts
            </h1>

            <p className="text-base lg:text-lg text-[#6B4C3B]/80 max-w-lg leading-relaxed">
              Shop unique handcrafted treasures made with love by talented artisans worldwide.
              From stunning wall art to exquisite jewelry — every piece tells a story.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="#products"
                className="group inline-flex items-center gap-2.5 bg-[#C8896A] hover:bg-[#A8694A] text-white font-semibold px-8 py-3.5 rounded-full transition-all duration-300 shadow-lg shadow-[#C8896A]/25 hover:shadow-xl hover:shadow-[#C8896A]/35 hover:-translate-y-0.5 text-sm"
              >
                Shop Now
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="#categories"
                className="inline-flex items-center gap-2.5 bg-white hover:bg-[#F5EFE6] text-[#2D1F1A] font-semibold px-8 py-3.5 rounded-full border border-[#E8D5C4] hover:border-[#C8896A]/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md text-sm"
              >
                Explore Categories
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-1">
              {[
                { value: "2,400+", label: "Products" },
                { value: "850+", label: "Artisans" },
                { value: "12K+", label: "Happy Buyers" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-serif text-2xl font-bold text-[#2D1F1A]">{s.value}</div>
                  <div className="text-xs text-[#9E8079] mt-0.5 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right visual column ───────────────────────────── */}
          <div className="relative hidden lg:flex justify-center items-center h-[520px]">
            {/* Concentric circles */}
            <div className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-[#EDD9C8] to-[#C8896A]/20 shadow-inner" />
            <div className="absolute w-52 h-52 rounded-full border-2 border-dashed border-[#C8896A]/25" />

            {/* Floating product cards */}
            {floatingCards.map((card) => (
              <div
                key={card.name}
                className={`absolute ${card.pos} animate-float`}
                style={{ animationDelay: card.delay }}
              >
                <div
                  className={`bg-gradient-to-br ${card.gradient} ${card.rotate} rounded-2xl p-4 shadow-xl w-36 text-center border ${card.border}`}
                >
                  <div className="text-5xl mb-2">{card.emoji}</div>
                  <div className="text-xs font-semibold text-[#2D1F1A]">{card.name}</div>
                  <div className="text-sm font-bold text-[#C8896A] mt-1">{card.price}</div>
                </div>
              </div>
            ))}

            {/* Decorative sparkles */}
            <span className="absolute top-12 left-16 text-2xl" style={{ animation: "float 2.5s ease-in-out infinite" }}>✨</span>
            <span className="absolute top-24 right-8 text-xl" style={{ animation: "float 3.5s ease-in-out infinite 0.6s" }}>🌿</span>
            <span className="absolute top-16 right-36 text-lg" style={{ animation: "float 4s ease-in-out infinite 1.2s" }}>⭐</span>

            {/* Rating badge */}
            <div className="absolute bottom-6 left-8 bg-white rounded-2xl shadow-lg px-3.5 py-2.5 flex items-center gap-2.5 border border-[#E8D5C4]">
              <div className="w-9 h-9 rounded-full bg-[#C8896A] flex items-center justify-center text-white text-sm font-bold shrink-0">
                ★
              </div>
              <div>
                <div className="text-sm font-bold text-[#2D1F1A] leading-tight">4.9 / 5.0</div>
                <div className="text-xs text-[#9E8079] leading-tight">12K+ reviews</div>
              </div>
            </div>

            {/* New arrivals badge */}
            <div className="absolute top-4 left-1/4 bg-[#C8896A] text-white rounded-xl shadow-md px-3 py-2 text-xs font-semibold whitespace-nowrap">
              🆕 New this week
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-[#9E8079]">
        <span className="text-xs font-medium tracking-wide">Scroll to explore</span>
        <div className="w-px h-7 bg-gradient-to-b from-[#C8896A] to-transparent animate-float" />
      </div>
    </section>
  )
}
