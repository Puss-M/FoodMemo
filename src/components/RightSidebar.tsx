'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function RightSidebar() {
  const supabase = createClient()
  const [trendingTags, setTrendingTags] = useState<{label: string, count: number, color: string}[]>([])
  const [topFoodies, setTopFoodies] = useState<{name: string, seed: string, desc: string, postCount: number}[]>([])

  useEffect(() => {
    fetchTrendingTags()
    fetchTopFoodies()
  }, [])

  const fetchTrendingTags = async () => {
    // Fetch all reviews and count tag frequencies
    const { data: reviews } = await supabase
      .from('reviews')
      .select('tags')
      .not('tags', 'is', null)

    if (!reviews) return

    // Count tag occurrences
    const tagCounts: Record<string, number> = {}
    reviews.forEach((review: any) => {
      review.tags?.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    // Sort and take top 5
    const sorted = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count], idx) => ({
        label: tag,
        count,
        color: ['bg-red-50 text-red-600', 'bg-orange-50 text-orange-600', 'bg-blue-50 text-blue-600', 'bg-purple-50 text-purple-600', 'bg-zinc-100 text-zinc-600'][idx] || 'bg-zinc-100 text-zinc-600'
      }))

    setTrendingTags(sorted)
  }

  const fetchTopFoodies = async () => {
    // Get top 3 users by post count
    const { data: reviews } = await supabase
      .from('reviews')
      .select('user_id, profiles(username)')

    if (!reviews) return

    // Count posts per user
    const userCounts: Record<string, {username: string, count: number}> = {}
    reviews.forEach((review: any) => {
      const username = review.profiles?.username || 'Unknown'
      if (!userCounts[username]) {
        userCounts[username] = { username, count: 0 }
      }
      userCounts[username].count++
    })

    // Sort and take top 3
    const sorted = Object.values(userCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(user => ({
        name: user.username,
        seed: user.username,
        desc: `${user.count}道菜`,
        postCount: user.count
      }))

    setTopFoodies(sorted)
  }

  return (
    <aside className="hidden lg:flex w-80 sticky top-4 h-fit flex-col gap-4">
      {/* Discovery Zone */}
      <h3 className="font-bold text-zinc-400 text-sm px-1">吃货风向标</h3>
      
      {/* Trending Tags */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
        <h4 className="font-bold text-zinc-900 mb-3 text-base">🏷️ 热门标签</h4>
        <div className="flex flex-wrap gap-2">
          {trendingTags.length > 0 ? (
            trendingTags.map((tag) => (
              <Link
                key={tag.label}
                href={`/?tag=${encodeURIComponent(tag.label)}`}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-transform hover:scale-105 ${tag.color}`}
              >
                {tag.label}
              </Link>
            ))
          ) : (
            <p className="text-sm text-zinc-400">暂无热门标签</p>
          )}
        </div>
      </div>

       {/* Top Foodies */}
       <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
        <h4 className="font-bold text-zinc-900 mb-4 text-base">🏆 活跃吃货榜</h4>
        <div className="space-y-4">
          {topFoodies.length > 0 ? (
            topFoodies.map((user) => (
              <div key={user.name} className="flex items-center gap-3 group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden ring-2 ring-transparent group-hover:ring-orange-200 transition-all">
                  <img 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.seed}`} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-zinc-900">{user.name}</div>
                  <div className="text-xs text-zinc-400">{user.desc}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-400">暂无数据</p>
          )}
        </div>
      </div>

       {/* Announcement (Optional) */}
       <div className="bg-linear-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
          <h4 className="font-bold text-orange-800 mb-1 text-sm">📢 圈子公告</h4>
          <p className="text-xs text-orange-700/80 leading-relaxed">
            本周五二食堂二楼有新窗口试吃活动，凭学生证免费领取！
          </p>
       </div>
    </aside>
  )
}
