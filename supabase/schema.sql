-- FoodMemo Schema (可重复运行)

-- 1. 用户表 (扩展 Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  username text not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 邀请码表 (控制注册门槛) - 可复用模式
create table if not exists public.invitation_codes (
  id serial primary key,
  code text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 美食笔记表 (核心内容)
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  image_url text,
  tags text[],
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 启用
alter table public.profiles enable row level security;
alter table public.invitation_codes enable row level security;
alter table public.reviews enable row level security;

-- 清理旧 Policies (避免重复运行报错)
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Invitation codes are viewable by everyone" on public.invitation_codes;
drop policy if exists "Reviews are viewable by everyone" on public.reviews;
drop policy if exists "Users can insert reviews" on public.reviews;
drop policy if exists "Users can update own reviews" on public.reviews;

-- 创建 Policies
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Invitation codes are viewable by everyone" on public.invitation_codes for select using (true);

create policy "Reviews are viewable by everyone" on public.reviews for select using (true);
create policy "Users can insert reviews" on public.reviews for insert with check (auth.uid() = user_id);
create policy "Users can update own reviews" on public.reviews for update using (auth.uid() = user_id);

-- � 自动创建 Profile 的触发器 (解决 RLS 问题)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    'https://api.dicebear.com/7.x/initials/svg?seed=' || coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- 删除旧触发器（如果存在）
drop trigger if exists on_auth_user_created on auth.users;

-- 创建触发器：用户注册时自动创建 profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- �🔐 预设邀请码
INSERT INTO public.invitation_codes (code) VALUES 
  ('SWUFE_VIP'),
  ('FOODIE2025')
ON CONFLICT (code) DO NOTHING;
