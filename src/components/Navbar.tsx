'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Utensils } from 'lucide-react'

export default function Navbar() {
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-md border-b border-zinc-100 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-orange-500 font-bold text-lg cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Utensils className="w-5 h-5" />
          <span>FoodMemo</span>
        </div>
        
        <button 
          onClick={handleLogout}
          className="p-2 text-zinc-400 hover:text-zinc-800 transition-colors rounded-full hover:bg-zinc-100"
          title="登出"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  )
}
