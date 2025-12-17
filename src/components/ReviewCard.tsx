'use client'

import { Review } from '@/types'
import { Clock, Trash2, Loader2, Heart, MapPin, Bookmark, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import CommentSection from './CommentSection'
import { useComposerStore } from '@/store/useComposerStore'
import { useFollowStore } from '@/store/useFollowStore'

// Helper to format time (e.g. "2 hours ago")
function timeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + "年前"
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + "月前"
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + "天前"
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + "小时前"
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + "分钟前"
  return "刚刚"
}

export default function ReviewCard({ review, currentUserId }: { review: Review, currentUserId?: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  
  // States
  const [isLiked, setIsLiked] = useState(false) 
  const [likeCount, setLikeCount] = useState(0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  
  // Use global follow store
  const { isFollowingUser, setFollowStatus } = useFollowStore()
  const isFollowing = isFollowingUser(review.user_id)

  // Fetch initial states
  useEffect(() => {
    // Like State
    if (currentUserId) {
        supabase.from('fm_likes')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', review.id)
        .eq('user_id', currentUserId)
        .then((res: any) => {
            const count = res.count
            if (count && count > 0) setIsLiked(true)
        })

        // Bookmark State
        supabase.from('fm_bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', review.id)
        .eq('user_id', currentUserId)
        .then((res: any) => {
            const count = res.count
            if (count && count > 0) setIsBookmarked(true)
        })

        // Follow State (only if not own review)
        if (review.user_id !== currentUserId) {
            supabase.from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', currentUserId)
            .eq('following_id', review.user_id)
            .then((res: any) => {
                const count = res.count
                // Sync to global store
                setFollowStatus(review.user_id, !!(count && count > 0))
            })
        }
    }
    
    // Total Likes
    supabase.from('fm_likes')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', review.id)
        .then((res: any) => {
            const count = res.count
            if (count !== null) setLikeCount(count)
        })
  }, [currentUserId, review.id, supabase])

  const handleToggleLike = async () => {
    if (!currentUserId) {
        toast.error('请先登录')
        router.push('/login')
        return
    }

    const previousState = isLiked
    const previousCount = likeCount
    
    setIsLiked(!previousState)
    setLikeCount(previousState ? previousCount - 1 : previousCount + 1)

    try {
        if (previousState) {
            await supabase.from('fm_likes').delete().match({ user_id: currentUserId, review_id: review.id })
        } else {
            await supabase.from('fm_likes').insert({ user_id: currentUserId, review_id: review.id })
        }
    } catch (err) {
        console.error('Like toggle failed', err)
        setIsLiked(previousState)
        setLikeCount(previousCount)
        toast.error('操作失败')
    }
  }

  const handleToggleBookmark = async () => {
    if (!currentUserId) {
        toast.error('请先登录')
        router.push('/login')
        return
    }

    const previousState = isBookmarked
    setIsBookmarked(!previousState)

    try {
        if (previousState) {
             await supabase.from('fm_bookmarks').delete().match({ user_id: currentUserId, review_id: review.id })
             toast.success('已取消收藏')
        } else {
             await supabase.from('fm_bookmarks').insert({ user_id: currentUserId, review_id: review.id })
             toast.success('已收藏')
        }
    } catch (err) {
        console.error('Bookmark toggle failed', err)
        setIsBookmarked(previousState)
        toast.error('操作失败')
    }
  }

  const handleToggleFollow = async () => {
    if (!currentUserId) {
        toast.error('请先登录')
        router.push('/login')
        return
    }

    const previousState = isFollowing
    // Optimistic update
    setFollowStatus(review.user_id, !previousState)

    try {
        if (previousState) {
             await supabase.from('follows').delete().match({ follower_id: currentUserId, following_id: review.user_id })
             toast.success('已取消关注')
        } else {
             await supabase.from('follows').insert({ follower_id: currentUserId, following_id: review.user_id })
             toast.success('已关注')
        }
    } catch (err) {
        console.error('Follow toggle failed', err)
        // Revert on error
        setFollowStatus(review.user_id, previousState)
        toast.error('操作失败')
    }
  }

  const { setDraft } = useComposerStore()

  const handleWithdraw = async () => {
    // Save to composer store first
    setDraft({
      content: review.content,
      tags: review.tags?.join(' ') || '',
      imageUrls: review.image_urls || (review.image_url ? [review.image_url] : []),
      locationName: review.location_name || null,
      locationCoords: review.location_coords || null
    })

    // Then delete
    setIsDeleting(true)
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', review.id)
    
    if (error) {
      console.error('Error withdrawing review:', error)
      toast.error('撤回失败')
      setIsDeleting(false)
    } else {
      router.refresh()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这条评价吗？')) return

    setIsDeleting(true)
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', review.id)
    
    if (error) {
      console.error('Error deleting review:', error)
      toast.error('删除失败')
      setIsDeleting(false)
    } else {
      toast.success('已删除')
      setTimeout(() => {
        router.refresh()
        window.location.reload()
      }, 500)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-5 mb-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="shrink-0">
            <Link href={`/profile`}>
              <img 
                src={review.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${review.profiles?.username || 'User'}`} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full bg-zinc-100 object-cover hover:opacity-80 transition-opacity"
              />
            </Link>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-900">{review.profiles?.username || 'Unknown'}</span>
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                · {timeAgo(review.created_at)}
              </span>
              {review.location_name && (
                  <span className="flex items-center gap-0.5 text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md">
                      <MapPin className="w-3 h-3" />
                      {review.location_name}
                  </span>
              )}
            </div>
            {/* Follow Button (only show if not own review) */}
            {currentUserId && review.user_id !== currentUserId && (
              <button
                onClick={handleToggleFollow}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                  isFollowing 
                    ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' 
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {isFollowing ? '已关注' : '+ 关注'}
              </button>
            )}
          </div>

          {/* Content */}
          <p className="text-zinc-900 whitespace-pre-wrap leading-relaxed mb-3 text-[15px]">
            {review.content}
          </p>

          {/* Multi-Image Grid */}
          {((review.image_urls && review.image_urls.length > 0) || review.image_url) && (
            <div className={`mb-3 mt-2 grid gap-1 ${
              (review.image_urls?.length || 1) === 1 ? '' :
              (review.image_urls?.length || 1) === 2 ? 'grid-cols-2' :
              'grid-cols-3'
            }`}>
              {(review.image_urls || (review.image_url ? [review.image_url] : [])).map((url: string, idx: number) => (
                <div 
                  key={idx} 
                  className={`relative overflow-hidden rounded-lg ${
                    (review.image_urls?.length || 1) === 1 ? 'aspect-video' : 'aspect-square'
                  }`}
                >
                  <img 
                    src={url} 
                    alt={`Image ${idx + 1}`} 
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity border border-zinc-100 bg-zinc-50"
                    loading="lazy"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      window.open(url, '_blank')
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Footer / Tags - Color coded by type */}
          {review.tags && review.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {review.tags.map((tag, idx) => {
                // Determine tag color based on type
                const isScenario = ['👤 一人食', '👩‍❤️‍👨 约会', '👯 朋友聚餐', '🍻 部门团建', '💼 商务'].includes(tag)
                const isCuisine = ['川菜', '火锅', '粤菜', '湘菜', '烧烤', '日韩', '西餐', '甜点', '面食', '小吃'].includes(tag)
                
                return (
                  <Link 
                    href={`/?tag=${encodeURIComponent(tag)}`}
                    key={idx} 
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      isScenario 
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        : isCuisine
                          ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {tag}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Comments Section */}
          {currentUserId && (
            <CommentSection reviewId={review.id} currentUserId={currentUserId} />
          )}

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-50">
            <div className="flex items-center gap-4">
                <button 
                onClick={handleToggleLike}
                className="group flex items-center gap-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                >
                <Heart className={`w-4 h-4 transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'group-hover:scale-110'}`} />
                <span className={`text-xs font-medium ${isLiked ? 'text-red-500' : ''}`}>
                    {likeCount > 0 ? likeCount : '赞'}
                </span>
                </button>

                <button 
                onClick={handleToggleBookmark}
                className="group flex items-center gap-1.5 text-zinc-400 hover:text-orange-500 transition-colors"
                >
                <Bookmark className={`w-4 h-4 transition-all ${isBookmarked ? 'fill-orange-500 text-orange-500 scale-110' : 'group-hover:scale-110'}`} />
                <span className={`text-xs font-medium ${isBookmarked ? 'text-orange-500' : ''}`}>
                    {isBookmarked ? '已收藏' : '收藏'}
                </span>
                </button>
            </div>

            {currentUserId === review.user_id && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleWithdraw}
                  disabled={isDeleting}
                  className="text-zinc-300 hover:text-blue-500 transition-colors p-1"
                  title="撤回编辑"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                  title="删除"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
