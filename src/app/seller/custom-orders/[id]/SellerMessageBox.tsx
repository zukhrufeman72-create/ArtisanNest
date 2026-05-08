'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'

type Message = {
  id: number
  message: string
  senderId: number
  senderName: string
  createdAt: string
}

type Props = {
  orderId: number
  currentUserId: number
  initialMessages: Message[]
}

export default function SellerMessageBox({ orderId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!text.trim()) return
    setError('')
    setSending(true)
    try {
      const res = await fetch(`/api/seller/custom-orders/${orderId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to send message.')
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: data.message.id,
            message: data.message.message,
            senderId: data.message.sender.id,
            senderName: data.message.sender.name,
            createdAt: data.message.createdAt,
          },
        ])
        setText('')
      }
    } catch {
      setError('Network error.')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 ? (
          <p className="text-sm text-[#9E8079] text-center py-8">No messages yet. Reach out to the customer.</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUserId
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${isMine ? 'order-2' : 'order-1'}`}>
                  {!isMine && <p className="text-[10px] text-[#9E8079] mb-1 ml-1">{msg.senderName}</p>}
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${
                    isMine
                      ? 'bg-[#7D9B76] text-white rounded-br-sm'
                      : 'bg-[#F5EFE6] text-[#2D1F1A] rounded-bl-sm border border-[#EAE3DC]'
                  }`}>
                    {msg.message}
                  </div>
                  <p className={`text-[10px] text-[#C4AEA4] mt-1 ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {new Date(msg.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex items-end gap-2 border border-[#EAE3DC] rounded-xl p-2 bg-[#F5EFE6]/30 focus-within:border-[#7D9B76] focus-within:ring-2 focus-within:ring-[#7D9B76]/10 transition-all">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Type a message… (Enter to send)"
          className="flex-1 bg-transparent text-sm text-[#2D1F1A] resize-none focus:outline-none placeholder:text-[#C4AEA4] px-1"
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim() || sending}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#7D9B76] hover:bg-[#5E7E5A] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors shrink-0"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  )
}
