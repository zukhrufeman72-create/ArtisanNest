import { prisma } from '@/lib/prisma'
import { createCategory, deleteCategory } from '@/app/actions/admin'
import { Tags, Plus, Trash2, Package, Grid3X3, TrendingUp } from 'lucide-react'

const CARD_COLORS = [
  { bg: 'bg-linear-to-br from-orange-50 to-amber-100', icon: 'bg-orange-100 text-orange-600', badge: 'bg-orange-100 text-orange-700', border: 'border-orange-200/60', dot: 'bg-orange-400' },
  { bg: 'bg-linear-to-br from-purple-50 to-pink-100', icon: 'bg-purple-100 text-purple-600', badge: 'bg-purple-100 text-purple-700', border: 'border-purple-200/60', dot: 'bg-purple-400' },
  { bg: 'bg-linear-to-br from-teal-50 to-emerald-100', icon: 'bg-teal-100 text-teal-600', badge: 'bg-teal-100 text-teal-700', border: 'border-teal-200/60', dot: 'bg-teal-400' },
  { bg: 'bg-linear-to-br from-blue-50 to-indigo-100', icon: 'bg-blue-100 text-blue-600', badge: 'bg-blue-100 text-blue-700', border: 'border-blue-200/60', dot: 'bg-blue-400' },
  { bg: 'bg-linear-to-br from-rose-50 to-pink-100', icon: 'bg-rose-100 text-rose-600', badge: 'bg-rose-100 text-rose-700', border: 'border-rose-200/60', dot: 'bg-rose-400' },
  { bg: 'bg-linear-to-br from-yellow-50 to-amber-100', icon: 'bg-yellow-100 text-yellow-600', badge: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200/60', dot: 'bg-yellow-400' },
  { bg: 'bg-linear-to-br from-cyan-50 to-sky-100', icon: 'bg-cyan-100 text-cyan-600', badge: 'bg-cyan-100 text-cyan-700', border: 'border-cyan-200/60', dot: 'bg-cyan-400' },
  { bg: 'bg-linear-to-br from-lime-50 to-green-100', icon: 'bg-lime-100 text-lime-600', badge: 'bg-lime-100 text-lime-700', border: 'border-lime-200/60', dot: 'bg-lime-400' },
]

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  })

  const totalProducts = categories.reduce((sum, c) => sum + c._count.products, 0)
  const activeCategories = categories.filter((c) => c._count.products > 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Categories</h1>
          <p className="text-sm text-[#9E8079] mt-0.5">Manage your product categories</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Grid3X3, label: 'Total Categories', value: categories.length, color: 'text-[#C8896A]', bg: 'bg-[#C8896A]/10' },
          { icon: Package, label: 'Total Products', value: totalProducts, color: 'text-[#7D9B76]', bg: 'bg-[#7D9B76]/10' },
          { icon: TrendingUp, label: 'Active Categories', value: activeCategories, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#EAE3DC] p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-xs text-[#9E8079] font-medium">{label}</p>
              <p className="text-xl font-bold text-[#2D1F1A]">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add category */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#EAE3DC] flex items-center gap-2 bg-[#F5F2EF]/50">
          <Plus size={15} className="text-[#C8896A]" />
          <p className="text-xs font-semibold text-[#6B4C3B] uppercase tracking-wide">Add New Category</p>
        </div>
        <div className="p-5">
          <form action={createCategory} className="flex gap-3">
            <div className="relative flex-1">
              <Tags size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8079]" />
              <input
                name="name"
                required
                placeholder="e.g. Handwoven Baskets, Wood Carving…"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A] transition-all"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#b3775a] transition-all hover:shadow-md hover:-translate-y-px shrink-0"
            >
              <Plus size={15} /> Create Category
            </button>
          </form>
        </div>
      </div>

      {/* Category grid */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#C8896A]/10 flex items-center justify-center mx-auto mb-4">
            <Tags size={28} className="text-[#C8896A]" />
          </div>
          <p className="font-semibold text-[#2D1F1A]">No categories yet</p>
          <p className="text-sm text-[#9E8079] mt-1">Create your first category above to get started.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#6B4C3B]">All Categories ({categories.length})</p>
            <p className="text-xs text-[#9E8079]">Only empty categories can be deleted</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((cat, i) => {
              const colors = CARD_COLORS[i % CARD_COLORS.length]
              const isEmpty = cat._count.products === 0
              return (
                <div
                  key={cat.id}
                  className={`group relative rounded-2xl border ${colors.border} ${colors.bg} p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Product count badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${colors.icon} flex items-center justify-center`}>
                      <Tags size={18} />
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
                      {cat._count.products} {cat._count.products === 1 ? 'product' : 'products'}
                    </span>
                  </div>

                  {/* Category name */}
                  <h3 className="font-semibold text-[#2D1F1A] text-sm leading-snug mb-1">{cat.name}</h3>
                  <p className="text-xs text-[#9E8079]">
                    Added {new Date(cat.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>

                  {/* Activity bar */}
                  <div className="mt-4 h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors.dot} rounded-full transition-all duration-500`}
                      style={{ width: totalProducts > 0 ? `${Math.min((cat._count.products / Math.max(totalProducts, 1)) * 100 * 3, 100)}%` : '0%' }}
                    />
                  </div>

                  {/* Delete button — only for empty categories */}
                  {isEmpty && (
                    <form action={deleteCategory} className="mt-3">
                      <input type="hidden" name="categoryId" value={cat.id} />
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors font-medium border border-rose-100"
                        title="Delete empty category"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </form>
                  )}

                  {/* Occupied indicator */}
                  {!isEmpty && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-[#9E8079]">
                      <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      Active with {cat._count.products} listing{cat._count.products !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
