'use client'

import MessengerPanel from './MessengerPanel'

type Props = {
  currentUserId: number | null
  currentUserRole: string | null
}

export default function MessengerPanelWrapper({ currentUserId, currentUserRole }: Props) {
  return <MessengerPanel currentUserId={currentUserId} currentUserRole={currentUserRole} />
}
