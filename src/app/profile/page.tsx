import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import LeftSidebar from '@/components/LeftSidebar'
import RightSidebar from '@/components/RightSidebar'
import MobileNavbar from '@/components/MobileNavbar'
import ProfileView from './ProfileView'

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
    
  // 3. Fetch Stats (using the view we created)
  const { data: stats } = await supabase
    .from('user_stats_view')
    .select('*')
    .eq('user_id', userId)
    .single()

  return (
    <main className="min-h-screen bg-zinc-50 lg:bg-stone-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex gap-6 px-4 lg:py-8 pt-20 pb-28">
        <LeftSidebar />

        <div className="flex-1 min-w-0 max-w-2xl mx-auto w-full">
            <ProfileView 
                profile={profile} 
                stats={stats} 
                userId={userId} 
            />
            
            <div className="mt-12 text-center text-xs text-zinc-300 font-light">
                Designed & Built by FoodMemo Team
            </div>
        </div>

        <RightSidebar />
      </div>

      <MobileNavbar />
    </main>
  )
}
