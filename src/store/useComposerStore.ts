import { create } from 'zustand'

interface ComposerDraft {
  content: string
  tags: string
  imageUrls: string[]
  locationName: string | null
  locationCoords: { lat: number; lng: number } | null
}

interface ComposerStore {
  draft: ComposerDraft | null
  setDraft: (draft: ComposerDraft) => void
  clearDraft: () => void
  hasDraft: boolean
}

export const useComposerStore = create<ComposerStore>((set, get) => ({
  draft: null,
  hasDraft: false,
  
  setDraft: (draft) => set({ draft, hasDraft: true }),
  
  clearDraft: () => set({ draft: null, hasDraft: false }),
}))
