-- FIX_TRIGGER.sql
-- Run this to resolve "Database error creating new user"

-- 1. Make sure 'invited_by' in profiles is NULLABLE
ALTER TABLE public.profiles 
ALTER COLUMN invited_by DROP NOT NULL;

-- 2. Update the Trigger Function to be safer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  inviter_id UUID;
  user_name TEXT;
BEGIN
  -- Safely get metadata
  BEGIN
    inviter_id := (new.raw_user_meta_data->>'invited_by')::uuid;
  EXCEPTION WHEN OTHERS THEN
    inviter_id := NULL;
  END;

  user_name := COALESCE(new.raw_user_meta_data->>'username', 'User ' || SUBSTRING(new.id::text FROM 1 FOR 4));

  -- Insert profile, ignoring conflicts just in case
  INSERT INTO public.profiles (id, username, avatar_url, invited_by)
  VALUES (
    new.id,
    user_name,
    'https://api.dicebear.com/7.x/initials/svg?seed=' || user_name,
    inviter_id
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url,
    invited_by = EXCLUDED.invited_by;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure Trigger exists and is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
