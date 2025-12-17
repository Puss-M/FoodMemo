'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type Comment = {
  id: string
  content: string
  created_at: string
  user_id: string
  reply_to_user_id: string | null
  profiles: {
    username: string
    avatar_url: string | null
  }
  reply_to_user?: {
    username: string
  } | null
}

export default function CommentSection({ reviewId, currentUserId }: { reviewId: string, currentUserId: string }) {
  const supabase = createClient()
  const [isExpanded, setIsExpanded] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentCount, setCommentCount] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState<{ userId: string; username: string } | null>(null)

  // Fetch comment count on mount
  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', reviewId)
      
      if (count !== null) setCommentCount(count)
    }
    fetchCount()
  }, [reviewId, supabase])

  useEffect(() => {
    if (isExpanded) {
      fetchComments()
    }
  }, [isExpanded])

  const fetchComments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id, content, created_at, user_id, reply_to_user_id,
        profiles!comments_user_id_fkey(username, avatar_url),
        reply_to_user:profiles!comments_reply_to_user_id_fkey(username)
      `)
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setComments(data as any)
      setCommentCount(data.length)
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
        content: newComment.trim(),
        reply_to_user_id: replyTo?.userId || null
      })

    if (error) {
      toast.error('评论失败')
      console.error(error)
    } else {
      toast.success(replyTo ? '回复成功' : '评论成功')
      setNewComment('')
      setReplyTo(null)
      await fetchComments()
    }
    setSubmitting(false)
  }

  const handleReply = (userId: string, username: string) => {
    if (userId === currentUserId) return // Can't reply to self
    setReplyTo({ userId, username })
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
        <span>{commentCount > 0 ? `${commentCount} 条评论` : '评论'}</span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Comment List - WeChat Style */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-300" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-2 bg-zinc-50 rounded-lg p-3">
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className="text-sm cursor-pointer hover:bg-zinc-100 -mx-2 px-2 py-1 rounded transition-colors"
                  onClick={() => handleReply(comment.user_id, comment.profiles?.username)}
                >
                  <Link 
                    href={`/user/${comment.user_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-zinc-900 hover:text-orange-500"
                  >
                    {comment.profiles?.username}
                  </Link>
                  {comment.reply_to_user && (
                    <>
                      <span className="text-zinc-400 mx-1">回复</span>
                      <span className="font-medium text-zinc-900">{comment.reply_to_user.username}</span>
                    </>
                  )}
                  <span className="text-zinc-400">：</span>
                  <span className="text-zinc-700">{comment.content}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400 text-center py-2">还没有评论</p>
          )}

          {/* Comment Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyTo ? `回复 @${replyTo.username}...` : '说点什么...'}
                className="w-full text-sm px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              {replyTo && (
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600"
                >
                  取消回复
                </button>
              )}
            </div>
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
