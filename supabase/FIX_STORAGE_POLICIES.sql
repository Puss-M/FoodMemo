-- FIX_STORAGE_POLICIES.sql
-- 修复图片上传权限问题
-- Run this in Supabase SQL Editor

-- 1. 确保 fm-images bucket 的 RLS 策略正确

-- 允许已认证用户上传文件
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'Allow authenticated uploads',
  'fm-images',
  'INSERT',
  'auth.role() = ''authenticated'''
)
ON CONFLICT (name, bucket_id) DO NOTHING;

-- 允许公开读取
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'Allow public read',
  'fm-images',
  'SELECT',
  'true'
)
ON CONFLICT (name, bucket_id) DO NOTHING;

-- 允许用户删除自己的文件
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'Allow users to delete own files',
  'fm-images',
  'DELETE',
  'auth.uid()::text = (storage.foldername(name))[1]'
)
ON CONFLICT (name, bucket_id) DO NOTHING;
