'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Loader2, Lock, Mail, KeyRound, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [username, setUsername] = useState('') // Adding username as per profiles table

  // Auto-fill invite code from URL parameter
  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      setInviteCode(code.toUpperCase())
      setIsRegister(true) // Auto switch to register mode
    }
  }, [searchParams])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isRegister) {
        // Use Server Action for Secure Registration
        const formData = new FormData()
        formData.append('email', email)
        formData.append('password', password)
        formData.append('inviteCode', inviteCode)
        formData.append('username', username)

        const { register } = await import('@/app/actions') // Dynamic import to avoid build issues if file not found initially
        const result = await register(null, formData)

        if (result?.error) {
          throw new Error(`注册失败: ${result.error}`)
        }

        if (result?.success) {
           // Auto login after registration
           const { error: loginError } = await supabase.auth.signInWithPassword({
             email,
             password
           })
           if (loginError) throw loginError

           toast.success('注册成功！', {
             description: '欢迎加入 FoodMemo'
           })
           
           router.push('/')
           router.refresh()
        }

      } else {
        // Login
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (authError) throw authError
        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || '发生错误')
      toast.error(err.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-zinc-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            FoodMemo
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            {isRegister ? '加入内部美食圈 (v8.0)' : '欢迎回来'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {isRegister && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1 ml-1">邀请码</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-zinc-400"
                    placeholder="内部邀请码"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1 ml-1">用户名</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-4 pr-4 py-2 bg-zinc-50 border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-zinc-400"
                    placeholder="大家怎么称呼你"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1 ml-1">邮箱</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-zinc-400"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1 ml-1">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-zinc-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 mt-6"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRegister ? (
              '注册账号'
            ) : (
              '登 录'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            {isRegister ? '已有账号？去登录' : '没有账号？使用邀请码注册'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <a 
            href="/guidelines" 
            className="text-xs text-orange-500 hover:text-orange-600 transition-colors"
          >
            📜 查看用户须知 & 社区公约
          </a>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50">
        <div className="text-zinc-400">加载中...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
