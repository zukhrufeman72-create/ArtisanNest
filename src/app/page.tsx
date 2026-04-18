import NavbarWrapper from "@/components/NavbarWrapper"
import Hero from "@/components/Hero"
import FeaturedProducts from "@/components/FeaturedProducts"
import Categories from "@/components/Categories"
import TrendingSection from "@/components/TrendingSection"
import WhyChooseUs from "@/components/WhyChooseUs"
import Testimonials from "@/components/Testimonials"
import Newsletter from "@/components/Newsletter"
import Footer from "@/components/Footer"

export default function Home() {
  return (
    <>
      <NavbarWrapper />
      <main>
        <Hero />
        <FeaturedProducts />
        <Categories />
        <TrendingSection />
        <WhyChooseUs />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
    </>
  )
}
