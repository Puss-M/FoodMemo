'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Send, Loader2, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

interface ChatWindowProps {
  currentUserId: string
  targetUser: {
    id: string
    username: string
    avatar_url: string | null
  }
  onClose: () => void
}

export default function ChatWindow({ currentUserId, targetUser, onClose }: ChatWindowProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch messages
  useEffect(() => {
    fetchMessages()
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`
        },
        (payload: { new: Message }) => {
          // Only add if it's from the person we are chatting with
          if (payload.new.sender_id === targetUser.id) {
            setMessages(prev => [...prev, payload.new])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, targetUser.id, supabase])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMessages(data)
    }
    setLoading(false)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: currentUserId,
        receiver_id: targetUser.id,
        content: newMessage.trim()
      })

    if (error) {
      toast.error('发送失败')
      console.error(error)
      setSending(false)
    } else {
      setNewMessage('')
      setSending(false)
      // Optimistic update (or rather, confirms successful send)
      const sentMsg: Message = {
          id: 'temp-' + Date.now(),
          sender_id: currentUserId,
          receiver_id: targetUser.id,
          content: newMessage.trim(),
          is_read: false,
          created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, sentMsg])
    }
  }

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin < 1) return '刚刚'
    if (diffMin < 60) return `${diffMin}分钟前`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}小时前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-zinc-200 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-100 bg-linear-to-r from-orange-500 to-orange-400">
        <div className="flex items-center gap-2">
          <img
            src={targetUser.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${targetUser.username}`}
            alt=""
            className="w-8 h-8 rounded-full border-2 border-white/50"
          />
          <span className="font-medium text-white">{targetUser.username}</span>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-zinc-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400">
            <MessageCircle className="w-12 h-12 mb-2 opacity-30" />
            <p className="text-sm">开始聊天吧！</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                  msg.sender_id === currentUserId
                    ? 'bg-orange-500 text-white rounded-br-sm'
                    : 'bg-white text-zinc-800 border border-zinc-100 rounded-bl-sm'
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${msg.sender_id === currentUserId ? 'text-white/60' : 'text-zinc-400'}`}>
                  {timeAgo(msg.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-zinc-100 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="输入消息..."
            className="flex-1 text-sm px-3 py-2 border border-zinc-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  )
}
