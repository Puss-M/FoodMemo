-- Invitation Code System Migration
-- This adds invite code tracking to profiles table

-- 1. Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS invite_code_generated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create function to generate random invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude confusing chars: 0,O,1,I,l
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. Generate invite codes for existing users
DO $$
DECLARE
  user_record RECORD;
  new_code TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER;
BEGIN
  FOR user_record IN SELECT id FROM public.profiles WHERE invite_code IS NULL LOOP
    attempt := 0;
    LOOP
      new_code := generate_invite_code();
      
      -- Try to update with this code
      BEGIN
        UPDATE public.profiles 
        SET invite_code = new_code,
            invite_code_generated_at = NOW()
        WHERE id = user_record.id;
        
        EXIT; -- Success, exit loop
      EXCEPTION WHEN unique_violation THEN
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
          RAISE EXCEPTION 'Failed to generate unique invite code after % attempts for user %', max_attempts, user_record.id;
        END IF;
        -- Try again with new code
      END;
    END LOOP;
  END LOOP;
END $$;

-- 4. Make invite_code NOT NULL after generating for existing users
ALTER TABLE public.profiles 
ALTER COLUMN invite_code SET NOT NULL;

-- 5. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_invite_code ON public.profiles(invite_code);
CREATE INDEX IF NOT EXISTS idx_profiles_invited_by ON public.profiles(invited_by);

-- 6. Create trigger to auto-generate invite code for new users
CREATE OR REPLACE FUNCTION auto_generate_invite_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  -- Only generate if invite_code is not already set
  IF NEW.invite_code IS NULL THEN
    LOOP
      new_code := generate_invite_code();
      
      -- Check if code already exists
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE invite_code = new_code) THEN
        NEW.invite_code := new_code;
        NEW.invite_code_generated_at := NOW();
        EXIT;
      END IF;
      
      attempt := attempt + 1;
      IF attempt >= max_attempts THEN
        RAISE EXCEPTION 'Failed to generate unique invite code after % attempts', max_attempts;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_invite_code ON public.profiles;
CREATE TRIGGER trigger_auto_generate_invite_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_invite_code();

-- 7. Add comment for documentation
COMMENT ON COLUMN public.profiles.invite_code IS 'Unique invitation code for this user to invite others';
COMMENT ON COLUMN public.profiles.invited_by IS 'User ID of who invited this user (NULL for genesis users)';
COMMENT ON COLUMN public.profiles.invite_code_generated_at IS 'Timestamp when invite code was generated';
