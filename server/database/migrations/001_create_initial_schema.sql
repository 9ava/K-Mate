-- =========================================================
-- K-Mate 데이터베이스 초기 스키마 생성
-- =========================================================

-- 호환성 옵션
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- 1) users - 사용자 테이블
-- =========================================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  google_sub VARCHAR(64) NOT NULL UNIQUE,        -- Google OAuth 'sub'
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(512) DEFAULT NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_role (role),
  INDEX idx_email (email),
  INDEX idx_google_sub (google_sub)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 2) places - 장소 테이블 (Google Place 기반)
-- =========================================================
DROP TABLE IF EXISTS places;
CREATE TABLE places (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  google_place_id VARCHAR(128) NOT NULL UNIQUE,     -- Google Place 고유 ID
  name VARCHAR(255) NOT NULL,                       -- 장소명
  address VARCHAR(255) DEFAULT NULL,                -- 주소
  lat DECIMAL(9,6) NOT NULL,                        -- 위도
  lng DECIMAL(9,6) NOT NULL,                        -- 경도
  phone VARCHAR(50) DEFAULT NULL,                   -- 전화번호
  website VARCHAR(255) DEFAULT NULL,                -- 웹사이트
  google_maps_url VARCHAR(512) DEFAULT NULL,        -- Google Maps 공유 URL
  opening_hours_json JSON DEFAULT NULL,             -- 운영시간 JSON
  photos_json JSON DEFAULT NULL,                    -- 사진 메타 JSON 배열
  description TEXT DEFAULT NULL,                    -- 설명(editorialSummary)
  last_synced_at DATETIME DEFAULT NULL,             -- 마지막 동기화 시점
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_google_place_id (google_place_id),
  INDEX idx_name (name),
  INDEX idx_lat_lng (lat, lng)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 3) place_bookmarks - 장소 북마크 테이블
-- =========================================================
DROP TABLE IF EXISTS place_bookmarks;
CREATE TABLE place_bookmarks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  place_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_user_place (user_id, place_id),
  INDEX idx_user_id (user_id),
  INDEX idx_place_id (place_id),

  CONSTRAINT fk_place_bookmarks_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_place_bookmarks_place
    FOREIGN KEY (place_id) REFERENCES places(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 4) posts - 게시글 테이블 (단일 테이블, 타입 분기)
-- =========================================================
DROP TABLE IF EXISTS posts;
CREATE TABLE posts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  author_id BIGINT UNSIGNED NOT NULL,                      -- 작성자
  title VARCHAR(200) NOT NULL,
  content LONGTEXT NOT NULL,
  post_type ENUM('community','tips','trend') NOT NULL,     -- 유형
  category ENUM('travel_tip','food_review','cafe_review','general') NULL,
  status ENUM('published','draft','hidden') NOT NULL DEFAULT 'published',
  view_count INT DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_posts_user FOREIGN KEY (author_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_post_type (post_type),
  INDEX idx_author_id (author_id),
  INDEX idx_status (status),
  INDEX idx_type_status_created (post_type, status, created_at),
  INDEX idx_type_category_created (post_type, category, created_at),
  INDEX idx_title (title),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 5) comments - 댓글 테이블
--    정책: community ✅, trend ✅ / tips ❌
-- =========================================================
DROP TABLE IF EXISTS comments;
CREATE TABLE comments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_post_id (post_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 6) interactions - 상호작용 통합 테이블
--    정책:
--      - bookmark → place 전용
--      - like,scrap → post 전용 (단, post_type in ('community','trend')에서만 허용)
-- =========================================================
DROP TABLE IF EXISTS interactions;
CREATE TABLE interactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  interaction_type ENUM('like','scrap','bookmark') NOT NULL,
  target_type ENUM('post','place') NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_interaction (user_id, interaction_type, target_type, target_id),
  CONSTRAINT fk_interactions_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_user_id (user_id),
  INDEX idx_target (target_type, target_id),
  INDEX idx_interaction_type (interaction_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
