'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Moon, Sun, LogOut, User, Palette } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import AvatarUpload from '@/components/AvatarUpload'
import { useTheme } from 'next-themes'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [profile, setProfile] = useState<any>(null)
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form states
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const uid = session.user.id
      setUserId(uid)

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single()

      if (data) {
        setProfile(data)
        setUsername(data.username || '')
        setBio(data.bio || '')
      }


      
      setLoading(false)
    }

    loadProfile()
  }, [supabase, router])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username, bio })
        .eq('id', userId)

      if (error) throw error

      toast.success('资料已保存')
      setProfile({ ...profile, username, bio })
    } catch (error: any) {
      toast.error(error.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    toast.success('已退出登录')
  }

  // Theme logic
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const isDarkMode = mounted && resolvedTheme === 'dark'

  const toggleDarkMode = () => {
    const newTheme = isDarkMode ? 'light' : 'dark'
    setTheme(newTheme)
    toast.info(newTheme === 'dark' ? '深色模式已开启' : '浅色模式已开启')
  }

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/profile">
            <ArrowLeft className="w-6 h-6 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white" />
          </Link>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">设置</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">个人资料</h2>
          </div>

          <div className="space-y-6">
            {/* Avatar */}
            <AvatarUpload 
              currentAvatarUrl={profile?.avatar_url}
              userId={userId}
              onUploadSuccess={(url) => setProfile({ ...profile, avatar_url: url })}
            />

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                昵称
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="请输入昵称"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                个性签名
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                placeholder="一句话介绍自己..."
                maxLength={100}
              />
              <p className="text-xs text-zinc-400 mt-1">{bio.length}/100</p>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {saving ? '保存中...' : '保存资料'}
            </button>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">外观</h2>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" /> : <Sun className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />}
              <div>
                <div className="font-medium text-zinc-900 dark:text-white">深色模式</div>
                <div className="text-xs text-zinc-400">切换应用主题</div>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isDarkMode ? 'bg-orange-500' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Account Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
          <div className="flex items-center gap-2 mb-4">
            <LogOut className="w-5 h-5 text-zinc-600" />
            <h2 className="text-lg font-bold text-zinc-900">账号</h2>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  )
}
