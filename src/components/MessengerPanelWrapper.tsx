'use client'

import MessengerPanel from './MessengerPanel'

type Props = { currentUserId: number | null }

export default function MessengerPanelWrapper({ currentUserId }: Props) {
  return <MessengerPanel currentUserId={currentUserId} />
}
