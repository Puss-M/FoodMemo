'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type Comment = {
  id: string
  content: string
  created_at: string
  profiles: {
    username: string
    avatar_url: string | null
  }
}

export default function CommentSection({ reviewId, currentUserId }: { reviewId: string, currentUserId: string }) {
  const supabase = createClient()
  const [isExpanded, setIsExpanded] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isExpanded) {
      fetchComments()
    }
  }, [isExpanded])

  const fetchComments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('comments')
      .select('id, content, created_at, profiles(username, avatar_url)')
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setComments(data as any)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    const { error } = await supabase
      .from('comments')
      .insert({
        review_id: reviewId,
        user_id: currentUserId,
        content: newComment.trim()
      })

    if (error) {
      toast.error('评论失败')
      console.error(error)
    } else {
      toast.success('评论成功')
      setNewComment('')
      await fetchComments()
    }
    setSubmitting(false)
  }

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    let interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + '天前'
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + '小时前'
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + '分钟前'
    return '刚刚'
  }

  return (
    <div className="mt-3 pt-3 border-t border-zinc-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-zinc-400 hover:text-orange-500 transition-colors text-sm"
      >
        <MessageCircle className="w-4 h-4" />
        <span>{comments.length > 0 ? `${comments.length} 条评论` : '评论'}</span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Comment List */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-300" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <img
                    src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.profiles?.username}`}
                    alt="avatar"
                    className="w-7 h-7 rounded-full bg-zinc-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900">{comment.profiles?.username}</span>
                      <span className="text-xs text-zinc-400">{timeAgo(comment.created_at)}</span>
                    </div>
                    <p className="text-sm text-zinc-700 mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400 text-center py-2">还没有评论</p>
          )}

          {/* Comment Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="说点什么..."
              className="flex-1 text-sm px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
