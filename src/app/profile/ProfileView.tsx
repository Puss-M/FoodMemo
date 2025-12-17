'use client'

import { useState, useEffect } from 'react'
import { Calendar, LayoutGrid, Heart, Bookmark, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ReviewCard from '@/components/ReviewCard'
import FollowsModal from '@/components/FollowsModal'
import Link from 'next/link'

export default function ProfileView({ profile, stats, userId, inviteCodes }: any) {
    const supabase = createClient()
    const [activeTab, setActiveTab] = useState<'posts' | 'likes' | 'saved'>('posts')
    const [reviews, setReviews] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [achievements, setAchievements] = useState<any[]>([])
    const [followsModal, setFollowsModal] = useState<{ isOpen: boolean; type: 'followers' | 'following' }>({
        isOpen: false,
        type: 'followers'
    })

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
                .eq('user_id', userId)
                .order('unlocked_at', { ascending: false })
            
            if (data) setAchievements(data)
        }
        fetchAchievements()
    }, [userId, supabase])

    useEffect(() => {
        async function fetchReviews() {
            setLoading(true)
            let query = supabase.from('reviews').select('*, profiles(username, avatar_url)').order('created_at', { ascending: false })
            
            if (activeTab === 'posts') {
                query = query.eq('user_id', userId)
            } else if (activeTab === 'likes') {
                const { data: likes } = await supabase.from('fm_likes').select('review_id').eq('user_id', userId)
                if (likes && likes.length > 0) {
                     const ids = likes.map((l: any) => l.review_id)
                     query = query.in('id', ids)
                } else {
                    setReviews([])
                    setLoading(false)
                    return
                }
            } else if (activeTab === 'saved') {
                const { data: bookmarks } = await supabase.from('fm_bookmarks').select('review_id').eq('user_id', userId)
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
    }, [activeTab, userId, supabase])

    return (
        <div>
            {/* User Profile Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 mb-6 flex flex-col items-center text-center relative">
                {/* Settings Button */}
                <Link 
                    href="/settings"
                    className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-lg transition-colors"
                    title="设置"
                >
                    <Settings className="w-5 h-5" />
                </Link>

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
                    <button 
                        onClick={() => setFollowsModal({ isOpen: true, type: 'followers' })}
                        className="text-center hover:bg-zinc-50 rounded-lg p-2 -m-2 transition-colors cursor-pointer"
                    >
                        <div className="text-xl font-bold text-zinc-900">{stats?.followers_count || 0}</div>
                        <div className="text-xs text-zinc-400 uppercase tracking-wider font-medium mt-1">粉丝</div>
                    </button>
                    <button 
                        onClick={() => setFollowsModal({ isOpen: true, type: 'following' })}
                        className="text-center hover:bg-zinc-50 rounded-lg p-2 -m-2 transition-colors cursor-pointer"
                    >
                        <div className="text-xl font-bold text-zinc-900">{stats?.following_count || 0}</div>
                        <div className="text-xs text-zinc-400 uppercase tracking-wider font-medium mt-1">关注</div>
                    </button>
                </div>

                {/* Invitation Center */}
                <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 mb-6">
                   <div className="flex items-center justify-between mb-4">
                       <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                           <span>🎫</span>
                           <span>邀请中心</span>
                       </h3>
                       <button
                           onClick={async () => {
                               const { generateInviteCode } = await import('@/app/actions')
                               const toast = (await import('sonner')).toast
                               
                               const promise = generateInviteCode()
                               toast.promise(promise, {
                                   loading: '生成中...',
                                   success: (result) => {
                                       if (result.error) throw new Error(result.error)
                                       // Refresh page to show new code
                                       window.location.reload()
                                       return `邀请码 ${result.code} 已生成`
                                   },
                                   error: (err) => err.message
                               })
                           }}
                           className="text-sm bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
                       >
                           生成邀请码
                       </button>
                   </div>
                   
                   {/* Invite Codes List */}
                   <div className="space-y-3">
                       {/* Show existing invite_code from profile if it exists and not in list? 
                           Actually, profile.invite_code might have been a legacy field or the one they used to join.
                           The prompt says: "Table: generated_by". 
                           Let's trust `inviteCodes` prop.
                        */}
                       
                       {(!inviteCodes || inviteCodes.length === 0) ? (
                           <div className="text-center py-8 text-zinc-400 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                               <p className="text-sm">还没有生成过邀请码</p>
                               <p className="text-xs mt-1">生成一个送给朋友吧</p>
                           </div>
                       ) : (
                           inviteCodes.map((code: any) => (
                               <div key={code.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                                   <div className="flex items-center gap-4">
                                       <div className={`font-mono font-bold text-lg tracking-wider ${code.is_used ? 'text-zinc-400 decoration-zinc-400' : 'text-zinc-900'}`}>
                                           {code.code}
                                       </div>
                                       {code.is_used ? (
                                           <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-2 py-1 rounded-md text-xs">
                                               <span className="opacity-70">已邀请</span>
                                               {code.invitee ? (
                                                   <div className="flex items-center gap-1 font-medium">
                                                       <img 
                                                           src={code.invitee.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${code.invitee.username}`} 
                                                           alt="" 
                                                           className="w-4 h-4 rounded-full" 
                                                       />
                                                       {code.invitee.username}
                                                   </div>
                                               ) : (
                                                   <span>未知用户</span>
                                               )}
                                           </div>
                                       ) : (
                                           <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs font-medium">未使用</span>
                                       )}
                                   </div>
                                   
                                   {!code.is_used && (
                                       <button
                                           onClick={() => {
                                               const link = `${window.location.origin}/login?code=${code.code}`
                                               navigator.clipboard.writeText(link)
                                               // We need toast here, wait, usually imported top level
                                               import('sonner').then(({ toast }) => toast.success('链接已复制'))
                                           }}
                                           className="text-xs text-zinc-500 hover:text-zinc-900 font-medium px-2 py-1 hover:bg-zinc-200 rounded transition-colors"
                                       >
                                           复制链接
                                       </button>
                                   )}
                               </div>
                           ))
                       )}
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

            {/* Follows Modal */}
            <FollowsModal
                userId={userId}
                type={followsModal.type}
                isOpen={followsModal.isOpen}
                onClose={() => setFollowsModal({ ...followsModal, isOpen: false })}
                currentUserId={userId}
            />
        </div>
    )
}
