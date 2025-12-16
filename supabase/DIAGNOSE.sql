-- Quick Diagnostic: Find the exact error
-- Run this in Supabase SQL Editor to see what's failing

-- Test 1: Check if triggers exist and are active
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'trigger_auto_generate_invite_code')
ORDER BY event_object_table, action_timing;

-- Test 2: Manually test invite code generation
SELECT generate_invite_code() as test_code;

-- Test 3: Test profile insertion manually (simulating what trigger does)
DO $$
DECLARE
  test_code TEXT;
BEGIN
  -- Generate a test code
  test_code := generate_invite_code();
  RAISE NOTICE 'Generated code: %', test_code;
  
  -- Try to insert a test profile (will rollback, just testing)
  INSERT INTO public.profiles (id, username, avatar_url, invite_code, invited_by)
  VALUES (
    gen_random_uuid(),
    'test_user',
    'https://example.com/avatar.png',
    test_code,
    NULL
  );
  
  RAISE NOTICE 'Profile insertion succeeded!';
  
  -- Rollback the test
  RAISE EXCEPTION 'Test completed - rolling back';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- Test 4: Check table constraints
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'profiles';

-- Test 5: Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';
