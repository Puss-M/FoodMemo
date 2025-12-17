'use client'

import { useState, useEffect } from 'react'
import { Share, X, Download } from 'lucide-react'

export default function IOSInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(ios)

    // Detect standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    // Handle Android/Desktop beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault()
        setDeferredPrompt(e)
        // Show install prompt if not standalone
        if (!standalone) {
            setIsVisible(true) 
        }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check dismissed state for iOS only (Android prompt we want to show if available)
    const hasDismissed = localStorage.getItem('pwa-install-prompt-dismissed')
    
    // Logic for showing
    if (ios && !standalone && !hasDismissed) {
        // Show iOS prompt after delay
        const timer = setTimeout(() => setIsVisible(true), 3000)
        return () => {
            clearTimeout(timer)
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleDismiss = () => {
      setIsVisible(false)
      localStorage.setItem('pwa-install-prompt-dismissed', 'true')
  }

  const handleInstallClick = async () => {
      if (!deferredPrompt) return

      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
          setIsVisible(false)
      }
      setDeferredPrompt(null)
  }

  if (!isVisible) return null

  // Android / Desktop Install Button
  if (deferredPrompt) {
      return (
        <div className="fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-500">
            <div className="bg-zinc-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden">
                        <img src="/icons/icon-192.png" alt="App Icon" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">安装 FoodMemo</h3>
                        <p className="text-zinc-400 text-xs">添加到主屏幕，体验更佳</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleDismiss}
                        className="text-zinc-400 hover:text-white p-2"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleInstallClick}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        安装
                    </button>
                </div>
            </div>
        </div>
      )
  }

  // iOS Instructions (Enhanced Visibility)
  if (isIOS) {
      return (
        <div className="fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-500">
             {/* Main Card */}
            <div className="bg-white/95 backdrop-blur-md border border-zinc-200 p-5 rounded-2xl shadow-2xl relative">
                <button 
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 p-1"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex gap-4">
                    <div className="shrink-0 w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100 overflow-hidden shadow-sm">
                        <img src="/icons/icon-192.png" alt="App Icon" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-zinc-900 text-lg mb-1">添加到主屏幕</h3>
                        <p className="text-sm text-zinc-600 leading-snug">
                            为了获得最佳体验，请点击底部的 <Share className="w-4 h-4 inline-block text-blue-500" /> 分享按钮，然后选择 
                            <span className="font-bold text-zinc-800 mx-1">"添加到主屏幕"</span>
                            <span className="inline-block border border-zinc-300 rounded px-1 text-xs bg-zinc-50 ml-1">➕</span>
                        </p>
                    </div>
                </div>
                
                {/* Visual Arrow Indicator (optional, tricky to position perfectly across devices) */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-zinc-200"></div>
            </div>
        </div>
      )
  }

  return null
}
