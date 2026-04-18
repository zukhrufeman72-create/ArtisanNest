'use client'

export default function SupportChatButton() {
  function openChat() {
    // Opens chat drawer with admin/support (admin userId=1 by convention)
    // If not logged in, will trigger auth modal via ChatDrawer
    window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'login' } }))
  }

  return (
    <button
      onClick={openChat}
      className="inline-flex items-center gap-2 bg-white text-[#C8896A] text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-white/90 transition-all hover:shadow-md"
    >
      Start Live Chat →
    </button>
  )
}
