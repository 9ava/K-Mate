-- ==============================================
-- K-Buzz ERD 마이그레이션 - 006_create_views.sql
-- 뷰(View) 구조 - 단순화
-- ==============================================

-- K-Mate 뷰 생성
-- 복잡한 쿼리를 단순화하고 자주 사용되는 데이터 조합을 미리 정의
-- 실시간 통계 계산을 통해 데이터 일관성 보장

-- ==============================================
-- 1. community_posts 뷰 - 커뮤니티 게시글
-- ==============================================
-- 목적: 커뮤니티 게시글과 관련 정보를 통합하여 제공
-- 특징: 작성자 정보와 실시간 통계(스크랩수, 좋아요수) 포함

CREATE OR REPLACE VIEW `community_posts` AS
SELECT 
  p.*,                    -- posts 테이블의 모든 컬럼
  u.name as author_name,  -- 작성자 이름 (users 테이블에서 가져옴)
  u.role as author_role,  -- 작성자 권한 (users 테이블에서 가져옴)
  -- 실시간 스크랩수 계산: interactions 테이블에서 해당 게시글의 스크랩 수 집계
  (SELECT COUNT(*) FROM interactions i WHERE i.target_type = 'post' AND i.target_id = p.id AND i.interaction_type = 'scrap') as scrap_count,
  -- 실시간 좋아요수 계산: interactions 테이블에서 해당 게시글의 좋아요 수 집계
  (SELECT COUNT(*) FROM interactions i WHERE i.target_type = 'post' AND i.target_id = p.id AND i.interaction_type = 'like') as like_count
FROM posts p 
JOIN users u ON p.author_id = u.id  -- 작성자 정보와 조인
WHERE p.post_type = 'community'     -- 커뮤니티 게시글만 필터링
ORDER BY p.created_at DESC;         -- 최신순으로 정렬

-- ==============================================
-- 2. tips_posts 뷰 - 팁 게시글
-- ==============================================
-- 목적: 팁 게시글과 관련 정보를 통합하여 제공
-- 특징: 작성자 정보와 실시간 통계(스크랩수만) 포함 (팁 게시글은 좋아요 기능 없음)

CREATE OR REPLACE VIEW `tips_posts` AS
SELECT 
  p.*,                    -- posts 테이블의 모든 컬럼
  u.name as author_name,  -- 작성자 이름 (users 테이블에서 가져옴)
  u.role as author_role,  -- 작성자 권한 (users 테이블에서 가져옴)
  -- 실시간 스크랩수 계산: interactions 테이블에서 해당 게시글의 스크랩 수 집계
  (SELECT COUNT(*) FROM interactions i WHERE i.target_type = 'post' AND i.target_id = p.id AND i.interaction_type = 'scrap') as scrap_count
  -- 팁 게시글은 좋아요 기능이 없으므로 like_count 제외
FROM posts p 
JOIN users u ON p.author_id = u.id  -- 작성자 정보와 조인
WHERE p.post_type = 'tips'          -- 팁 게시글만 필터링
ORDER BY p.created_at DESC;         -- 최신순으로 정렬

-- ==============================================
-- 3. user_posts 뷰 - 모든 게시글
-- ==============================================
-- 목적: 모든 게시글과 관련 정보를 통합하여 제공
-- 특징: 작성자 정보와 실시간 통계(스크랩수, 좋아요수) 포함, 전체 게시글 통합 조회

CREATE OR REPLACE VIEW `user_posts` AS
SELECT 
  p.*,                    -- posts 테이블의 모든 컬럼
  u.name as author_name,  -- 작성자 이름 (users 테이블에서 가져옴)
  u.role as author_role,  -- 작성자 권한 (users 테이블에서 가져옴)
  -- 실시간 스크랩수 계산: interactions 테이블에서 해당 게시글의 스크랩 수 집계
  (SELECT COUNT(*) FROM interactions i WHERE i.target_type = 'post' AND i.target_id = p.id AND i.interaction_type = 'scrap') as scrap_count,
  -- 실시간 좋아요수 계산: interactions 테이블에서 해당 게시글의 좋아요 수 집계
  (SELECT COUNT(*) FROM interactions i WHERE i.target_type = 'post' AND i.target_id = p.id AND i.interaction_type = 'like') as like_count
FROM posts p 
JOIN users u ON p.author_id = u.id  -- 작성자 정보와 조인
ORDER BY p.created_at DESC;         -- 모든 게시글을 최신순으로 정렬
