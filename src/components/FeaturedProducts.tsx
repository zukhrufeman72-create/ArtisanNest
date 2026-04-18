import AnimatedSection from "./AnimatedSection"
import { featuredProducts, type Product } from "@/lib/data"
import Link from "next/link"

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? "text-amber-400" : "text-stone-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function ProductCard({ product, delay }: { product: Product; delay: number }) {
  const badgeStyles: Record<string, string> = {
    hot: "bg-rose-500 text-white",
    new: "bg-emerald-500 text-white",
    sale: "bg-amber-500 text-white",
  }

  return (
    <AnimatedSection delay={delay}>
      <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#E8D5C4]/60 hover:border-[#C8896A]/30 hover:-translate-y-1">
        {/* Image area */}
        <div className={`relative bg-linear-to-br ${product.gradient} h-44 flex items-center justify-center`}>
          <span className="text-6xl group-hover:scale-110 transition-transform duration-300 select-none">
            {product.emoji}
          </span>
          {product.badge && (
            <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${badgeStyles[product.badge]}`}>
              {product.badge}
            </span>
          )}
          <button className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-rose-50 hover:text-rose-500 text-[#9E8079] shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="text-xs text-[#9E8079] font-medium mb-1">{product.category}</div>
          <h3 className="font-semibold text-[#2D1F1A] text-sm leading-snug mb-2 group-hover:text-[#C8896A] transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center gap-1.5 mb-3">
            <Stars rating={product.rating} />
            <span className="text-xs text-[#9E8079]">({product.reviews})</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-[#2D1F1A] text-base">${product.price}</span>
              {product.originalPrice && (
                <span className="text-xs text-[#9E8079] line-through">${product.originalPrice}</span>
              )}
            </div>
          </div>

          <button className="mt-3 w-full py-2.5 bg-[#F5EFE6] hover:bg-[#C8896A] text-[#C8896A] hover:text-white text-xs font-semibold rounded-xl transition-all duration-200 group-hover:bg-[#C8896A] group-hover:text-white">
            Add to Cart
          </button>
        </div>
      </div>
    </AnimatedSection>
  )
}

export default function FeaturedProducts() {
  return (
    <section id="products" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <AnimatedSection className="text-center mb-14">
          <p className="font-serif italic text-[#C8896A] text-lg mb-2">Shop now</p>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-[#2D1F1A] mb-4">
            Shop Our Best&#8209;Sellers
          </h2>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#C8896A]/40" />
            <span className="text-[#C8896A] text-lg">✦</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#C8896A]/40" />
          </div>
          <p className="text-[#6B4C3B]/70 max-w-xl mx-auto text-sm leading-relaxed">
            Handpicked favorites loved by thousands of customers. Each piece crafted with care and devotion.
          </p>
        </AnimatedSection>

        {/* Products grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredProducts.map((product, i) => (
            <ProductCard key={product.id} product={product} delay={i * 60} />
          ))}
        </div>

        {/* View all */}
        <AnimatedSection className="text-center mt-12">
          <Link
            href="#"
            className="inline-flex items-center gap-2 border border-[#C8896A] text-[#C8896A] hover:bg-[#C8896A] hover:text-white font-semibold px-8 py-3.5 rounded-full transition-all duration-300 text-sm hover:shadow-lg hover:shadow-[#C8896A]/20"
          >
            View All Products
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </AnimatedSection>
      </div>
    </section>
  )
}
