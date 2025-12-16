-- TEMPORARY FIX: Create a universal invite code JLW3JY
-- This allows anyone to register with this code while you debug the system

-- Step 1: Create a temporary "system" user with invite code JLW3JY
-- First, check if a user with this invite code already exists
DO $$
DECLARE
  temp_user_id UUID;
BEGIN
  -- Check if invite code already exists
  SELECT id INTO temp_user_id FROM public.profiles WHERE invite_code = 'JLW3JY';
  
  IF temp_user_id IS NULL THEN
    -- Create a system user in auth.users (you'll need to do this manually in Supabase Auth)
    -- For now, just insert into profiles directly with a dummy UUID
    temp_user_id := '00000000-0000-0000-0000-000000000001'::uuid;
    
    INSERT INTO public.profiles (id, username, avatar_url, invite_code, invited_by)
    VALUES (
      temp_user_id,
      'FoodMemo System',
      'https://api.dicebear.com/7.x/initials/svg?seed=FoodMemo',
      'JLW3JY',
      NULL
    )
    ON CONFLICT (id) DO UPDATE 
    SET invite_code = 'JLW3JY';
    
    RAISE NOTICE 'Created system user with invite code JLW3JY';
  ELSE
    RAISE NOTICE 'Invite code JLW3JY already exists for user %', temp_user_id;
  END IF;
END $$;

-- Step 2: Verify it was created
SELECT id, username, invite_code FROM public.profiles WHERE invite_code = 'JLW3JY';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Universal invite code JLW3JY is ready!';
  RAISE NOTICE 'Anyone can now register using this code.';
  RAISE NOTICE '==============================================';
END $$;
