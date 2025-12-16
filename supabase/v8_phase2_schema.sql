-- Phase 2: Social System (Follow/Followers)

-- 1. Create follows table
create table if not exists public.follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (follower_id, following_id),
  check (follower_id != following_id) -- Can't follow yourself
);

-- Enable RLS
alter table public.follows enable row level security;

-- Policies
drop policy if exists "Users can follow others" on public.follows;
create policy "Users can follow others"
  on public.follows for insert
  with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow" on public.follows;
create policy "Users can unfollow"
  on public.follows for delete
  using (auth.uid() = follower_id);

drop policy if exists "Anyone can view follows" on public.follows;
create policy "Anyone can view follows"
  on public.follows for select
  using (true);

-- 2. Update user_stats_view to include follower/following counts
create or replace view public.user_stats_view as
select 
  p.id as user_id,
  (select count(*) from public.reviews r where r.user_id = p.id) as total_posts,
  (select count(*) from public.fm_likes l join public.reviews r on l.review_id = r.id where r.user_id = p.id) as total_likes_received,
  (select count(*) from public.fm_bookmarks b where b.user_id = p.id) as total_bookmarks_made,
  (select count(*) from public.follows f where f.follower_id = p.id) as following_count,
  (select count(*) from public.follows f where f.following_id = p.id) as followers_count
from public.profiles p;
