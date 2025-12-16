-- Create Likes Table
create table public.fm_likes (
  user_id uuid references auth.users not null,
  review_id uuid references public.reviews not null, -- Fixed: Changed bigint to uuid to match reviews.id
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, review_id)
);

-- Enable RLS
alter table public.fm_likes enable row level security;

-- Policies
create policy "Users can like any review"
  on public.fm_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike their own likes"
  on public.fm_likes for delete
  using (auth.uid() = user_id);

create policy "Anyone can view likes"
  on public.fm_likes for select
  using (true);
