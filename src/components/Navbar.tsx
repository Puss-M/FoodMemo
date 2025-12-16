'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Utensils } from 'lucide-react'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const supabase = createClient()
  const router = useRouter()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, username')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setAvatarUrl(profile.avatar_url)
          setUsername(profile.username)
        }
      }
    }
    getProfile()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-md border-b border-zinc-100 flex items-center justify-center z-50 lg:hidden">
      <div className="w-full max-w-2xl px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-orange-600 font-bold text-lg cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Utensils className="w-5 h-5" />
          <span>FoodMemo</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* User Avatar */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center overflow-hidden">
               {avatarUrl ? (
                 <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-zinc-500 text-sm font-bold">{username?.[0]?.toUpperCase() || 'U'}</span>
               )}
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="p-2 text-zinc-400 hover:text-zinc-800 transition-colors rounded-full hover:bg-zinc-100"
            title="登出"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  )
}
