import AnimatedSection from "./AnimatedSection"
import { featuredProducts } from "@/lib/data"
import Link from "next/link"
import { Star, Heart, ShoppingBag } from "lucide-react"
import PublicProductCard, { type PublicProduct } from "./PublicProductCard"

type Props = {
  products: PublicProduct[]
  wishlistIds: number[]
}

export default function FeaturedProducts({ products, wishlistIds }: Props) {
  const useReal = products.length > 0

  return (
    <section id="products" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <AnimatedSection className="text-center mb-14">
          <p className="font-serif italic text-[#C8896A] text-lg mb-2">Shop now</p>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-[#2D1F1A] mb-4">
            Shop Our Best&#8209;Sellers
          </h2>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-16 bg-linear-to-r from-transparent to-[#C8896A]/40" />
            <span className="text-[#C8896A] text-lg">✦</span>
            <div className="h-px w-16 bg-linear-to-l from-transparent to-[#C8896A]/40" />
          </div>
          <p className="text-[#6B4C3B]/70 max-w-xl mx-auto text-sm leading-relaxed">
            {useReal
              ? `${products.length} handpicked items from our talented artisans, ready to ship.`
              : 'Handpicked favorites loved by thousands of customers. Each piece crafted with care and devotion.'}
          </p>
        </AnimatedSection>

        {/* Real DB products */}
        {useReal ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.slice(0, 8).map((product, i) => (
              <AnimatedSection key={product.id} delay={i * 60} className="relative">
                <PublicProductCard
                  product={product}
                  isWishlisted={wishlistIds.includes(product.id)}
                />
              </AnimatedSection>
            ))}
          </div>
        ) : (
          /* Static fallback when no DB products yet */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredProducts.map((product, i) => (
              <AnimatedSection key={product.id} delay={i * 60}>
                <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#E8D5C4]/60 hover:border-[#C8896A]/30 hover:-translate-y-1">
                  <div className={`relative bg-linear-to-br ${product.gradient} h-48 flex items-center justify-center`}>
                    <span className="text-6xl group-hover:scale-110 transition-transform duration-300 select-none">{product.emoji}</span>
                    {product.badge && (
                      <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${product.badge === 'hot' ? 'bg-rose-500 text-white' : product.badge === 'new' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>{product.badge}</span>
                    )}
                    <button className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-rose-50 hover:text-rose-500 text-[#9E8079] shadow-sm">
                      <Heart size={14} />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-[#9E8079] font-medium mb-1">{product.category}</div>
                    <h3 className="font-semibold text-[#2D1F1A] text-sm leading-snug mb-2 group-hover:text-[#C8896A] transition-colors">{product.name}</h3>
                    <div className="flex items-center gap-1 mb-3">
                      {[1,2,3,4,5].map((i) => <Star key={i} size={10} className={`${i <= Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-stone-200 fill-stone-200'}`} />)}
                      <span className="text-xs text-[#9E8079]">({product.reviews})</span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-3">
                      <span className="font-bold text-[#2D1F1A] text-base">${product.price}</span>
                      {product.originalPrice && <span className="text-xs text-[#9E8079] line-through">${product.originalPrice}</span>}
                    </div>
                    <button className="w-full py-2.5 bg-[#F5EFE6] hover:bg-[#C8896A] text-[#C8896A] hover:text-white text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
                      <ShoppingBag size={13} /> Add to Cart
                    </button>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        )}

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
