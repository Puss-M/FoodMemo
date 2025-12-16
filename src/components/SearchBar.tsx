'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

const CUISINES = ['川菜', '火锅', '烧烤', '小吃', '饮品', '食堂', '西餐']

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')

  const activeCuisine = searchParams.get('cuisine')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/?q=${encodeURIComponent(searchTerm)}`)
    } else {
      router.push('/')
    }
  }

  const handleCuisineClick = (cuisine: string) => {
    if (activeCuisine === cuisine) {
      // Clear filter
      router.push('/')
    } else {
      router.push(`/?cuisine=${encodeURIComponent(cuisine)}`)
    }
  }

  return (
    <div className="mb-6 space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索评价内容..."
          className="w-full pl-12 pr-20 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-zinc-800 placeholder:text-zinc-400"
        />
        <button
          type="submit"
          disabled={!searchTerm.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          搜索
        </button>
      </form>

      {/* Cuisine Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => router.push('/')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            !activeCuisine && !searchParams.get('tag') && !searchParams.get('q')
              ? 'bg-orange-500 text-white'
              : 'bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200'
          }`}
        >
          全部
        </button>
        {CUISINES.map((cuisine) => (
          <button
            key={cuisine}
            onClick={() => handleCuisineClick(cuisine)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCuisine === cuisine
                ? 'bg-orange-500 text-white'
                : 'bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200'
            }`}
          >
            {cuisine}
          </button>
        ))}
      </div>
    </div>
  )
}
