"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { logout } from "@/app/actions/auth"
import {
  ShoppingBag, Heart, Search, Menu, X, ChevronDown,
  User, Package, LogOut, LayoutDashboard, ShoppingCart, MessageCircle,
} from "lucide-react"
import AuthModal from "./AuthModal"

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/#products" },
  { label: "Categories", href: "/#categories" },
  { label: "Contact", href: "/contact" },
  { label: "Support", href: "/support" },
]

type NavbarProps = {
  user: { name: string; email: string; role: string } | null
  initialCartCount: number
}

export default function Navbar({ user, initialCartCount }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [cartCount, setCartCount] = useState(initialCartCount)
  const [profileOpen, setProfileOpen] = useState(false)
  const [authModal, setAuthModal] = useState<{ open: boolean; tab: 'login' | 'register' }>({ open: false, tab: 'login' })
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Listen for cart updates dispatched by PublicProductCard / CartView
  useEffect(() => {
    const handler = (e: Event) => {
      const count = (e as CustomEvent<{ count: number }>).detail.count
      setCartCount(count)
    }
    window.addEventListener("cart-updated", handler)
    return () => window.removeEventListener("cart-updated", handler)
  }, [])

  // Listen for open-auth-modal events from anywhere in the app
  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent<{ tab: 'login' | 'register' }>).detail?.tab ?? 'login'
      setAuthModal({ open: true, tab })
    }
    window.addEventListener("open-auth-modal", handler)
    return () => window.removeEventListener("open-auth-modal", handler)
  }, [])

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U"

  const dashboardHref =
    user?.role === "ADMIN" ? "/admin/dashboard" :
    user?.role === "SELLER" ? "/seller/dashboard" : "#"

  return (
    <>
    <header className="sticky top-0 z-50">
      {/* Announcement bar */}
      <div className="bg-[#C8896A] text-white text-xs py-2 text-center tracking-wide font-medium">
        🌿&nbsp; Free shipping on orders over Rs. 2,000 &nbsp;·&nbsp; Handmade with love worldwide &nbsp;🌿
      </div>

      <nav className={`transition-all duration-300 ${scrolled ? "bg-white shadow-sm" : "bg-white/90 backdrop-blur-md"}`}>
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
                <div className="font-serif font-bold text-lg text-[#2D1F1A] leading-tight group-hover:text-[#C8896A] transition-colors">ArtisanNest</div>
                <div className="text-[10px] text-[#9E8079] tracking-[0.15em] uppercase leading-none">Handmade Crafts</div>
              </div>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-7">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="relative text-sm font-medium text-[#6B4C3B] hover:text-[#C8896A] transition-colors pb-0.5 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#C8896A] after:transition-all after:duration-300 hover:after:w-full"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right section */}
            <div className="flex items-center gap-1">

              {/* Search */}
              <button className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#F5EFE6] transition-colors text-[#6B4C3B] hover:text-[#C8896A]">
                <Search size={18} />
              </button>

              {/* Wishlist */}
              {user ? (
                <Link
                  href="/wishlist"
                  className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#F5EFE6] transition-colors text-[#6B4C3B] hover:text-rose-500"
                >
                  <Heart size={18} />
                </Link>
              ) : (
                <button
                  onClick={() => setAuthModal({ open: true, tab: 'login' })}
                  className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#F5EFE6] transition-colors text-[#6B4C3B] hover:text-rose-500"
                >
                  <Heart size={18} />
                </button>
              )}

              {/* Messages */}
              {user && (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-messenger', { detail: {} }))}
                  className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#F5EFE6] transition-colors text-[#6B4C3B] hover:text-[#C8896A]"
                >
                  <MessageCircle size={18} />
                </button>
              )}

              {/* Cart */}
              <Link
                href="/cart"
                className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#F5EFE6] transition-colors text-[#6B4C3B] hover:text-[#C8896A]"
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#C8896A] text-white text-[9px] rounded-full flex items-center justify-center font-bold animate-pulse">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>

              {/* User profile */}
              {user ? (
                <div ref={profileRef} className="hidden lg:block relative ml-2">
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-[#F5EFE6] transition-all duration-200 group"
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#C8896A] to-[#8B5E45] flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-[#C8896A]/20">
                      {initials}
                    </div>
                    <span className="text-sm font-medium text-[#2D1F1A] max-w-24 truncate group-hover:text-[#C8896A] transition-colors">
                      {user.name.split(" ")[0]}
                    </span>
                    <ChevronDown size={13} className={`text-[#9E8079] transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown */}
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-sm rounded-2xl border border-[#EAE3DC] shadow-xl shadow-black/8 overflow-hidden z-50">
                      {/* User info */}
                      <div className="px-4 py-3.5 border-b border-[#F5EFE6]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#C8896A] to-[#8B5E45] flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#2D1F1A] truncate">{user.name}</p>
                            <p className="text-[11px] text-[#9E8079] truncate">{user.email}</p>
                          </div>
                        </div>
                        <span className="mt-2 inline-block text-[9px] font-bold uppercase tracking-widest bg-[#C8896A]/10 text-[#C8896A] px-2 py-0.5 rounded-full">
                          {user.role}
                        </span>
                      </div>

                      {/* Menu items */}
                      <div className="py-1.5">
                        {(user.role === "ADMIN" || user.role === "SELLER") && (
                          <Link
                            href={dashboardHref}
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#6B4C3B] hover:bg-[#F5EFE6] hover:text-[#C8896A] transition-colors"
                          >
                            <LayoutDashboard size={15} /> Dashboard
                          </Link>
                        )}
                        {user.role === "CUSTOMER" && (
                          <Link
                            href="/orders"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#6B4C3B] hover:bg-[#F5EFE6] hover:text-[#C8896A] transition-colors"
                          >
                            <Package size={15} /> My Orders
                          </Link>
                        )}
                        <button
                          onClick={() => { setProfileOpen(false); window.dispatchEvent(new CustomEvent('open-messenger', { detail: {} })) }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#6B4C3B] hover:bg-[#F5EFE6] hover:text-[#C8896A] transition-colors text-left"
                        >
                          <MessageCircle size={15} /> Messages
                        </button>
                        <Link
                          href="/cart"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#6B4C3B] hover:bg-[#F5EFE6] hover:text-[#C8896A] transition-colors"
                        >
                          <ShoppingBag size={15} /> My Cart
                          {cartCount > 0 && (
                            <span className="ml-auto bg-[#C8896A] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                              {cartCount}
                            </span>
                          )}
                        </Link>
                        <Link
                          href="/wishlist"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#6B4C3B] hover:bg-[#F5EFE6] hover:text-rose-500 transition-colors"
                        >
                          <Heart size={15} /> Wishlist
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-[#F5EFE6] py-1.5">
                        <form action={logout}>
                          <button
                            type="submit"
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            <LogOut size={15} /> Sign Out
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setAuthModal({ open: true, tab: 'login' })}
                  className="hidden lg:flex items-center gap-1.5 ml-2 px-5 py-2.5 bg-[#C8896A] hover:bg-[#A8694A] text-white text-sm font-semibold rounded-full transition-all duration-200 hover:shadow-md hover:-translate-y-px"
                >
                  <User size={15} /> Sign In
                </button>
              )}

              {/* Hamburger */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#F5EFE6] transition-colors text-[#2D1F1A] ml-1"
              >
                {isOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isOpen ? "max-h-screen border-t border-[#E8D5C4]" : "max-h-0"}`}>
            <div className="py-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block px-4 py-2.5 text-sm font-medium text-[#6B4C3B] hover:text-[#C8896A] hover:bg-[#F5EFE6] rounded-xl transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {user ? (
                <div className="px-4 pt-3 space-y-2 border-t border-[#E8D5C4] mt-2">
                  {/* Mobile user info */}
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#C8896A] to-[#8B5E45] flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#2D1F1A]">{user.name}</p>
                      <p className="text-xs text-[#9E8079]">{user.email}</p>
                    </div>
                  </div>
                  {(user.role === "ADMIN" || user.role === "SELLER") && (
                    <Link href={dashboardHref} onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 w-full px-4 py-2.5 bg-[#F5EFE6] text-[#6B4C3B] text-sm font-semibold rounded-xl hover:bg-[#E8D5C4] transition-colors">
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => { setIsOpen(false); window.dispatchEvent(new CustomEvent('open-messenger', { detail: {} })) }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 bg-[#F5EFE6] text-[#6B4C3B] text-sm font-semibold rounded-xl hover:bg-[#E8D5C4] transition-colors text-left"
                  >
                    <MessageCircle size={15} /> Messages
                  </button>
                  <Link href="/cart" onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 bg-[#F5EFE6] text-[#6B4C3B] text-sm font-semibold rounded-xl hover:bg-[#E8D5C4] transition-colors">
                    <ShoppingCart size={15} /> Cart {cartCount > 0 && `(${cartCount})`}
                  </Link>
                  <form action={logout}>
                    <button type="submit"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#A8694A] transition-colors">
                      <LogOut size={15} /> Sign Out
                    </button>
                  </form>
                </div>
              ) : (
                <div className="px-4 pt-3">
                  <button
                    onClick={() => { setIsOpen(false); setAuthModal({ open: true, tab: 'login' }) }}
                    className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-full hover:bg-[#A8694A] transition-colors"
                  >
                    <User size={15} /> Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>

    <AuthModal
      open={authModal.open}
      defaultTab={authModal.tab}
      onClose={() => setAuthModal((v) => ({ ...v, open: false }))}
    />
    </>
  )
}
