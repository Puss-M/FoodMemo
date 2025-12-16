'use client'

import { Review } from '@/types'
import { Clock, Trash2, Loader2, Heart, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import CommentSection from './CommentSection'

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
  
  // Optimistic UI State
  // Initial state logic:
  // 1. Check if current user is in the map/list of likers (if backend returns it)
  // For now we default to false or passed prop if available. 
  // Ideally, 'review' object should have 'is_liked_by_user' boolean from a join.
  // We'll trust the user to have updated the backend view or simply default to false until fetch.
  // BUT: To make it work immediately without backend join changes, we might need a separate fetch. 
  // However, simpler is to just handle the toggle logic first.
  const [isLiked, setIsLiked] = useState(false) 
  const [likeCount, setLikeCount] = useState(0) // Default to 0 if no count provided

  // Fetch initial like state (Client-side fetch for v6.0 quick fix)
  useEffect(() => {
    if (currentUserId) {
        supabase.from('fm_likes')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', review.id)
        .eq('user_id', currentUserId)
        .then(({ count }) => {
            if (count && count > 0) setIsLiked(true)
        })
    }
    // Get total likes
    supabase.from('fm_likes')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', review.id)
        .then(({ count }) => {
            if (count !== null) setLikeCount(count)
        })
  }, [currentUserId, review.id, supabase])

  const handleToggleLike = async () => {
    if (!currentUserId) {
        toast.error('请先登录')
        router.push('/login')
        return
    }

    // Optimistic Update
    const previousState = isLiked
    const previousCount = likeCount
    
    setIsLiked(!previousState)
    setLikeCount(previousState ? previousCount - 1 : previousCount + 1)

    try {
        if (previousState) {
            // Unlike
            await supabase.from('fm_likes').delete().match({ user_id: currentUserId, review_id: review.id })
        } else {
            // Like
            await supabase.from('fm_likes').insert({ user_id: currentUserId, review_id: review.id })
        }
    } catch (err) {
        // Revert on error
        console.error('Like toggle failed', err)
        setIsLiked(previousState)
        setLikeCount(previousCount)
        toast.error('操作失败')
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
      // Force page refresh to update the list
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
          <div className="flex items-center gap-2 mb-1">
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

          {/* Content */}
          <p className="text-zinc-900 whitespace-pre-wrap leading-relaxed mb-3 text-[15px]">
            {review.content}
          </p>

          {/* Image */}
          {review.image_url && (
            <div className="mb-3">
              <img 
                src={review.image_url} 
                alt="Review image" 
                className="rounded-xl max-h-64 w-auto object-cover border border-zinc-100"
                loading="lazy"
              />
            </div>
          )}

          {/* Footer / Tags */}
          {review.tags && review.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {review.tags.map((tag, idx) => (
                <Link 
                  href={`/?tag=${encodeURIComponent(tag)}`}
                  key={idx} 
                  className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Comments Section */}
          {currentUserId && (
            <CommentSection reviewId={review.id} currentUserId={currentUserId} />
          )}

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-50">
            <button 
              onClick={handleToggleLike}
              className="group flex items-center gap-1.5 text-zinc-400 hover:text-red-500 transition-colors"
            >
              <Heart className={`w-4 h-4 transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'group-hover:scale-110'}`} />
              <span className={`text-xs font-medium ${isLiked ? 'text-red-500' : ''}`}>
                {likeCount > 0 ? likeCount : '赞'}
              </span>
            </button>

            {currentUserId === review.user_id && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                title="删除"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
