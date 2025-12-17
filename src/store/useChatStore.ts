import { create } from 'zustand'

interface ChatTarget {
  id: string
  username: string
  avatar_url: string | null
}

interface ChatStore {
  isOpen: boolean
  targetUser: ChatTarget | null
  openChat: (user: ChatTarget) => void
  closeChat: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  targetUser: null,
  
  openChat: (user) => set({ isOpen: true, targetUser: user }),
  
  closeChat: () => set({ isOpen: false, targetUser: null }),
}))
