'use client'

import { useActionState } from 'react'
import { resolveComplaint } from '@/app/actions/complaint'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function ComplaintActions({ complaintId }: { complaintId: number }) {
  const [, resolveAction, resolvePending] = useActionState(resolveComplaint, undefined)
  const [, rejectAction, rejectPending] = useActionState(resolveComplaint, undefined)

  return (
    <div className="flex items-center gap-2 shrink-0">
      <form action={resolveAction}>
        <input type="hidden" name="complaintId" value={complaintId} />
        <input type="hidden" name="status" value="RESOLVED" />
        <button
          type="submit"
          disabled={resolvePending}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#7D9B76] text-white text-xs font-semibold rounded-xl hover:bg-[#6a8663] transition-all hover:shadow-sm disabled:opacity-60"
        >
          {resolvePending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />} Resolve
        </button>
      </form>
      <form action={rejectAction}>
        <input type="hidden" name="complaintId" value={complaintId} />
        <input type="hidden" name="status" value="REJECTED" />
        <button
          type="submit"
          disabled={rejectPending}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 text-rose-600 text-xs font-semibold rounded-xl hover:bg-rose-100 transition-all border border-rose-200 disabled:opacity-60"
        >
          {rejectPending ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />} Reject
        </button>
      </form>
    </div>
  )
}
