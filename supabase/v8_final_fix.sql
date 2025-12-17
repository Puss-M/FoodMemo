-- v8_final_fix.sql
-- Run this in Supabase SQL Editor to fully set up the Trust Chain tables.

-- 1. Ensure 'profiles' table exists (It should, but checking)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE EXCEPTION 'Table public.profiles does not exist. Please run schema.sql first.';
    END IF;
END $$;

-- 2. Create 'fm_invitation_codes' with correct references
create table if not exists public.fm_invitation_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  
  -- Reference 'profiles', NOT 'fm_profiles'
  generated_by uuid references public.profiles(id),
  
  is_used boolean default false,
  
  -- Reference 'profiles', NOT 'fm_profiles'
  used_by uuid references public.profiles(id)
);

-- 3. Add Genesis Code (Safe Insert)
insert into public.fm_invitation_codes (code, is_used, generated_by)
values ('SWUFE_VIP', false, null)
on conflict (code) do nothing;

-- 4. Update Reviews table (Safe update)
alter table public.reviews 
add column if not exists image_url text;

-- 5. Fix RLS Policies (Safe upsert)
alter table public.fm_invitation_codes enable row level security;

-- Drop existing policies to avoid conflict error on re-run
drop policy if exists "Users can see codes they generated" on public.fm_invitation_codes;
drop policy if exists "Users can generate codes" on public.fm_invitation_codes;

-- Re-create policies
create policy "Users can see codes they generated"
on public.fm_invitation_codes for select
using (auth.uid() = generated_by);

create policy "Users can generate codes"
on public.fm_invitation_codes for insert
with check (auth.uid() = generated_by);
