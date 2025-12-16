'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2, MapPin } from 'lucide-react'

// AMap Type Definitions (Simplified)
declare global {
  interface Window {
    AMap: any
    _AMapSecurityConfig: any
  }
}

interface Location {
  name: string
  address: string
  lat: number
  lng: number
}

interface LocationPickerProps {
  onSelect: (location: Location) => void
  onClose: () => void
}

export default function LocationPicker({ onSelect, onClose }: LocationPickerProps) {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [autoComplete, setAutoComplete] = useState<any>(null)

  useEffect(() => {
    // 1. Configure Security Code
    window._AMapSecurityConfig = {
      securityJsCode: process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE,
    }

    // 2. Load AMap Script
    const loader = new Promise((resolve, reject) => {
        if (window.AMap) {
            resolve(window.AMap)
            return
        }
        const script = document.createElement('script')
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${process.env.NEXT_PUBLIC_AMAP_KEY}&plugin=AMap.AutoComplete`
        script.async = true
        script.onload = () => resolve(window.AMap)
        script.onerror = reject
        document.head.appendChild(script)
    })

    loader.then((AMap: any) => {
        setMapLoaded(true)
        // Init AutoComplete Plugin
        const auto = new AMap.AutoComplete({
            city: '全国'
        })
        setAutoComplete(auto)
    }).catch(err => {
        console.error('AMap Load Error:', err)
    })

    return () => {
       // Cleanup if needed
    }
  }, [])

  const handleSearch = (val: string) => {
    setKeyword(val)
    if (!val.trim() || !autoComplete) return

    setLoading(true)
    autoComplete.search(val, (status: string, result: any) => {
        setLoading(false)
        if (status === 'complete' && result.tips) {
            const places = result.tips.map((tip: any) => ({
                name: tip.name,
                address: tip.district + tip.address,
                lat: tip.location?.lat,
                lng: tip.location?.lng
            })).filter((p: any) => p.lat && p.lng) // Filter out items without location
            setResults(places)
        } else {
            setResults([])
        }
    })
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="p-4 border-b border-zinc-100 flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                        type="text" 
                        value={keyword}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="搜索地点 (如: 光华村)"
                        autoFocus
                        className="w-full pl-9 pr-4 py-2 bg-zinc-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-zinc-800 placeholder:text-zinc-400"
                    />
                </div>
                <button 
                    onClick={onClose}
                    className="text-sm text-zinc-500 font-medium hover:text-zinc-800"
                >
                    取消
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2">
                {!mapLoaded && (
                    <div className="py-8 text-center text-zinc-400 text-sm flex flex-col items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        地图加载中...
                    </div>
                )}

                {mapLoaded && results.length === 0 && keyword && !loading && (
                    <div className="py-8 text-center text-zinc-400 text-sm">
                        未找到相关地点
                    </div>
                )}
                
                {results.map((place, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelect(place)}
                        className="w-full text-left p-3 hover:bg-zinc-50 rounded-xl transition-colors flex items-start gap-3 group"
                    >
                        <div className="mt-1 w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 group-hover:bg-orange-100 group-hover:scale-110 transition-all">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="font-medium text-zinc-900 text-[15px]">{place.name}</div>
                            <div className="text-xs text-zinc-400 mt-0.5 truncate max-w-[200px]">{place.address}</div>
                        </div>
                    </button>
                ))}
            </div>
            
             {/* Powered By */}
             <div className="p-2 text-center text-[10px] text-zinc-300 border-t border-zinc-50">
                Powered by 高德地图
             </div>
        </div>
    </div>
  )
}
