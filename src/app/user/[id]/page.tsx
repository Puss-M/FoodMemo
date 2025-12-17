import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import LeftSidebar from '@/components/LeftSidebar'
import RightSidebar from '@/components/RightSidebar'
import MobileNavbar from '@/components/MobileNavbar'
import PublicProfileView from '@/components/PublicProfileView'

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) {
    notFound()
  }

  // Fetch stats (reusing logic from profile page essentially)
  const { count: postsCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', id)

  const { count: likesReceived } = await supabase
    .from('fm_likes')
    .select('*', { count: 'exact', head: true })
    .in('review_id', (
      await supabase.from('reviews').select('id').eq('user_id', id)
    ).data?.map((r: any) => r.id) || [])

  const { count: bookmarksMade } = await supabase
    .from('fm_bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', id)

  const { count: followersCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', id)

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', id)

  const stats = {
    total_posts: postsCount || 0,
    total_likes_received: likesReceived || 0,
    total_bookmarks_made: bookmarksMade || 0,
    followers_count: followersCount || 0,
    following_count: followingCount || 0
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto pt-20 px-4">
        <div className="flex gap-6">
          <LeftSidebar />
          
          <div className="flex-1 max-w-2xl min-w-0">
             <PublicProfileView 
                profile={profile} 
                stats={stats} 
                profileId={id}
             />
          </div>

          <RightSidebar />
        </div>
      </div>

      <MobileNavbar />
    </main>
  )
}
