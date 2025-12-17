import { create } from 'zustand'

interface FollowStore {
  // Map of userId -> isFollowing boolean
  followingMap: Record<string, boolean>
  
  // Actions
  setFollowStatus: (userId: string, isFollowing: boolean) => void
  isFollowingUser: (userId: string) => boolean
}

export const useFollowStore = create<FollowStore>((set, get) => ({
  followingMap: {},

  setFollowStatus: (userId, isFollowing) => set((state) => ({
    followingMap: { ...state.followingMap, [userId]: isFollowing }
  })),

  isFollowingUser: (userId) => !!get().followingMap[userId],
}))
