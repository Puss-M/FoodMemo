import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Publisher from '@/components/Publisher'
import ReviewCard from '@/components/ReviewCard'
import Navbar from '@/components/Navbar'
import LeftSidebar from '@/components/LeftSidebar'
import RightSidebar from '@/components/RightSidebar'
import MobileNavbar from '@/components/MobileNavbar'
import SearchBar from '@/components/SearchBar'
import { revalidatePath } from 'next/cache'
import { UtensilsCrossed } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ tag?: string; cuisine?: string; q?: string }>
}

export default async function Home(props: Props) {
  const searchParams = await props.searchParams
  const supabase = await createClient()

  // 1. Auth Check
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  // 2. Fetch Reviews
  let query = supabase
    .from('reviews')
    .select('*, profiles(username, avatar_url)')
    .order('created_at', { ascending: false })

  // Filter by tag
  if (searchParams.tag) {
    const tag = decodeURIComponent(searchParams.tag)
    query = query.contains('tags', [tag])
  }

  // Filter by cuisine
  if (searchParams.cuisine) {
    const cuisine = `#${decodeURIComponent(searchParams.cuisine)}`
    query = query.contains('tags', [cuisine])
  }

  // Search by content
  if (searchParams.q) {
    const searchTerm = decodeURIComponent(searchParams.q)
    query = query.ilike('content', `%${searchTerm}%`)
  }

  const { data: reviews, error } = await query

  if (error) {
    console.error('Error fetching reviews:', error)
  }

  // 3. Revalidation Action (passed to client component to trigger refresh)
  async function refreshFeed() {
    'use server'
    revalidatePath('/')
  }

  return (
    <main className="min-h-screen bg-zinc-50 lg:bg-stone-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex gap-6 px-4 lg:py-8 pt-20 pb-28">
        {/* Left Sidebar (Desktop) */}
        <LeftSidebar />

        {/* Main Feed */}
        <div className="flex-1 min-w-0 max-w-2xl mx-auto w-full">
          {/* Feed Header */}
          <div className="mb-6 flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-900">
               {searchParams.q ? `🔍 "${decodeURIComponent(searchParams.q)}"` : searchParams.cuisine ? `🍜 ${decodeURIComponent(searchParams.cuisine)}` : searchParams.tag ? `🏷️ ${decodeURIComponent(searchParams.tag)}` : '🔥 实时广场'}
            </h2>
            {(searchParams.tag || searchParams.cuisine || searchParams.q) && (
                <a href="/" className="text-sm text-zinc-400 hover:text-orange-500 ml-2">清除筛选</a>
            )}
          </div>

          {/* Search Bar */}
          <SearchBar />

          {/* Publisher */}
          <Publisher session={session} onPostSuccess={refreshFeed} />

          {/* Timeline */}
          <div className="space-y-4">
              {reviews?.map((review: any) => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  currentUserId={session?.user.id}
                  onDelete={refreshFeed}
                />
              ))}
              
              {(!reviews || reviews.length === 0) && (
                <div className="text-center py-20 text-zinc-400">
                  <div className="bg-zinc-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UtensilsCrossed className="w-10 h-10 text-zinc-300" />
                  </div>
                  <p className="text-lg font-medium text-zinc-600">还没人动筷子？</p>
                  <p className="text-sm text-orange-500 mt-2">你来发第一条评价吧！✨</p>
                </div>
              )}
          </div>
        </div>

        {/* Right Sidebar (Desktop) */}
        <RightSidebar />
      </div>

      <MobileNavbar />
    </main>
  )
}
