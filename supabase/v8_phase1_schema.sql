-- 1. Add bio field to profiles
alter table public.profiles 
add column if not exists bio text;

-- 2. Storage Bucket Setup Instructions
-- You need to create this in Supabase Dashboard manually:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create new bucket: "avatars"
-- 3. Set it to "Public" bucket
-- 4. Add policy to allow authenticated users to upload:

-- Create storage policies for avatars bucket (Run after creating bucket)
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );
