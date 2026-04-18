"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { logout } from "@/app/actions/auth"

const NAV_LINKS = ["Home", "Shop", "Categories", "About", "Contact"]

type NavbarProps = {
  user: { role: string } | null
}

export default function Navbar({ user }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className="sticky top-0 z-50">
      {/* Announcement bar */}
      <div className="bg-[#C8896A] text-white text-xs py-2 text-center tracking-wide font-medium">
        🌿&nbsp; Free shipping on orders over $59 &nbsp;·&nbsp; Handmade with love worldwide &nbsp;🌿
      </div>

      <nav
        className={`transition-all duration-300 ${
          scrolled ? "bg-white shadow-sm" : "bg-white/90 backdrop-blur-md"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[#C8896A] flex items-center justify-center shadow-sm group-hover:bg-[#A8694A] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3C8.5 3 6 6.5 6 10.5C6 14.5 9 18 12 20C15 18 18 14.5 18 10.5C18 6.5 15.5 3 12 3Z" fill="white" opacity="0.95" />
                  <path d="M12 20V23" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M9.5 22H14.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="12" cy="10" r="2.5" fill="#C8896A" />
                </svg>
              </div>
              <div>
                <div className="font-serif font-bold text-lg text-[#2D1F1A] leading-tight group-hover:text-[#C8896A] transition-colors">
                  ArtisanNest
                </div>
                <div className="text-[10px] text-[#9E8079] tracking-[0.15em] uppercase leading-none">
                  Handmade Crafts
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-7">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link}
                  href="#"
                  className="relative text-sm font-medium text-[#6B4C3B] hover:text-[#C8896A] transition-colors pb-0.5 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#C8896A] after:transition-all after:duration-300 hover:after:w-full"
                >
                  {link}
                </Link>
              ))}
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-0.5">
              <button className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#F5EFE6] transition-colors text-[#6B4C3B] hover:text-[#C8896A]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <button className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#F5EFE6] transition-colors text-[#6B4C3B] hover:text-rose-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              <button className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#F5EFE6] transition-colors text-[#6B4C3B] hover:text-[#C8896A]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#C8896A] text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  3
                </span>
              </button>

              {user ? (
                <div className="hidden lg:flex items-center gap-2 ml-2">
                  <Link
                    href={user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'SELLER' ? '/seller/dashboard' : '#'}
                    className="text-sm font-medium text-[#6B4C3B] hover:text-[#C8896A] transition-colors"
                  >
                    Dashboard
                  </Link>
                  <form action={logout}>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-[#F5EFE6] hover:bg-[#E8D5C4] text-[#6B4C3B] text-sm font-semibold rounded-full transition-all duration-200"
                    >
                      Sign Out
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="hidden lg:flex items-center gap-1.5 ml-2 px-5 py-2.5 bg-[#C8896A] hover:bg-[#A8694A] text-white text-sm font-semibold rounded-full transition-all duration-200 hover:shadow-md hover:-translate-y-px"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Sign In
                </Link>
              )}

              {/* Hamburger */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#F5EFE6] transition-colors text-[#2D1F1A] ml-1"
                aria-label="Toggle menu"
              >
                {isOpen ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <div
            className={`lg:hidden overflow-hidden transition-all duration-300 ${isOpen ? "max-h-80 border-t border-[#E8D5C4]" : "max-h-0"}`}
          >
            <div className="py-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link}
                  href="#"
                  className="block px-4 py-2.5 text-sm font-medium text-[#6B4C3B] hover:text-[#C8896A] hover:bg-[#F5EFE6] rounded-xl transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link}
                </Link>
              ))}
              <div className="px-4 pt-3 space-y-2">
                {user ? (
                  <>
                    <Link
                      href={user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'SELLER' ? '/seller/dashboard' : '#'}
                      className="block w-full text-center px-5 py-2.5 bg-[#F5EFE6] text-[#6B4C3B] text-sm font-semibold rounded-full hover:bg-[#E8D5C4] transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <form action={logout}>
                      <button
                        type="submit"
                        className="block w-full text-center px-5 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-full hover:bg-[#A8694A] transition-colors"
                      >
                        Sign Out
                      </button>
                    </form>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    className="block w-full text-center px-5 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-full hover:bg-[#A8694A] transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
