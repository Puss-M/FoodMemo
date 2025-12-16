-- COMPLETE FIX: Supabase registration error
-- This fixes the trigger order and invite_code generation issue

-- Step 1: Make invite_code temporarily NULLABLE during migration
ALTER TABLE public.profiles 
ALTER COLUMN invite_code DROP NOT NULL;

-- Step 2: Drop ALL related triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_auto_generate_invite_code ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS auto_generate_invite_code();
DROP FUNCTION IF EXISTS generate_invite_code();

-- Step 3: Recreate invite code generation function
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create BEFORE INSERT trigger for invite_code
CREATE OR REPLACE FUNCTION auto_generate_invite_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  IF NEW.invite_code IS NULL THEN
    LOOP
      new_code := generate_invite_code();
      
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE invite_code = new_code) THEN
        NEW.invite_code := new_code;
        NEW.invite_code_generated_at := NOW();
        EXIT;
      END IF;
      
      attempt := attempt + 1;
      IF attempt >= max_attempts THEN
        RAISE EXCEPTION 'Failed to generate unique invite code';
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_invite_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_invite_code();

-- Step 5: Create AFTER INSERT trigger for user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  inviter_id UUID;
BEGIN
  BEGIN
    inviter_id := (new.raw_user_meta_data->>'invited_by')::uuid;
  EXCEPTION WHEN OTHERS THEN
    inviter_id := NULL;
  END;

  INSERT INTO public.profiles (id, username, avatar_url, invited_by)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1)),
    'https://api.dicebear.com/7.x/initials/svg?seed=' || COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1)),
    inviter_id
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 6: Make invite_code NOT NULL again (after triggers are set up)
ALTER TABLE public.profiles 
ALTER COLUMN invite_code SET NOT NULL;

-- Step 7: Verify setup
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'trigger_auto_generate_invite_code')
ORDER BY event_object_table, action_timing;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Database fix completed successfully!';
  RAISE NOTICE 'Triggers are now properly configured.';
  RAISE NOTICE 'You can register new users now.';
  RAISE NOTICE '==============================================';
END $$;
