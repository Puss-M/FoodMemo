-- Phase 4: Achievement Auto-Unlock System
-- 勋章自动解锁触发器

-- ============================================
-- 1. 核心检查函数：检查并颁发成就
-- ============================================
create or replace function check_and_grant_achievement(
  p_user_id uuid,
  p_requirement_type text,
  p_current_value int
)
returns void as $$
declare
  achievement_record record;
begin
  -- 遍历所有匹配类型且未解锁的成就
  for achievement_record in
    select a.id, a.name, a.requirement_value
    from public.achievements a
    where a.requirement_type = p_requirement_type
      and a.requirement_value <= p_current_value
      and not exists (
        select 1 from public.user_achievements ua
        where ua.user_id = p_user_id
          and ua.achievement_id = a.id
      )
  loop
    -- 插入解锁记录
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, achievement_record.id)
    on conflict (user_id, achievement_id) do nothing;
    
    -- 可选：记录日志
    raise notice 'Granted achievement % to user %', achievement_record.name, p_user_id;
  end loop;
end;
$$ language plpgsql security definer;


-- ============================================
-- 2. 触发器函数：发布评价后
-- ============================================
create or replace function on_review_insert()
returns trigger as $$
declare
  review_count int;
begin
  -- 计算用户评价总数
  select count(*) into review_count
  from public.reviews
  where user_id = NEW.user_id;
  
  -- 检查 reviews_count 类型的成就
  perform check_and_grant_achievement(NEW.user_id, 'reviews_count', review_count);
  
  return NEW;
end;
$$ language plpgsql security definer;

-- 创建触发器
drop trigger if exists trigger_review_achievement on public.reviews;
create trigger trigger_review_achievement
  after insert on public.reviews
  for each row
  execute function on_review_insert();


-- ============================================
-- 3. 触发器函数：收到点赞后
-- ============================================
create or replace function on_like_insert()
returns trigger as $$
declare
  likes_count int;
  review_owner uuid;
begin
  -- 获取被点赞评价的作者
  select user_id into review_owner
  from public.reviews
  where id = NEW.review_id;
  
  if review_owner is null then
    return NEW;
  end if;
  
  -- 计算该用户收到的总点赞数
  select count(*) into likes_count
  from public.fm_likes l
  join public.reviews r on l.review_id = r.id
  where r.user_id = review_owner;
  
  -- 检查 likes_received 类型的成就
  perform check_and_grant_achievement(review_owner, 'likes_received', likes_count);
  
  return NEW;
end;
$$ language plpgsql security definer;

-- 创建触发器
drop trigger if exists trigger_like_achievement on public.fm_likes;
create trigger trigger_like_achievement
  after insert on public.fm_likes
  for each row
  execute function on_like_insert();


-- ============================================
-- 4. 触发器函数：收藏后
-- ============================================
create or replace function on_bookmark_insert()
returns trigger as $$
declare
  bookmark_count int;
begin
  -- 计算用户收藏总数
  select count(*) into bookmark_count
  from public.fm_bookmarks
  where user_id = NEW.user_id;
  
  -- 检查 bookmarks_made 类型的成就
  perform check_and_grant_achievement(NEW.user_id, 'bookmarks_made', bookmark_count);
  
  return NEW;
end;
$$ language plpgsql security definer;

-- 创建触发器
drop trigger if exists trigger_bookmark_achievement on public.fm_bookmarks;
create trigger trigger_bookmark_achievement
  after insert on public.fm_bookmarks
  for each row
  execute function on_bookmark_insert();


-- ============================================
-- 5. 触发器函数：关注后（双向检查）
-- ============================================
create or replace function on_follow_insert()
returns trigger as $$
declare
  following_count int;
  followers_count int;
begin
  -- 计算关注者的"关注数"
  select count(*) into following_count
  from public.follows
  where follower_id = NEW.follower_id;
  
  -- 检查 following_count 类型的成就（给关注者）
  perform check_and_grant_achievement(NEW.follower_id, 'following_count', following_count);
  
  -- 计算被关注者的"粉丝数"
  select count(*) into followers_count
  from public.follows
  where following_id = NEW.following_id;
  
  -- 检查 followers_count 类型的成就（给被关注者）
  perform check_and_grant_achievement(NEW.following_id, 'followers_count', followers_count);
  
  return NEW;
end;
$$ language plpgsql security definer;

-- 创建触发器
drop trigger if exists trigger_follow_achievement on public.follows;
create trigger trigger_follow_achievement
  after insert on public.follows
  for each row
  execute function on_follow_insert();


-- ============================================
-- 6. 补发历史成就（一次性运行）
-- ============================================
-- 为已有用户根据当前数据补发成就

create or replace function backfill_achievements()
returns void as $$
declare
  user_record record;
  review_count int;
  likes_count int;
  bookmark_count int;
  following_count int;
  followers_count int;
begin
  -- 遍历所有用户
  for user_record in select id from public.profiles loop
    
    -- 评价数量
    select count(*) into review_count
    from public.reviews where user_id = user_record.id;
    perform check_and_grant_achievement(user_record.id, 'reviews_count', review_count);
    
    -- 收到的点赞
    select count(*) into likes_count
    from public.fm_likes l
    join public.reviews r on l.review_id = r.id
    where r.user_id = user_record.id;
    perform check_and_grant_achievement(user_record.id, 'likes_received', likes_count);
    
    -- 收藏数
    select count(*) into bookmark_count
    from public.fm_bookmarks where user_id = user_record.id;
    perform check_and_grant_achievement(user_record.id, 'bookmarks_made', bookmark_count);
    
    -- 关注数
    select count(*) into following_count
    from public.follows where follower_id = user_record.id;
    perform check_and_grant_achievement(user_record.id, 'following_count', following_count);
    
    -- 粉丝数
    select count(*) into followers_count
    from public.follows where following_id = user_record.id;
    perform check_and_grant_achievement(user_record.id, 'followers_count', followers_count);
    
  end loop;
  
  raise notice 'Backfill completed for all users';
end;
$$ language plpgsql security definer;

-- 执行补发（运行一次即可）
select backfill_achievements();

-- 完成后可以删除补发函数（可选）
-- drop function if exists backfill_achievements();
