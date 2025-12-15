import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Publisher from '@/components/Publisher'
import ReviewCard from '@/components/ReviewCard'
import Navbar from '@/components/Navbar'
import { revalidatePath } from 'next/cache'

export default async function Home() {
  const supabase = await createClient()

  // 1. Auth Check
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  // 2. Fetch Reviews
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*, profiles(username, avatar_url)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reviews:', error)
  }

  // 3. Revalidation Action (passed to client component to trigger refresh)
  async function refreshFeed() {
    'use server'
    revalidatePath('/')
  }

  return (
    <main className="min-h-screen bg-zinc-50 pt-20 pb-10">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4">
        {/* Publisher */}
        <Publisher session={session} onPostSuccess={refreshFeed} />

        {/* Timeline */}
        <div className="space-y-4">
            {reviews?.map((review: any) => (
              <ReviewCard key={review.id} review={review} />
            ))}
            
            {(!reviews || reviews.length === 0) && (
              <div className="text-center py-20 text-zinc-400">
                <p>还没有人发布内容，来做第一个吧！</p>
              </div>
            )}
        </div>
      </div>
    </main>
  )
}
