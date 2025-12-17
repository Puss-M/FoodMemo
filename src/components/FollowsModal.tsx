'use client'

import { useState, useEffect } from 'react'
import { X, UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface FollowsModalProps {
  userId: string
  type: 'followers' | 'following'
  isOpen: boolean
  onClose: () => void
  currentUserId?: string
}

export default function FollowsModal({ userId, type, isOpen, onClose, currentUserId }: FollowsModalProps) {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [followingIds, setFollowingIds] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    async function fetchData() {
      setLoading(true)
      
      // Fetch followers or following
      if (type === 'followers') {
        const { data } = await supabase
          .from('follows')
          .select('follower_id, profiles!follows_follower_id_fkey(id, username, avatar_url)')
          .eq('following_id', userId)
        
        if (data) {
          setUsers(data.map((d: any) => d.profiles))
        }
      } else {
        const { data } = await supabase
          .from('follows')
          .select('following_id, profiles!follows_following_id_fkey(id, username, avatar_url)')
          .eq('follower_id', userId)
        
        if (data) {
          setUsers(data.map((d: any) => d.profiles))
        }
      }

      // Fetch who current user is following (for follow buttons)
      if (currentUserId) {
        const { data: myFollowing } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUserId)
        
        if (myFollowing) {
          setFollowingIds(myFollowing.map((f: any) => f.following_id))
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [isOpen, userId, type, currentUserId, supabase])

  const handleFollow = async (targetId: string) => {
    setActionLoading(targetId)
    const { followUser } = await import('@/app/actions')
    const result = await followUser(targetId)
    
    if (result.success) {
      setFollowingIds(prev => [...prev, targetId])
    } else {
      const { toast } = await import('sonner')
      toast.error(result.error || '关注失败')
    }
    setActionLoading(null)
  }

  const handleUnfollow = async (targetId: string) => {
    setActionLoading(targetId)
    const { unfollowUser } = await import('@/app/actions')
    const result = await unfollowUser(targetId)
    
    if (result.success) {
      setFollowingIds(prev => prev.filter(id => id !== targetId))
    } else {
      const { toast } = await import('sonner')
      toast.error(result.error || '取消关注失败')
    }
    setActionLoading(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h2 className="text-lg font-bold text-zinc-900">
            {type === 'followers' ? '粉丝' : '关注'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              {type === 'followers' ? '还没有粉丝' : '还没有关注任何人'}
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                  <Link href={`/user/${user.id}`} className="flex items-center gap-3 flex-1" onClick={onClose}>
                    <div className="w-10 h-10 rounded-full bg-orange-100 overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-orange-500 font-bold">
                          {user.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-zinc-900">{user.username}</span>
                  </Link>

                  {/* Follow/Unfollow Button */}
                  {currentUserId && currentUserId !== user.id && (
                    <button
                      onClick={() => followingIds.includes(user.id) ? handleUnfollow(user.id) : handleFollow(user.id)}
                      disabled={actionLoading === user.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        followingIds.includes(user.id)
                          ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      }`}
                    >
                      {actionLoading === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : followingIds.includes(user.id) ? (
                        <>
                          <UserMinus className="w-4 h-4" />
                          已关注
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          关注
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
