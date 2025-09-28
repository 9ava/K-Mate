-- =========================================================
-- K-Mate Course Comments 기능 스키마 생성
-- 코스에 대한 댓글 기능을 위한 테이블
-- =========================================================

-- 호환성 옵션
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- Course Comments 테이블 생성
-- =========================================================
CREATE TABLE `course_comments` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `course_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT `fk_course_comments_course`
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`)
    ON DELETE CASCADE,

  CONSTRAINT `fk_course_comments_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE,

  INDEX `idx_course_id` (`course_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;