import NavbarWrapper from '@/components/NavbarWrapper'
import Footer from '@/components/Footer'
import ContactForm from './ContactForm'
import SupportChatButton from './SupportChatButton'
import { MapPin, Mail, Phone, Clock, MessageCircle, Package, Shield } from 'lucide-react'

const INFO = [
  {
    icon: MapPin,
    label: 'Our Studio',
    value: 'Lahore, Punjab, Pakistan',
    sub: 'Visit by appointment',
    color: 'bg-rose-50 text-rose-500',
  },
  {
    icon: Mail,
    label: 'Email Us',
    value: 'support@artisannest.pk',
    sub: 'Reply within 24 hours',
    color: 'bg-blue-50 text-blue-500',
  },
  {
    icon: Phone,
    label: 'Call Us',
    value: '+92 300 000 0000',
    sub: 'Mon–Sat, 9am–6pm',
    color: 'bg-green-50 text-green-500',
  },
  {
    icon: Clock,
    label: 'Business Hours',
    value: 'Mon – Sat',
    sub: '9:00 AM – 6:00 PM PKT',
    color: 'bg-amber-50 text-amber-500',
  },
]

const FAQS = [
  { q: 'How do I track my order?', a: 'Once your order ships, you\'ll receive a tracking link via email. You can also check your order status in your account dashboard.' },
  { q: 'Can I return a product?', a: 'Yes! We offer easy returns within 7 days of delivery for most items. Contact us or visit your orders page to initiate a return.' },
  { q: 'How do I become a seller?', a: 'Register for a Seller account and submit your first product for review. Our team approves listings within 24 hours.' },
  { q: 'Are products genuinely handmade?', a: 'Absolutely. Every seller on ArtisanNest agrees to our authenticity policy — all products must be handmade or handcrafted by the seller.' },
]

export default function ContactPage() {
  return (
    <>
      <NavbarWrapper />
      <main className="min-h-screen bg-[#FAF7F4] overflow-hidden">

        {/* Hero */}
        <section className="relative py-20 px-4 overflow-hidden">
          {/* Animated blobs */}
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#C8896A]/12 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#7D9B76]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#C8896A]/5 rounded-full blur-2xl" />

          <div className="relative max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#C8896A]/10 text-[#C8896A] text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
              <MessageCircle size={12} /> We&apos;re here to help
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#2D1F1A] mb-4 leading-tight">
              Get in <span className="text-[#C8896A]">Touch</span>
            </h1>
            <p className="text-[#9E8079] text-lg leading-relaxed max-w-xl mx-auto">
              Have a question, feedback, or need help with an order? We&apos;d love to hear from you.
            </p>
          </div>
        </section>

        {/* Info cards */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {INFO.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className="bg-white rounded-2xl border border-[#EAE3DC] p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${item.color}`}>
                    <Icon size={18} />
                  </div>
                  <p className="text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1">{item.label}</p>
                  <p className="font-semibold text-[#2D1F1A] text-sm">{item.value}</p>
                  <p className="text-xs text-[#C4AEA4] mt-0.5">{item.sub}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Main content: form + chat */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Contact form */}
            <div>
              <div className="mb-5">
                <h2 className="font-serif text-2xl font-bold text-[#2D1F1A] mb-1">Send us a Message</h2>
                <p className="text-sm text-[#9E8079]">Fill out the form below and we&apos;ll respond within 24 hours.</p>
              </div>
              <ContactForm />
            </div>

            {/* Direct chat CTA + quick help */}
            <div className="space-y-6">
              {/* Live chat card */}
              <div className="relative bg-linear-to-br from-[#C8896A] to-[#8B5E45] rounded-3xl p-7 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
                <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-10 -translate-x-10" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                    <MessageCircle size={22} className="text-white" />
                  </div>
                  <h3 className="font-serif text-xl font-bold mb-2">Chat with Support</h3>
                  <p className="text-white/75 text-sm leading-relaxed mb-5">
                    Need an instant answer? Open a live chat with our support team directly from the site.
                  </p>
                  <SupportChatButton />
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Package, label: 'Fast Shipping', sub: '2–5 business days' },
                  { icon: Shield, label: 'Secure Payments', sub: 'SSL encrypted' },
                  { icon: MessageCircle, label: '24h Support', sub: 'Quick replies' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="bg-white rounded-2xl border border-[#EAE3DC] p-4 text-center hover:shadow-sm transition-shadow">
                    <Icon size={20} className="text-[#C8896A] mx-auto mb-2" />
                    <p className="text-xs font-semibold text-[#2D1F1A]">{label}</p>
                    <p className="text-[10px] text-[#9E8079] mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl font-bold text-[#2D1F1A] mb-2">Frequently Asked Questions</h2>
            <p className="text-sm text-[#9E8079]">Quick answers to common questions</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <details
                key={i}
                className="group bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden"
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none text-sm font-semibold text-[#2D1F1A] hover:text-[#C8896A] transition-colors select-none">
                  {faq.q}
                  <span className="w-5 h-5 rounded-full bg-[#F5F2EF] flex items-center justify-center shrink-0 text-[#9E8079] group-open:rotate-45 transition-transform duration-200 text-base font-normal leading-none">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-4 text-sm text-[#6B4C3B] leading-relaxed border-t border-[#F5EFE6]">
                  <div className="pt-3">{faq.a}</div>
                </div>
              </details>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
