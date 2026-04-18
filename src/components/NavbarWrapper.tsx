import { getOptionalSession } from '@/lib/dal'
import Navbar from './Navbar'

export default async function NavbarWrapper() {
  const session = await getOptionalSession()
  return (
    <Navbar
      user={session ? { role: session.role } : null}
    />
  )
}
