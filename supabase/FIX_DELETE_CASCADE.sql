-- FIX_DELETE_CASCADE.sql
-- 修复删除帖子时的外键约束问题
-- Run this in Supabase SQL Editor

-- 1. 删除旧的外键约束
ALTER TABLE public.fm_likes 
DROP CONSTRAINT IF EXISTS fm_likes_review_id_fkey;

-- 2. 重新添加带 CASCADE 的外键
ALTER TABLE public.fm_likes 
ADD CONSTRAINT fm_likes_review_id_fkey 
FOREIGN KEY (review_id) 
REFERENCES public.reviews(id) 
ON DELETE CASCADE;

-- 3. 同样修复 fm_bookmarks（如果有的话）
ALTER TABLE public.fm_bookmarks 
DROP CONSTRAINT IF EXISTS fm_bookmarks_review_id_fkey;

ALTER TABLE public.fm_bookmarks 
ADD CONSTRAINT fm_bookmarks_review_id_fkey 
FOREIGN KEY (review_id) 
REFERENCES public.reviews(id) 
ON DELETE CASCADE;

-- 4. 修复 comments（如果有的话）
ALTER TABLE public.comments 
DROP CONSTRAINT IF EXISTS comments_review_id_fkey;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_review_id_fkey 
FOREIGN KEY (review_id) 
REFERENCES public.reviews(id) 
ON DELETE CASCADE;

SELECT '✅ 级联删除已修复！现在可以删除帖子了' AS status;
