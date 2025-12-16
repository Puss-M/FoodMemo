'use client'

import { useState, useEffect } from 'react'
import { Calendar, LayoutGrid, Heart, Bookmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ReviewCard from '@/components/ReviewCard'

export default function ProfileView({ profile, stats, userId }: any) {
    const supabase = createClient()
    const [activeTab, setActiveTab] = useState<'posts' | 'likes' | 'saved'>('posts')
    const [reviews, setReviews] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Format date
    const joinedDate = profile?.created_at 
        ? new Date(profile.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
        : '未知时间'

    useEffect(() => {
        async function fetchReviews() {
            setLoading(true)
            let query = supabase.from('reviews').select('*, profiles(username, avatar_url)').order('created_at', { ascending: false })
            
            if (activeTab === 'posts') {
                query = query.eq('user_id', userId)
            } else if (activeTab === 'likes') {
                // Join likes: get reviews I liked. 
                // Supabase JS doesn't support easy "join table" filtering in one go for "reviews where id in (select review_id from likes)". 
                // We'll filter via manual subquery logic or use `fm_likes!inner(user_id)` if we set up foreign keys correctly. 
                // Simplified approach: Fetch likes first (IDs) then fetch reviews. Or use a view/RPC.
                // Revert to fetching IDs first for v7.0 without complex schema changes.
                const { data: likes } = await supabase.from('fm_likes').select('review_id').eq('user_id', userId)
                if (likes && likes.length > 0) {
                     const ids = likes.map(l => l.review_id)
                     query = query.in('id', ids)
                } else {
                    setReviews([])
                    setLoading(false)
                    return
                }
            } else if (activeTab === 'saved') {
                const { data: bookmarks } = await supabase.from('fm_bookmarks').select('review_id').eq('user_id', userId)
                if (bookmarks && bookmarks.length > 0) {
                     const ids = bookmarks.map(b => b.review_id)
                     query = query.in('id', ids)
                } else {
                    setReviews([])
                    setLoading(false)
                    return
                }
            }

            const { data, error } = await query
            if (data) setReviews(data)
            setLoading(false)
        }

        fetchReviews()
    }, [activeTab, userId, supabase])

    return (
        <div>
            {/* User Profile Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 mb-6 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-orange-100 mb-4 overflow-hidden border-4 border-white shadow-lg">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-orange-400 text-3xl font-bold">
                            {profile?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                    )}
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 mb-1">{profile?.username || '未命名用户'}</h1>
                <div className="flex items-center gap-1.5 text-zinc-500 text-sm mb-6">
                    <Calendar className="w-4 h-4" />
                    <span>加入于 {joinedDate}</span>
                </div>
                
                <div className="flex gap-12 w-full justify-center border-t border-zinc-50 pt-6">
                    <div className="text-center">
                        <div className="text-xl font-bold text-zinc-900">{stats?.total_posts || 0}</div>
                        <div className="text-xs text-zinc-400 uppercase tracking-wider font-medium mt-1">发布</div>
                    </div>
                     <div className="text-center">
                        <div className="text-xl font-bold text-zinc-900">{stats?.total_likes_received || 0}</div>
                        <div className="text-xs text-zinc-400 uppercase tracking-wider font-medium mt-1">获赞</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-zinc-900">{stats?.total_bookmarks_made || 0}</div>
                        <div className="text-xs text-zinc-400 uppercase tracking-wider font-medium mt-1">收藏</div>
                    </div>
                </div>
            </div>

            {/* Sticky Tabs */}
            <div className="sticky top-[72px] z-10 bg-zinc-50/95 backdrop-blur-md pb-4 pt-2 -mx-2 px-2">
                <div className="flex bg-white/50 p-1 rounded-xl border border-zinc-200/50 shadow-sm">
                    <button 
                        onClick={() => setActiveTab('posts')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'posts' ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-900/5' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50/50'}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        发布
                    </button>
                    <button 
                        onClick={() => setActiveTab('likes')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'likes' ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-900/5' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50/50'}`}
                    >
                        <Heart className="w-4 h-4" />
                        喜欢
                    </button>
                    <button 
                        onClick={() => setActiveTab('saved')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'saved' ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-900/5' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50/50'}`}
                    >
                        <Bookmark className="w-4 h-4" />
                        收藏
                    </button>
                </div>
            </div>

            {/* Content List */}
            <div className="space-y-4 min-h-[400px]">
                {loading ? (
                    <div className="text-center py-20 text-zinc-400">加载中...</div>
                ) : reviews.length > 0 ? (
                    reviews.map((review: any) => (
                        <ReviewCard 
                            key={review.id} 
                            review={review} 
                            currentUserId={userId}
                        />
                    ))
                ) : (
                    <div className="text-center py-20 text-zinc-400 flex flex-col items-center">
                        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4 text-2xl">
                            {activeTab === 'posts' ? '📝' : activeTab === 'likes' ? '❤️' : '🔖'}
                        </div>
                        <p>这里空空如也</p>
                    </div>
                )}
            </div>
        </div>
    )
}
