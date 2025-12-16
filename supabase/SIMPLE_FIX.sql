-- SIMPLEST FIX - Just run these 2 lines
-- The problem is RLS (Row Level Security) blocking the trigger

-- Option 1: Disable RLS completely (EASIEST)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- That's it! Now try registering again.

-- If you want to re-enable RLS later (after testing):
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
