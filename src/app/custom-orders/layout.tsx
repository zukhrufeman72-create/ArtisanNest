import NavbarWrapper from '@/components/NavbarWrapper'
import Footer from '@/components/Footer'

export default function CustomOrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavbarWrapper />
      <main className="min-h-screen bg-[#FDF8F3]">
        {children}
      </main>
      <Footer />
    </>
  )
}
