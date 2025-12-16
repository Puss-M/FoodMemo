-- Phase 3: Achievement System

-- 1. Create achievements table (predefined badges)
create table if not exists public.achievements (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  title text not null,
  description text not null,
  icon text not null, -- emoji or icon class
  requirement_type text not null, -- 'reviews_count', 'likes_received', 'bookmarks_made', etc.
  requirement_value int not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create user_achievements table (unlocked badges)
create table if not exists public.user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  achievement_id uuid references public.achievements(id) on delete cascade not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, achievement_id)
);

-- Enable RLS
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

-- Policies for achievements (read-only for all)
drop policy if exists "Anyone can view achievements" on public.achievements;
create policy "Anyone can view achievements"
  on public.achievements for select
  using (true);

-- Policies for user_achievements
drop policy if exists "Users can view all user achievements" on public.user_achievements;
create policy "Users can view all user achievements"
  on public.user_achievements for select
  using (true);

drop policy if exists "System can insert achievements" on public.user_achievements;
create policy "System can insert achievements"
  on public.user_achievements for insert
  with check (true); -- Will be managed by function/trigger

-- 3. Seed achievements data
insert into public.achievements (name, title, description, icon, requirement_type, requirement_value) values
('first_review', '初试牛刀', '发布第一条评价', '🌱', 'reviews_count', 1),
('foodie_explorer', '美食探索者', '发布 10 条评价', '🍜', 'reviews_count', 10),
('review_master', '点评达人', '发布 50 条评价', '⭐', 'reviews_count', 50),
('gourmet_legend', '美食传说', '发布 100 条评价', '👑', 'reviews_count', 100),
('liked_beginner', '初获认可', '获得 10 个赞', '❤️', 'likes_received', 10),
('liked_expert', '人气王者', '获得 100 个赞', '🔥', 'likes_received', 100),
('collector', '收藏家', '收藏 20 个地点', '🔖', 'bookmarks_made', 20),
('social_butterfly', '社交达人', '关注 10 个用户', 'following_count', 10)
on conflict (name) do nothing;
