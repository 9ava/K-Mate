-- =========================================================
-- K-Mate Courses 기능 스키마 생성
-- 코스 생성, 관리, 저장 기능을 위한 테이블들
-- =========================================================

-- 호환성 옵션
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- Courses 테이블 생성
-- =========================================================
CREATE TABLE `courses` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(150) NOT NULL,
  `visibility` ENUM('public','private') NOT NULL DEFAULT 'public',
  `authorId` BIGINT UNSIGNED NOT NULL,

  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_authorId` (`authorId`),
  CONSTRAINT `fk_courses_author`
    FOREIGN KEY (`authorId`) REFERENCES `users`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- Course Stops 테이블 생성
-- =========================================================
CREATE TABLE `course_stops` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `courseId` BIGINT UNSIGNED NOT NULL,
  `order` INT UNSIGNED NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `lat` DOUBLE NOT NULL,
  `lng` DOUBLE NOT NULL,
  `externalId` VARCHAR(128) NULL,
  `provider` VARCHAR(32) NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_course_order` (`courseId`, `order`),
  KEY `idx_courseId` (`courseId`),
  CONSTRAINT `fk_course_stops_course`
    FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 기존 saved_courses 테이블 제거 (있다면)
-- =========================================================
DROP TABLE IF EXISTS `saved_courses`;

-- =========================================================
-- Saved Courses 테이블 생성 (북마크 기능)
-- =========================================================
CREATE TABLE `saved_courses` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `course_id` BIGINT UNSIGNED NOT NULL,
  `saved_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),

  -- 동일 유저가 같은 코스를 중복 저장 못 하도록
  UNIQUE KEY `uq_user_course` (`user_id`, `course_id`),

  KEY `idx_user_id` (`user_id`),
  KEY `idx_course_id` (`course_id`),

  CONSTRAINT `fk_saved_courses_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_saved_courses_course`
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;
