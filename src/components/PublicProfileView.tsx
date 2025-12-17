'use client'

import { useState, useEffect } from 'react'
import { Calendar, LayoutGrid, Heart, Bookmark, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ReviewCard from '@/components/ReviewCard'
import Link from 'next/link'
import { useChatStore } from '@/store/useChatStore'
import { useFollowStore } from '@/store/useFollowStore'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function PublicProfileView({ profile, stats, profileId }: any) {
    const supabase = createClient()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'posts' | 'likes' | 'saved'>('posts')
    const [reviews, setReviews] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [achievements, setAchievements] = useState<any[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    const { openChat } = useChatStore()
    const { isFollowingUser, setFollowStatus } = useFollowStore()
    const isFollowing = isFollowingUser(profileId)

    // Get current user
    useEffect(() => {
        const getUser = async () => {
             const { data } = await supabase.auth.getUser()
             if (data.user) setCurrentUserId(data.user.id)
        }
        getUser()
    }, [supabase])

    // Format date
    const joinedDate = profile?.created_at 
        ? new Date(profile.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
        : '未知时间'

    // Fetch user achievements
    useEffect(() => {
        async function fetchAchievements() {
            const { data } = await supabase
                .from('user_achievements')
                .select('*, achievements(*)')
                .eq('user_id', profileId)
                .order('unlocked_at', { ascending: false })
            
            if (data) setAchievements(data)
        }
        fetchAchievements()
    }, [profileId, supabase])

    // Fetch reviews
    useEffect(() => {
        async function fetchReviews() {
            setLoading(true)
            let query = supabase.from('reviews').select('*, profiles(username, avatar_url)').order('created_at', { ascending: false })
            
            if (activeTab === 'posts') {
                query = query.eq('user_id', profileId)
            } else if (activeTab === 'likes') {
                const { data: likes } = await supabase.from('fm_likes').select('review_id').eq('user_id', profileId)
                if (likes && likes.length > 0) {
                     const ids = likes.map((l: any) => l.review_id)
                     query = query.in('id', ids)
                } else {
                    setReviews([])
                    setLoading(false)
                    return
                }
            } else if (activeTab === 'saved') {
                // Usually saved posts are private, but let's assume public for now or hide logic?
                // For privacy, maybe only show posts. But standard requirement often implies visibility.
                // Let's hide 'saved' tab content for others unless it's explicitly public. 
                // For MVP, letting it be visible if the user clicked it, OR maybe hide the tab?
                // Let's keep it consistent with ProfileView for now but maybe restrict 'saved' to self only?
                // Let's show "Hidden" for saved to respect privacy.
                if (currentUserId !== profileId) {
                    setReviews([])
                    setLoading(false)
                    return
                }

                const { data: bookmarks } = await supabase.from('fm_bookmarks').select('review_id').eq('user_id', profileId)
                if (bookmarks && bookmarks.length > 0) {
                     const ids = bookmarks.map((b: any) => b.review_id)
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
    }, [activeTab, profileId, supabase, currentUserId])

    // Fetch follow status for store
    useEffect(() => {
        if (currentUserId) {
            supabase.from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', currentUserId)
            .eq('following_id', profileId)
            .then((res: any) => {
                const count = res.count
                setFollowStatus(profileId, !!(count && count > 0))
            })
        }
    }, [currentUserId, profileId, setFollowStatus, supabase])

    const handleFollow = async () => {
        if (!currentUserId) {
            router.push('/login')
            return
        }
        
        const previousState = isFollowing
        setFollowStatus(profileId, !previousState)

        try {
            if (previousState) {
                await supabase.from('follows').delete().match({ follower_id: currentUserId, following_id: profileId })
                toast.success('已取消关注')
            } else {
                await supabase.from('follows').insert({ follower_id: currentUserId, following_id: profileId })
                toast.success('已关注')
            }
        } catch (err) {
            setFollowStatus(profileId, previousState)
            toast.error('操作失败')
        }
    }

    const handleChat = () => {
        if (!currentUserId) {
            router.push('/login')
            return
        }
        openChat({
            id: profileId,
            username: profile.username,
            avatar_url: profile.avatar_url
        })
    }

    return (
        <div>
            {/* User Profile Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 mb-6 flex flex-col items-center text-center relative">
                
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
                
                {/* Bio */}
                {profile?.bio && (
                    <p className="text-sm text-zinc-500 mb-4 max-w-md">{profile.bio}</p>
                )}
                
                <div className="flex items-center gap-1.5 text-zinc-500 text-sm mb-6">
                    <Calendar className="w-4 h-4" />
                    <span>加入于 {joinedDate}</span>
                </div>
                
                {/* Actions: Follow & Chat */}
                {currentUserId !== profileId && (
                    <div className="flex gap-3 mb-6">
                        <button
                            onClick={handleFollow}
                            className={`px-6 py-2 rounded-full font-medium transition-colors ${
                                isFollowing 
                                ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' 
                                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-500/20'
                            }`}
                        >
                            {isFollowing ? '已关注' : '+ 关注'}
                        </button>
                        <button
                            onClick={handleChat}
                            className="px-6 py-2 rounded-full font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-2"
                        >
                            <MessageCircle className="w-4 h-4" />
                            私信
                        </button>
                    </div>
                )}
                
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
                    <div className="text-center">
                        <div className="text-xl font-bold text-zinc-900">{stats?.followers_count || 0}</div>
                        <div className="text-xs text-zinc-400 uppercase tracking-wider font-medium mt-1">粉丝</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-zinc-900">{stats?.following_count || 0}</div>
                        <div className="text-xs text-zinc-400 uppercase tracking-wider font-medium mt-1">关注</div>
                    </div>
                </div>
            </div>

            {/* Achievements Badge Wall */}
            {achievements.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 mb-6">
                    <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                        <span>🏆</span>
                        <span>成就徽章</span>
                        <span className="text-sm font-normal text-zinc-400">({achievements.length})</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {achievements.map((ua: any) => (
                            <div
                                key={ua.id}
                                className="flex flex-col items-center p-4 rounded-xl bg-linear-to-br from-orange-50 to-yellow-50 border border-orange-100 hover:shadow-md transition-shadow"
                                title={ua.achievements.description}
                            >
                                <div className="text-4xl mb-2">{ua.achievements.icon}</div>
                                <div className="text-sm font-bold text-zinc-900 text-center">{ua.achievements.title}</div>
                                <div className="text-xs text-zinc-500 mt-1">
                                    {new Date(ua.unlocked_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                    {/* Hide saved tab for others */}
                    {currentUserId === profileId && (
                        <button 
                            onClick={() => setActiveTab('saved')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'saved' ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-900/5' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50/50'}`}
                        >
                            <Bookmark className="w-4 h-4" />
                            收藏
                        </button>
                    )}
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
                            currentUserId={currentUserId || undefined}
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
