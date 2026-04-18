import { prisma } from '@/lib/prisma'
import { Users, UserCheck, UserX, Search } from 'lucide-react'

export default async function AllUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>
}) {
  const { role, q } = await searchParams

  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role: role as 'ADMIN' | 'SELLER' | 'CUSTOMER' } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true, isVerified: true, createdAt: true },
  })

  const counts = await prisma.user.groupBy({ by: ['role'], _count: true })
  const countMap = Object.fromEntries(counts.map((c) => [c.role, c._count]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">All Users</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">Manage all registered users</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: users.length + (role || q ? '…' : ''), color: 'text-blue-600 bg-blue-50', icon: Users },
          { label: 'Sellers', value: countMap['SELLER'] ?? 0, color: 'text-[#C8896A] bg-[#C8896A]/10', icon: UserCheck },
          { label: 'Customers', value: countMap['CUSTOMER'] ?? 0, color: 'text-[#7D9B76] bg-[#7D9B76]/10', icon: Users },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-[#EAE3DC] p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#2D1F1A]">{s.value}</p>
                <p className="text-sm text-[#9E8079]">{s.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        {/* Filters */}
        <div className="px-5 py-4 border-b border-[#EAE3DC] flex flex-wrap gap-3 items-center">
          <form className="flex-1 min-w-[180px] max-w-xs">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8079]" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search name or email…"
                className="w-full pl-8 pr-3 py-2 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] placeholder-[#C4AEA4] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A]"
              />
            </div>
          </form>
          <div className="flex gap-2">
            {['', 'ADMIN', 'SELLER', 'CUSTOMER'].map((r) => (
              <a
                key={r}
                href={r ? `?role=${r}` : '?'}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  role === r || (!role && r === '')
                    ? 'bg-[#C8896A] text-white'
                    : 'bg-[#F5F2EF] text-[#6B4C3B] hover:bg-[#EAE3DC]'
                }`}
              >
                {r || 'All'}
              </a>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F2EF] text-left">
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">#</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Name</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Email</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Role</th>
                <th className="px-5 py-3 text-xs font-semibold text-[#9E8079] uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EFE6]">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-[#9E8079]">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user, i) => (
                  <tr key={user.id} className="hover:bg-[#FDF8F4] transition-colors">
                    <td className="px-5 py-3.5 text-[#C4AEA4] text-xs">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#C8896A]/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-[#C8896A]">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-[#2D1F1A]">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#9E8079]">{user.email}</td>
                    <td className="px-5 py-3.5">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-5 py-3.5 text-[#9E8079] text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    SELLER: 'bg-[#C8896A]/10 text-[#C8896A]',
    CUSTOMER: 'bg-[#7D9B76]/10 text-[#7D9B76]',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${map[role] ?? 'bg-gray-100 text-gray-600'}`}>
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </span>
  )
}
