-- =========================================================
-- K-Mate Courses 광고 및 통계 기능 추가
-- 광고 코스, 공유/저장 횟수 추적 기능
-- =========================================================

-- 호환성 옵션
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- Courses 테이블에 광고 및 통계 컬럼 추가
-- =========================================================
ALTER TABLE `courses` 
ADD COLUMN `is_advertisement` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '광고 코스 여부',
ADD COLUMN `share_count` INT NOT NULL DEFAULT 0 COMMENT '공유 횟수',
ADD COLUMN `save_count` INT NOT NULL DEFAULT 0 COMMENT '저장 횟수';

-- =========================================================
-- 인덱스 추가 (검색 성능 향상)
-- =========================================================
ALTER TABLE `courses`
ADD INDEX `idx_is_advertisement` (`is_advertisement`),
ADD INDEX `idx_share_count` (`share_count`),
ADD INDEX `idx_save_count` (`save_count`),
ADD INDEX `idx_popularity` (`share_count`, `save_count`);