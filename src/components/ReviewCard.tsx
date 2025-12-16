'use client'

import { Review } from '@/types'
import { Clock, Trash2, Loader2, Heart, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
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
  const [isLiked, setIsLiked] = useState(false)

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
          <img 
            src={review.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${review.profiles?.username || 'User'}`} 
            alt="Avatar" 
            className="w-10 h-10 rounded-full bg-zinc-100 object-cover"
          />
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
              onClick={() => setIsLiked(!isLiked)}
              className="group flex items-center gap-1.5 text-zinc-400 hover:text-red-500 transition-colors"
            >
              <Heart className={`w-4 h-4 transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'group-hover:scale-110'}`} />
              <span className={`text-xs font-medium ${isLiked ? 'text-red-500' : ''}`}>
                {isLiked ? 59 : 58}
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
