-- FIX_SCHEMA_V9.sql
-- 修复：强制添加 comments 表缺少的字段

-- 1. 添加 reply_to_user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' 
        AND column_name = 'reply_to_user_id'
    ) THEN
        ALTER TABLE public.comments ADD COLUMN reply_to_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. 添加 reply_to_comment_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' 
        AND column_name = 'reply_to_comment_id'
    ) THEN
        ALTER TABLE public.comments ADD COLUMN reply_to_comment_id uuid REFERENCES public.comments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. 强制刷新 Schema Cache
NOTIFY pgrst, 'reload config';

SELECT '✅ 数据库修复完成：comments 表字段已补充' as status;
