-- 1. Upgrade Invitation Codes Table
create table if not exists public.fm_invitation_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  generated_by uuid references public.profiles(id), -- Fixed: profiles, not fm_profiles
  is_used boolean default false,
  used_by uuid references public.profiles(id)       -- Fixed: profiles, not fm_profiles
);

-- Add columns if table already exists (for idempotency)
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'fm_invitation_codes' and column_name = 'generated_by') then
    alter table public.fm_invitation_codes add column generated_by uuid references public.profiles(id);
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'fm_invitation_codes' and column_name = 'used_by') then
    alter table public.fm_invitation_codes add column used_by uuid references public.profiles(id);
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'fm_invitation_codes' and column_name = 'is_used') then
    alter table public.fm_invitation_codes add column is_used boolean default false;
  end if;
end $$;

-- 2. Insert Genesis Code
insert into public.fm_invitation_codes (code, is_used, generated_by)
values ('SWUFE_VIP', false, null)
on conflict (code) do nothing;

-- 3. Ensure Reviews table has image_url
-- Fixed: reviews, not fm_reviews
alter table public.reviews 
add column if not exists image_url text;

-- 4. RLS for Invitation Codes
alter table public.fm_invitation_codes enable row level security;

-- Policies for Invitation Codes
do $$ 
begin
    if not exists (select 1 from pg_policies where policyname = 'Users can see codes they generated' and tablename = 'fm_invitation_codes') then
        create policy "Users can see codes they generated"
        on public.fm_invitation_codes for select
        using (auth.uid() = generated_by);
    end if;

    if not exists (select 1 from pg_policies where policyname = 'Users can generate codes' and tablename = 'fm_invitation_codes') then
        create policy "Users can generate codes"
        on public.fm_invitation_codes for insert
        with check (auth.uid() = generated_by);
    end if;
    
    -- We also need to allow users to READ the code they used? Or the invitee?
    -- For now, the 'register' action uses Service Role, so it bypasses RLS.
    -- But 'Profile' page reads 'used_by' (invitee).
    
    -- Allow users to see the profile of the person who used their code (via join in ProfileView)
    -- This technically requires RLS on 'profiles', which usually exists (public read).
end $$;
