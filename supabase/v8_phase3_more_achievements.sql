-- Phase 3 Extended: More Achievement Badges

-- Add more diverse achievement badges
insert into public.achievements (name, title, description, icon, requirement_type, requirement_value) values

-- 菜系探索类徽章
('cocktail_lover', '调酒大师', '发布 5 条调酒相关评价', '🍸', 'cuisine_reviews', 5),
('hotpot_king', '火锅之王', '发布 10 条火锅相关评价', '🍲', 'cuisine_reviews', 10),
('bbq_master', '烧烤达人', '发布 5 条烧烤相关评价', '🍖', 'cuisine_reviews', 5),
('dessert_hunter', '甜点猎人', '发布 5 条甜点相关评价', '🍰', 'cuisine_reviews', 5),
('coffee_addict', '咖啡成瘾', '发布 5 条咖啡相关评价', '☕', 'cuisine_reviews', 5),
('tea_lover', '奶茶星人', '发布 5 条奶茶相关评价', '🧋', 'cuisine_reviews', 5),
('world_cuisine', '环球美食家', '尝试 8 种不同菜系', '🌍', 'cuisine_variety', 8),

-- 活跃度徽章
('early_bird', '早起的鸟儿', '在早上 7 点前发布评价', '🌅', 'time_based', 7),
('night_owl', '夜猫子', '在凌晨后发布评价', '🦉', 'time_based', 0),
('weekly_streak', '周活跃达人', '连续 7 天发布评价', '📅', 'streak', 7),
('monthly_streak', '月度坚持', '连续 30 天发布评价', '🏆', 'streak', 30),

-- 互动类徽章
('helpful_reviewer', '热心评价者', '收到 50 条收藏', '💡', 'bookmarks_received', 50),
('influencer', '美食影响者', '获得 500 个赞', '🌟', 'likes_received', 500),
('super_fan', '超级粉丝', '收藏 50 个地点', '📚', 'bookmarks_made', 50),
('network_builder', '人脉王', '关注 50 个用户', '🤝', 'following_count', 50),
('popular_star', '人气之星', '拥有 20 个粉丝', '✨', 'followers_count', 20),
('mega_star', '超级明星', '拥有 100 个粉丝', '💫', 'followers_count', 100),

-- 里程碑徽章
('photo_master', '摄影达人', '上传 50 张美食图片', '📷', 'photos_count', 50),
('review_veteran', '资深点评师', '发布 200 条评价', '🎖️', 'reviews_count', 200),
('legendary_foodie', '传奇吃货', '发布 500 条评价', '🏅', 'reviews_count', 500),

-- 特殊场景徽章
('solo_explorer', '独行侠', '发布 10 条一人食评价', '🚶', 'scenario_reviews', 10),
('date_expert', '约会专家', '发布 5 条约会场景评价', '💑', 'scenario_reviews', 5),
('party_planner', '聚会策划师', '发布 10 条聚餐相关评价', '🎉', 'scenario_reviews', 10),
('business_gourmet', '商务美食家', '发布 5 条商务场景评价', '💼', 'scenario_reviews', 5),

-- 避雷/推荐类徽章  
('warning_hero', '避雷英雄', '发布 10 条避雷评价', '⚡', 'tag_reviews', 10),
('recommendation_king', '推荐之王', '发布 30 条推荐评价', '👍', 'tag_reviews', 30),
('campus_guide', '校园美食向导', '发布 20 条食堂评价', '🏫', 'tag_reviews', 20),

-- 地点探索徽章
('location_explorer', '地点探索者', '标记 10 个不同地点', '📍', 'locations_count', 10),
('city_mapper', '城市美食地图', '标记 30 个不同地点', '🗺️', 'locations_count', 30)

on conflict (name) do nothing;
