'use client'

import { useState, useEffect } from 'react'
import { Share, X } from 'lucide-react'

export default function IOSInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(ios)

    // Detect standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    // Show if iOS and NOT standalone
    // Add a small delay/logic to not annoy immediately? 
    // Or check localStorage if dismissed
    const hasDismissed = localStorage.getItem('ios-install-prompt-dismissed')
    
    if (ios && !standalone && !hasDismissed) {
        // Show after 3 seconds
        const timer = setTimeout(() => setIsVisible(true), 3000)
        return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
      setIsVisible(false)
      localStorage.setItem('ios-install-prompt-dismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md border border-zinc-200 p-4 rounded-2xl shadow-xl z-50 animate-in slide-in-from-bottom duration-500">
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-600"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex gap-4">
        <div className="shrink-0 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">
           📱
        </div>
        <div className="flex-1">
           <h3 className="font-bold text-zinc-900 mb-1">安装到主屏幕</h3>
           <p className="text-sm text-zinc-600 leading-relaxed">
             点击底部工具栏的 <Share className="w-4 h-4 inline mx-1" /> 分享按钮，
             然后选择 "添加到主屏幕"。
           </p>
        </div>
      </div>
      
      {/* Little triangle pointing down to Safari toolbar if possible? Hard to position perfectly. */}
    </div>
  )
}
