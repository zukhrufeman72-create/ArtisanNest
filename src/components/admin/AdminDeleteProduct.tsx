'use client'

import { useState, useTransition } from 'react'
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react'
import { adminDeleteProduct } from '@/app/actions/admin'

export default function AdminDeleteProduct({ productId, productName }: { productId: number; productName: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    const fd = new FormData()
    fd.append('productId', String(productId))
    startTransition(async () => {
      await adminDeleteProduct(fd)
      setOpen(false)
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 text-[#9E8079] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
        title="Delete product"
      >
        <Trash2 size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => !isPending && setOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-[#EAE3DC]">
            <button
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="absolute top-4 right-4 p-1 text-[#9E8079] hover:text-[#2D1F1A] transition-colors"
            >
              <X size={16} />
            </button>

            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={26} className="text-rose-500" />
            </div>

            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-[#2D1F1A] mb-2">Delete Product?</h2>
              <p className="text-sm text-[#9E8079] leading-relaxed">
                You are about to permanently delete{' '}
                <strong className="text-[#2D1F1A]">&ldquo;{productName}&rdquo;</strong>.
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 py-2.5 text-sm font-semibold text-[#6B4C3B] bg-[#F5F2EF] hover:bg-[#EAE3DC] rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <><Loader2 size={14} className="animate-spin" /> Deleting…</>
                ) : (
                  <><Trash2 size={14} /> Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
