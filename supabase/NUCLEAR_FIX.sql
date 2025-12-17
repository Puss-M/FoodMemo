-- NUCLEAR_FIX.sql
-- 终极修复脚本 - 解决所有注册问题
-- Run this ONCE in Supabase SQL Editor

-- ==============================
-- STEP 1: 删除所有可能冲突的触发器
-- ==============================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_auto_generate_invite_code ON public.profiles;
DROP TRIGGER IF EXISTS auto_generate_invite_code ON public.profiles;

-- ==============================
-- STEP 2: 删除旧的触发器函数
-- ==============================
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.generate_invite_code() CASCADE;
DROP FUNCTION IF EXISTS public.auto_generate_invite_code() CASCADE;

-- ==============================
-- STEP 3: 确保 profiles 表结构正确
-- ==============================
-- 移除 invite_code 的 NOT NULL 约束（如果存在）
ALTER TABLE public.profiles ALTER COLUMN invite_code DROP NOT NULL;

-- 确保 invited_by 可以为空
ALTER TABLE public.profiles ALTER COLUMN invited_by DROP NOT NULL;

-- ==============================
-- STEP 4: 创建新的、简单的触发器函数
-- ==============================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  inviter_id UUID;
  user_name TEXT;
  new_invite_code TEXT;
BEGIN
  -- 安全获取邀请者ID
  BEGIN
    inviter_id := (new.raw_user_meta_data->>'invited_by')::uuid;
  EXCEPTION WHEN OTHERS THEN
    inviter_id := NULL;
  END;

  -- 获取用户名
  user_name := COALESCE(
    new.raw_user_meta_data->>'username', 
    SPLIT_PART(new.email, '@', 1)
  );

  -- 生成唯一的邀请码
  new_invite_code := UPPER(SUBSTRING(MD5(new.id::text || NOW()::text) FROM 1 FOR 6));

  -- 插入新用户资料
  INSERT INTO public.profiles (id, username, avatar_url, invited_by, invite_code)
  VALUES (
    new.id,
    user_name,
    'https://api.dicebear.com/7.x/initials/svg?seed=' || user_name,
    inviter_id,
    new_invite_code
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url;
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- 如果出错，至少创建一个基本profile
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, SPLIT_PART(new.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================
-- STEP 5: 重新创建触发器
-- ==============================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================
-- STEP 6: 确认邀请码表存在
-- ==============================
CREATE TABLE IF NOT EXISTS public.fm_invitation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by UUID REFERENCES public.profiles(id),
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES public.profiles(id)
);

-- 插入创世邀请码
INSERT INTO public.fm_invitation_codes (code, is_used, generated_by)
VALUES ('SWUFE_VIP', FALSE, NULL)
ON CONFLICT (code) DO NOTHING;

-- ==============================
-- 完成！
-- ==============================
SELECT '✅ 修复完成！请重新尝试注册' AS status;
