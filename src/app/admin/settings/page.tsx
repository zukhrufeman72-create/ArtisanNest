import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { updateAdminProfile } from '@/app/actions/admin-settings'
import { User, Lock, Shield } from 'lucide-react'

export default async function SettingsPage() {
  const session = await verifySession()
  const admin = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, createdAt: true },
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2D1F1A]">Settings</h1>
        <p className="text-sm text-[#9E8079] mt-0.5">Manage your admin account</p>
      </div>

      {/* Profile section */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center gap-2">
          <User size={16} className="text-[#C8896A]" />
          <h2 className="font-semibold text-[#2D1F1A]">Profile Information</h2>
        </div>
        <form action={updateAdminProfile} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
              Full Name
            </label>
            <input
              name="name"
              defaultValue={admin?.name}
              required
              className="w-full px-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              defaultValue={admin?.email}
              required
              className="w-full px-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A]"
            />
          </div>
          <div className="pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#b3775a] transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center gap-2">
          <Lock size={16} className="text-[#C8896A]" />
          <h2 className="font-semibold text-[#2D1F1A]">Change Password</h2>
        </div>
        <form action={updateAdminProfile} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
              Current Password
            </label>
            <input
              name="currentPassword"
              type="password"
              className="w-full px-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#9E8079] uppercase tracking-wide mb-1.5">
              New Password
            </label>
            <input
              name="newPassword"
              type="password"
              className="w-full px-4 py-2.5 text-sm bg-[#F5F2EF] border border-[#EAE3DC] rounded-xl text-[#2D1F1A] focus:outline-none focus:ring-2 focus:ring-[#C8896A]/30 focus:border-[#C8896A]"
            />
          </div>
          <div className="pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#C8896A] text-white text-sm font-semibold rounded-xl hover:bg-[#b3775a] transition-colors"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-[#C8896A]" />
          <h2 className="font-semibold text-[#2D1F1A]">Account Details</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[#9E8079]">Role</span>
            <span className="font-semibold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full text-xs">Administrator</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9E8079]">Member since</span>
            <span className="font-medium text-[#2D1F1A]">
              {admin ? new Date(admin.createdAt).toLocaleDateString() : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
