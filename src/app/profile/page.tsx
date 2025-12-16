import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReviewCard from '@/components/ReviewCard'
import Navbar from '@/components/Navbar'
import LeftSidebar from '@/components/LeftSidebar'
import RightSidebar from '@/components/RightSidebar'
import MobileNavbar from '@/components/MobileNavbar'
import { Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()

  // 1. Auth Check
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  const userId = session.user.id

  // 2. Fetch User Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // 3. Fetch User Reviews
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*, profiles(username, avatar_url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reviews:', error)
  }

  // Format date
  const joinedDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '未知时间'

  return (
    <main className="min-h-screen bg-zinc-50 lg:bg-stone-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex gap-6 px-4 lg:py-8 pt-20 pb-28">
        <LeftSidebar />

        <div className="flex-1 min-w-0 max-w-2xl mx-auto w-full">
            {/* User Profile Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 mb-6 flex flex-col items-center text-center">
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
                <div className="flex items-center gap-1.5 text-zinc-500 text-sm mb-6">
                    <Calendar className="w-4 h-4" />
                    <span>加入于 {joinedDate}</span>
                </div>
                
                <div className="flex gap-8 w-full justify-center border-t border-zinc-50 pt-4">
                    <div className="text-center">
                        <div className="text-xl font-bold text-zinc-900">{reviews?.length || 0}</div>
                        <div className="text-xs text-zinc-400 uppercase tracking-wider font-medium mt-1">评价</div>
                    </div>
                     <div className="text-center">
                        <div className="text-xl font-bold text-zinc-900">0</div>
                        <div className="text-xs text-zinc-400 uppercase tracking-wider font-medium mt-1">获赞</div>
                    </div>
                </div>
            </div>

            <h2 className="text-lg font-bold text-zinc-800 mb-4 px-1">我的评价历史</h2>

            {/* Timeline */}
            <div className="space-y-4">
                {reviews?.map((review: any) => (
                    <ReviewCard 
                        key={review.id} 
                        review={review} 
                        currentUserId={userId}
                    />
                ))}
                {(!reviews || reviews.length === 0) && (
                    <div className="text-center py-12 text-zinc-400">
                        还未发布过任何评价
                    </div>
                )}
            </div>
        </div>

        <RightSidebar />
      </div>

      <MobileNavbar />
    </main>
  )
}
