-- ADD_INVITED_BY.sql
-- Run this to Fix "Database error creating new user"

-- 1. Safely add the column if it's missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'invited_by') THEN
        ALTER TABLE public.profiles ADD COLUMN invited_by UUID REFERENCES public.profiles(id);
    END IF;
END $$;

-- 2. Make sure it's nullable (for Genesis users)
ALTER TABLE public.profiles ALTER COLUMN invited_by DROP NOT NULL;

-- 3. Just in case, add image_url if missing (for visual upgrade)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'image_url') THEN
        ALTER TABLE public.profiles ADD COLUMN image_url TEXT;
    END IF;
END $$;
