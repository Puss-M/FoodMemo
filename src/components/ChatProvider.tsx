'use client'

import { useChatStore } from '@/store/useChatStore'
import ChatWindow from '@/components/ChatWindow'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ChatProvider({ children }: { children: React.ReactNode }) {
  const { isOpen, targetUser, closeChat } = useChatStore()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    getUser()
  }, [supabase])

  return (
    <>
      {children}
      {isOpen && targetUser && currentUserId && (
        <ChatWindow
          currentUserId={currentUserId}
          targetUser={targetUser}
          onClose={closeChat}
        />
      )}
    </>
  )
}
