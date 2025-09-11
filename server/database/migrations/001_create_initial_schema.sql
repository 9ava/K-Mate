-- =========================================================
-- K-Mate 데이터베이스 초기 스키마 생성
-- =========================================================
-- =========================================================
-- 스키마 설정 (필요 시 DB 선택)
-- =========================================================
-- CREATE DATABASE IF NOT EXISTS kmate DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE kmate;

-- 호환성 옵션
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- 1) users - 사용자
-- =========================================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '내부 PK',
  google_sub VARCHAR(64) NOT NULL COMMENT 'Google OAuth sub (고유)',
  email VARCHAR(255) NOT NULL COMMENT '이메일',
  email_verified TINYINT NOT NULL DEFAULT 0 COMMENT '이메일 인증 여부', -- 폭 제거
  -- email_verified BOOLEAN NOT NULL DEFAULT 0  -- 이렇게 써도 OK (BOOLEAN은 TINYINT로 매핑)
  name VARCHAR(100) NOT NULL COMMENT '이름',
  avatar_url VARCHAR(512) NULL COMMENT '프로필 이미지 URL',
  role ENUM('user','admin') NOT NULL DEFAULT 'user' COMMENT '권한',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_google_sub (google_sub),
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 2) places - 장소 (Google Place 기반)
-- =========================================================
DROP TABLE IF EXISTS places;
CREATE TABLE places (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '내부 PK',
  google_place_id VARCHAR(128) NOT NULL COMMENT 'Google Place 고유 ID',
  type ENUM('travel','food','cafe') NULL COMMENT '최종 카테고리(필터용)',
  type_source ENUM('auto','admin') NOT NULL DEFAULT 'auto' COMMENT '분류 출처: auto|admin',
  name VARCHAR(255) NOT NULL COMMENT '장소명',
  address VARCHAR(255) DEFAULT NULL COMMENT '주소',
  lat DECIMAL(9,6) NOT NULL COMMENT '위도',
  lng DECIMAL(9,6) NOT NULL COMMENT '경도',
  phone VARCHAR(50) DEFAULT NULL COMMENT '전화번호',
  website VARCHAR(255) DEFAULT NULL COMMENT '웹사이트',
  google_maps_url VARCHAR(512) DEFAULT NULL COMMENT 'Google Maps 공유 URL',
  opening_hours_json JSON DEFAULT NULL COMMENT '운영시간 JSON',
  photos_json JSON DEFAULT NULL COMMENT '사진 메타(JSON 배열)',
  source_types_json JSON DEFAULT NULL COMMENT '원본 Google types(JSON 배열)',
  description TEXT DEFAULT NULL COMMENT '설명(editorialSummary)',
  last_synced_at DATETIME DEFAULT NULL COMMENT '마지막 동기화 시점',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_places_google_place_id (google_place_id),
  INDEX idx_type (type),
  INDEX idx_name (name),
  INDEX idx_lat_lng (lat, lng)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 3) place_bookmarks - 장소 북마크 (user ↔ place)
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
-- 5) comments - 댓글
--    정책: community ✅, trend ✅ / tips ❌
-- =========================================================
DROP TABLE IF EXISTS comments;
CREATE TABLE comments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id),

  INDEX idx_post_id (post_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- =========================================================
-- 6) interactions - 상호작용(좋아요/스크랩) : post 전용
--    정책:
--      - interaction_type ∈ {'like','scrap'}
--      - 대상은 posts만 (community, trend에서만 허용은 애플리케이션/트리거 레벨에서 검증)
-- =========================================================
DROP TABLE IF EXISTS interactions;
CREATE TABLE interactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  
  user_id BIGINT UNSIGNED NOT NULL COMMENT '행위 주체',
  post_id BIGINT UNSIGNED NOT NULL COMMENT '대상 게시글',
  interaction_type ENUM('like','scrap') NOT NULL COMMENT '행위 유형',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- 동일 유저가 동일 게시글에 같은 행위를 중복하지 못하도록 보장
  UNIQUE KEY uniq_user_post_interaction (user_id, post_id, interaction_type),

  -- 조회 패턴을 고려한 인덱스
  INDEX idx_user_id (user_id),
  INDEX idx_post_id (post_id),
  INDEX idx_interaction_type (interaction_type),

  -- FK: 유저/게시글 삭제시 상호작용 자동 정리 (정책: 보존 가치 없어 CASCADE)
  CONSTRAINT fk_interactions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_interactions_post
    FOREIGN KEY (post_id) REFERENCES posts(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
