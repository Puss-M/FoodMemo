-- 1. Create Bookmarks Table (Safe)
create table if not exists public.fm_bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  review_id uuid references public.reviews not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, review_id)
);

-- Enable RLS
alter table public.fm_bookmarks enable row level security;

-- Policies (Drop first to avoid errors)
drop policy if exists "Users can bookmark any review" on public.fm_bookmarks;
create policy "Users can bookmark any review"
  on public.fm_bookmarks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own bookmarks" on public.fm_bookmarks;
create policy "Users can remove their own bookmarks"
  on public.fm_bookmarks for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view their own bookmarks" on public.fm_bookmarks;
create policy "Users can view their own bookmarks"
  on public.fm_bookmarks for select
  using (auth.uid() = user_id);

-- 2. User Stats View (Safe)
create or replace view public.user_stats_view as
select 
  p.id as user_id,
  (select count(*) from public.reviews r where r.user_id = p.id) as total_posts,
  (select count(*) from public.fm_likes l join public.reviews r on l.review_id = r.id where r.user_id = p.id) as total_likes_received,
  (select count(*) from public.fm_bookmarks b where b.user_id = p.id) as total_bookmarks_made
from public.profiles p;

-- Grant access
grant select on public.user_stats_view to authenticated;
grant select on public.user_stats_view to anon;
