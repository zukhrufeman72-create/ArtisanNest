'use client'

import { useState, useTransition } from 'react'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { deleteUser } from '@/app/actions/complaint'

type Props = { userId: number; userName: string }

export default function DeleteUserButton({ userId, userName }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    setError('')
    const fd = new FormData()
    fd.append('userId', String(userId))
    startTransition(async () => {
      const result = await deleteUser(undefined, fd)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 text-[#C4AEA4] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
        title="Remove seller"
      >
        <Trash2 size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isPending && setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-[#EAE3DC] p-6 w-full max-w-sm">
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle size={22} className="text-rose-500" />
              </div>
              <div>
                <p className="font-semibold text-[#2D1F1A]">Remove Seller</p>
                <p className="text-sm text-[#9E8079] mt-1">
                  Delete <span className="font-semibold text-[#2D1F1A]">{userName}</span> and all their products? This cannot be undone.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 py-2.5 border border-[#EAE3DC] text-[#6B4C3B] text-sm font-semibold rounded-xl hover:bg-[#F5F2EF] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
