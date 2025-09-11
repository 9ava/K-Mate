-- =========================================================
-- K-Mate 데이터베이스 뷰 생성
-- 조회 편의를 위한 뷰들
-- =========================================================

-- 호환성 옵션
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- 뷰 (조회 편의)
-- =========================================================

-- community 전용 뷰 (댓글/좋아요/스크랩 카운트)
DROP VIEW IF EXISTS community_posts;
CREATE VIEW community_posts AS
SELECT
  p.*,
  u.name AS author_name,
  u.role AS author_role,
  u.avatar_url AS author_avatar_url,
  (SELECT COUNT(*) FROM interactions i
    WHERE i.target_type='post' AND i.target_id=p.id AND i.interaction_type='scrap') AS scrap_count,
  (SELECT COUNT(*) FROM interactions i
    WHERE i.target_type='post' AND i.target_id=p.id AND i.interaction_type='like') AS like_count,
  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
FROM posts p
JOIN users u ON p.author_id = u.id
WHERE p.post_type = 'community'
ORDER BY p.created_at DESC;

-- tips 전용 뷰 (상호작용/댓글 금지이므로 카운트 0)
DROP VIEW IF EXISTS tips_posts;
CREATE VIEW tips_posts AS
SELECT
  p.*,
  u.name AS author_name,
  u.role AS author_role,
  u.avatar_url AS author_avatar_url,
  0 AS scrap_count,
  0 AS like_count,
  0 AS comment_count
FROM posts p
JOIN users u ON p.author_id = u.id
WHERE p.post_type = 'tips'
ORDER BY p.created_at DESC;

-- trend 전용 뷰 (댓글/좋아요/스크랩 허용)
DROP VIEW IF EXISTS trend_posts;
CREATE VIEW trend_posts AS
SELECT
  p.*,
  u.name AS author_name,
  u.role AS author_role,
  u.avatar_url AS author_avatar_url,
  (SELECT COUNT(*) FROM interactions i
    WHERE i.target_type='post' AND i.target_id=p.id AND i.interaction_type='scrap') AS scrap_count,
  (SELECT COUNT(*) FROM interactions i
    WHERE i.target_type='post' AND i.target_id=p.id AND i.interaction_type='like') AS like_count,
  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
FROM posts p
JOIN users u ON p.author_id = u.id
WHERE p.post_type = 'trend'
ORDER BY p.created_at DESC;

-- 전체 통합 뷰 (타입 혼합)
DROP VIEW IF EXISTS user_posts;
CREATE VIEW user_posts AS
SELECT
  p.*,
  u.name AS author_name,
  u.role AS author_role,
  u.avatar_url AS author_avatar_url,
  -- tips에는 상호작용이 생성되지 않으므로 결과적으로 0이 됨
  (SELECT COUNT(*) FROM interactions i
    WHERE i.target_type='post' AND i.target_id=p.id AND i.interaction_type='scrap') AS scrap_count,
  (SELECT COUNT(*) FROM interactions i
    WHERE i.target_type='post' AND i.target_id=p.id AND i.interaction_type='like') AS like_count,
  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
FROM posts p
JOIN users u ON p.author_id = u.id
ORDER BY p.created_at DESC;

-- 사용자별 상호작용 통계 뷰
DROP VIEW IF EXISTS user_interaction_stats;
CREATE VIEW user_interaction_stats AS
SELECT
  u.id AS user_id,
  u.name AS user_name,
  u.role AS user_role,
  COUNT(CASE WHEN i.interaction_type = 'like' THEN 1 END) AS total_likes_given,
  COUNT(CASE WHEN i.interaction_type = 'scrap' THEN 1 END) AS total_scraps_given,
  COUNT(CASE WHEN i.interaction_type = 'bookmark' THEN 1 END) AS total_bookmarks_given,
  COUNT(CASE WHEN i.target_type = 'post' THEN 1 END) AS total_post_interactions,
  COUNT(CASE WHEN i.target_type = 'place' THEN 1 END) AS total_place_interactions
FROM users u
LEFT JOIN interactions i ON u.id = i.user_id
GROUP BY u.id, u.name, u.role;

-- 게시글별 상호작용 통계 뷰
DROP VIEW IF EXISTS post_interaction_stats;
CREATE VIEW post_interaction_stats AS
SELECT
  p.id AS post_id,
  p.title AS post_title,
  p.post_type AS post_type,
  p.author_id AS author_id,
  u.name AS author_name,
  COUNT(CASE WHEN i.interaction_type = 'like' THEN 1 END) AS like_count,
  COUNT(CASE WHEN i.interaction_type = 'scrap' THEN 1 END) AS scrap_count,
  COUNT(c.id) AS comment_count,
  p.view_count AS view_count,
  p.created_at AS created_at
FROM posts p
LEFT JOIN interactions i ON p.id = i.target_id AND i.target_type = 'post'
LEFT JOIN comments c ON p.id = c.post_id
LEFT JOIN users u ON p.author_id = u.id
GROUP BY p.id, p.title, p.post_type, p.author_id, u.name, p.view_count, p.created_at
ORDER BY p.created_at DESC;
