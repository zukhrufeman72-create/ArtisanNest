import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireCustomer } from '@/lib/dal'

type Props = { params: Promise<{ orderId: string }> }

export default async function InvoicePage({ params }: Props) {
  const session = await requireCustomer()
  const { orderId } = await params
  const id = Number(orderId)
  if (isNaN(id)) notFound()

  const order = await prisma.order.findUnique({
    where: { id, userId: session.userId },
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, image: true } },
          variant: { select: { id: true, color: true, size: true } },
        },
      },
      transactions: { take: 1, orderBy: { createdAt: 'desc' } },
    },
  })
  if (!order) notFound()

  const invoiceNo = `INV-${String(order.id).padStart(6, '0')}`
  const total = order.totalPrice

  return (
    <div className="min-h-screen bg-white p-8 max-w-3xl mx-auto">
      {/* Print button — hidden in print */}
      <div className="print:hidden mb-6 flex gap-3">
        <button
          onClick={() => window.print()}
          className="px-5 py-2 bg-[#C8896A] text-white rounded-xl text-sm font-medium hover:bg-[#B8795A] transition-colors"
        >
          Print Invoice
        </button>
        <a
          href={`/orders/${order.id}`}
          className="px-5 py-2 bg-[#F5F0EB] text-[#2D1F1A] rounded-xl text-sm font-medium hover:bg-[#EAE3DC] transition-colors"
        >
          Back to Order
        </a>
      </div>

      {/* Invoice document */}
      <div className="border border-[#EAE3DC] rounded-2xl overflow-hidden print:border-0 print:rounded-none">
        {/* Header */}
        <div className="bg-[#2D1F1A] text-white p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#C8896A]">ArtisanNest</h1>
              <p className="text-white/60 text-sm mt-1">Handcrafted with love</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">INVOICE</p>
              <p className="text-white/60 text-sm mt-1">{invoiceNo}</p>
              <p className="text-white/60 text-sm">{new Date(order.createdAt).toLocaleDateString('en-PK', { dateStyle: 'long' })}</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Bill To */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-xs font-semibold text-[#9E8079] uppercase tracking-wider mb-2">Bill To</h4>
              <p className="font-semibold text-[#2D1F1A]">{order.user.name}</p>
              <p className="text-sm text-[#9E8079]">{order.user.email}</p>
              {order.customerPhone && <p className="text-sm text-[#9E8079]">{order.customerPhone}</p>}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#9E8079] uppercase tracking-wider mb-2">Payment Info</h4>
              {order.transactions[0] ? (
                <>
                  <p className="text-sm text-[#2D1F1A]">Method: {order.transactions[0].paymentMethod}</p>
                  <p className="text-sm text-[#9E8079]">Txn: {order.transactions[0].transactionId}</p>
                  <p className="text-sm text-[#9E8079]">Status: {order.transactions[0].paymentStatus}</p>
                </>
              ) : (
                <p className="text-sm text-[#9E8079]">COD</p>
              )}
              <p className="text-sm text-[#9E8079] mt-1">Order Status: {order.status}</p>
            </div>
          </div>

          {/* Shipping address */}
          {order.shippingAddress && (
            <div>
              <h4 className="text-xs font-semibold text-[#9E8079] uppercase tracking-wider mb-2">Ship To</h4>
              <p className="text-sm text-[#2D1F1A]">{order.shippingAddress}</p>
            </div>
          )}

          {/* Items table */}
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#EAE3DC]">
                  <th className="text-left py-2 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Item</th>
                  <th className="text-center py-2 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Qty</th>
                  <th className="text-right py-2 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Unit Price</th>
                  <th className="text-right py-2 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3">
                      <p className="font-medium text-[#2D1F1A] text-sm">{item.product.name}</p>
                      {item.variant && (
                        <p className="text-xs text-[#9E8079]">
                          {[item.variant.color, item.variant.size].filter(Boolean).join(' / ')}
                        </p>
                      )}
                    </td>
                    <td className="py-3 text-center text-sm text-[#2D1F1A]">{item.quantity}</td>
                    <td className="py-3 text-right text-sm text-[#2D1F1A]">PKR {item.price.toLocaleString()}</td>
                    <td className="py-3 text-right text-sm font-medium text-[#2D1F1A]">
                      PKR {(item.price * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#2D1F1A]">
                  <td colSpan={3} className="py-3 text-right font-bold text-[#2D1F1A]">Total</td>
                  <td className="py-3 text-right font-bold text-xl text-[#C8896A]">
                    PKR {total.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[#EAE3DC] text-center text-xs text-[#9E8079]">
            <p>Thank you for shopping with ArtisanNest. For support, contact us at support@artisannest.com</p>
            <p className="mt-1">This is a computer-generated invoice and does not require a signature.</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:border-0 { border: 0 !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
        }
      `}</style>
    </div>
  )
}
