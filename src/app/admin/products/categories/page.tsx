import { prisma } from '@/lib/prisma'
import { createCategory, deleteCategory } from '@/app/actions/admin'
import { Tags, Plus, Trash2 } from 'lucide-react'

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Categories</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">{categories.length} categories</p>
      </div>

      {/* Add category */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
        <h2 className="font-semibold text-[#2D1F1A] mb-4">Add New Category</h2>
        <form action={createCategory} className="flex gap-3">
          <input
            name="name"
            required
            placeholder="Category name…"
            className="flex-1 px-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A]"
          />
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#b3775a] transition-colors shrink-0"
          >
            <Plus size={16} /> Add
          </button>
        </form>
      </div>

      {/* Category list */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE3DC]">
          <h2 className="font-semibold text-[#2D1F1A]">All Categories</h2>
        </div>
        {categories.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-[#9E8079]">No categories yet</p>
        ) : (
          <ul className="divide-y divide-[#F5EFE6]">
            {categories.map((cat) => (
              <li key={cat.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-[#FDF8F4] transition-colors">
                <div className="w-9 h-9 rounded-xl bg-[#C8896A]/10 flex items-center justify-center shrink-0">
                  <Tags size={16} className="text-[#C8896A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#2D1F1A]">{cat.name}</p>
                  <p className="text-xs text-[#9E8079]">{cat._count.products} product{cat._count.products !== 1 ? 's' : ''}</p>
                </div>
                {cat._count.products === 0 && (
                  <form action={deleteCategory}>
                    <input type="hidden" name="categoryId" value={cat.id} />
                    <button
                      type="submit"
                      className="p-2 text-[#C4AEA4] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete category"
                    >
                      <Trash2 size={15} />
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
