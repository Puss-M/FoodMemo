'use client'

import { Home, PlusCircle, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNavbar() {
  const pathname = usePathname()

  const handlePublishClick = () => {
    // Dispatch custom event to trigger Publisher focus
    window.dispatchEvent(new Event('focus-publisher'))
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 h-16 md:hidden z-50 px-4 flex items-center justify-around shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
      <Link href="/" className={`flex flex-col items-center gap-1 ${pathname === '/' ? 'text-orange-500' : 'text-zinc-400'}`}>
        <Home className="w-6 h-6" />
        <span className="text-[10px] font-medium">首页</span>
      </Link>

      <Link href="/guidelines" className={`flex flex-col items-center gap-1 ${pathname === '/guidelines' ? 'text-orange-500' : 'text-zinc-400'}`}>
        <span className="text-2xl">📜</span>
        <span className="text-[10px] font-medium">须知</span>
      </Link>

      <button 
        onClick={handlePublishClick}
        className="relative -top-5 bg-orange-500 text-white p-3 rounded-full shadow-lg shadow-orange-200 hover:scale-105 transition-transform"
      >
        <PlusCircle className="w-7 h-7" />
      </button>

      <Link href="/profile" className={`flex flex-col items-center gap-1 ${pathname === '/profile' ? 'text-orange-500' : 'text-zinc-400'}`}>
        <User className="w-6 h-6" />
        <span className="text-[10px] font-medium">我的</span>
      </Link>
    </nav>
  )
}
