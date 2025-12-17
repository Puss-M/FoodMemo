-- V9_SCHEMA.sql
-- FoodMemo v9.0 数据库迁移
-- Run in Supabase SQL Editor

-- ============================================
-- 1. 改造 Reviews 表支持多图
-- ============================================
-- 先检查 image_url 列的类型，如果是 text 则转为 text[]
DO $$
BEGIN
    -- Check if image_url exists and is text type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reviews' 
        AND column_name = 'image_url' 
        AND data_type = 'text'
    ) THEN
        -- Add new column for array
        ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS image_urls text[];
        -- Migrate existing data
        UPDATE public.reviews SET image_urls = ARRAY[image_url] WHERE image_url IS NOT NULL AND image_urls IS NULL;
    END IF;

    -- Add image_urls if it doesn't exist at all
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reviews' 
        AND column_name = 'image_urls'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN image_urls text[];
    END IF;
END $$;

-- ============================================
-- 2. 新建评论表 (Comments)
-- ============================================
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  reply_to_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reply_to_comment_id uuid REFERENCES public.comments(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 3. 新建私信表 (Messages)
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 4. 开启 Realtime (即时聊天)
-- ============================================
DO $$
BEGIN
    -- Try to add to realtime publication
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Already added
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- ============================================
-- 5. RLS 策略
-- ============================================
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Comments policies
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users can add comments" ON public.comments;
CREATE POLICY "Auth users can add comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
DROP POLICY IF EXISTS "Users can see own messages" ON public.messages;
CREATE POLICY "Users can see own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can mark messages read" ON public.messages;
CREATE POLICY "Users can mark messages read" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- ============================================
-- 完成
-- ============================================
SELECT '✅ v9.0 数据库迁移完成' AS status;
