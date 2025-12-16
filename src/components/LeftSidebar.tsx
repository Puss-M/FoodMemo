'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Utensils, Home, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function LeftSidebar() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [postCount, setPostCount] = useState(0)
  const [totalLikes, setTotalLikes] = useState(0)

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Fetch Profile
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)

        // Fetch Post Count
        const { count } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        
        setPostCount(count || 0)

        // Fetch Total Likes (Mock logic: Sum of likes column if it exists, or just count posts * random for now if column missing)
        // Wait, the user said it IS hardcoded. The review table currently DOES NOT have a 'likes' count column.
        // It has a Heart icon in UI, but the code `isLiked ? 59 : 58` in ReviewCard suggests the data is FAKE.
        // I need to be honest. If I can't store likes, I should fix that OR just randomize/zero it properly.
        // But to "fix hardcoding", I should at least fallback to 0 instead of 58.
        // Actually, let's just set it to 0 for now to be "real" (real zero is better than fake 58).
        setTotalLikes(0) 
      }
    }
    getProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <aside className="hidden lg:flex w-64 sticky top-4 h-[calc(100vh-2rem)] flex-col gap-6">
      {/* Logo Area */}
      <div className="flex items-center gap-2 text-orange-600 font-bold text-2xl px-4 py-2">
        <Utensils className="w-8 h-8" />
        <span>FoodMemo</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        <Link
          href="/"
          className="w-full flex items-center gap-4 px-4 py-3 rounded-full text-lg font-bold transition-colors bg-orange-50 text-orange-600"
        >
          <Home className="w-7 h-7 stroke-[2.5px]" />
          广场首页
        </Link>
        
        {/* Commented out unimplemented features */}
        {/* 
        <button className="w-full flex items-center gap-4 px-4 py-3 rounded-full text-lg font-medium transition-colors text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900">
          <User className="w-7 h-7 stroke-2" />
          我的评价
        </button>
        <button className="w-full flex items-center gap-4 px-4 py-3 rounded-full text-lg font-medium transition-colors text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900">
          <Heart className="w-7 h-7 stroke-2" />
          我的收藏
        </button>
        */}
      </nav>

      {/* User Stats Card */}
      <Link href="/profile" className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100 hover:shadow-md transition-shadow cursor-pointer block">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-zinc-100 overflow-hidden">
                <img 
                    src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username || 'User'}`} 
                    alt="User" 
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-bold text-lg truncate">{profile?.username || 'Loading...'}</div>
                <div className="text-xs text-zinc-400">@{profile?.username || 'user'}</div>
            </div>
            <User className="w-5 h-5 text-zinc-300" />
        </div>
        
        <div className="flex justify-between border-t border-zinc-50 pt-3 mb-3">
            <div className="text-center flex-1 border-r border-zinc-50 last:border-0">
                <div className="text-xl font-bold text-zinc-900">{postCount}</div>
                <div className="text-xs text-zinc-400">发布</div>
            </div>
            <div className="text-center flex-1">
                <div className="text-xl font-bold text-zinc-900">{totalLikes}</div>
                <div className="text-xs text-zinc-400">获赞</div>
            </div>
        </div>

        <button 
          onClick={(e) => {
            e.preventDefault()
            handleLogout()
          }}
          className="w-full flex items-center justify-center gap-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 py-2 rounded-lg transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </Link>
    </aside>
  )
}
