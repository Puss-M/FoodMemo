'use client'

import { useState, useEffect } from 'react'
import { MapPin, X, Search } from 'lucide-react'

interface LocationPickerProps {
  onLocationSelect: (location: { name: string; address: string; lat: number; lng: number }) => void
  onClose: () => void
}

export default function LocationPicker({ onLocationSelect, onClose }: LocationPickerProps) {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    // 动态加载百度地图 SDK
    const script = document.createElement('script')
    script.src = `https://api.map.baidu.com/api?v=3.0&ak=${process.env.NEXT_PUBLIC_BAIDU_MAP_AK}&callback=initBaiduMap`
    script.async = true
    
    window.initBaiduMap = () => {
      setMapLoaded(true)
    }
    
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
      delete window.initBaiduMap
    }
  }, [])

  const handleSearch = async () => {
    if (!keyword.trim() || !mapLoaded) return
    
    setLoading(true)
    
    try {
      const localSearch = new window.BMap.LocalSearch('成都', {
        onSearchComplete: (results: any) => {
          if (localSearch.getStatus() === window.BMAP_STATUS_SUCCESS) {
            const pois = []
            for (let i = 0; i < results.getCurrentNumPois(); i++) {
              pois.push(results.getPoi(i))
            }
            setResults(pois)
          } else {
            setResults([])
          }
          setLoading(false)
        }
      })
      
      localSearch.search(keyword)
    } catch (error) {
      console.error('搜索失败:', error)
      setLoading(false)
    }
  }

  const handleSelect = (poi: any) => {
    onLocationSelect({
      name: poi.title,
      address: poi.address,
      lat: poi.point.lat,
      lng: poi.point.lng
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 flex items-center gap-3">
          <MapPin className="w-5 h-5 text-orange-500" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索地点（如：西南财经大学）"
            className="flex-1 outline-none text-lg"
            autoFocus
          />
          <button
            onClick={handleSearch}
            disabled={loading || !mapLoaded}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {loading ? '搜索中...' : '搜索'}
          </button>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {!mapLoaded && (
            <div className="text-center py-12 text-zinc-400">
              地图加载中...
            </div>
          )}
          
          {mapLoaded && results.length === 0 && !loading && (
            <div className="text-center py-12 text-zinc-400">
              {keyword ? '未找到相关地点' : '请输入地点名称搜索'}
            </div>
          )}

          <div className="space-y-2">
            {results.map((poi, index) => (
              <button
                key={index}
                onClick={() => handleSelect(poi)}
                className="w-full text-left p-4 hover:bg-orange-50 rounded-lg border border-zinc-100 hover:border-orange-200 transition-colors"
              >
                <div className="font-medium text-zinc-900">{poi.title}</div>
                <div className="text-sm text-zinc-500 mt-1">{poi.address}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

declare global {
  interface Window {
    BMap: any
    BMAP_STATUS_SUCCESS: any
    initBaiduMap: () => void
  }
}
