-- ==============================================
-- K-Buzz ERD 마이그레이션 - 004_create_comments_table.sql
-- 댓글 시스템 관리 테이블
-- ==============================================

-- K-Mate 댓글 관리를 위한 comments 테이블 생성
-- 게시글에 대한 댓글 시스템 관리
-- 게시글과 사용자 간의 상호작용을 위한 댓글 기능

CREATE TABLE IF NOT EXISTS `comments` (
  -- 기본키: 댓글 고유 식별자 (자동 증가)
  -- 용도: 데이터베이스 내부에서 댓글 식별
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  
  -- 게시글 ID
  -- 용도: 댓글이 달린 게시글의 ID, posts 테이블의 id를 참조
  -- 특징: 외래키, 댓글과 게시글 간의 관계 설정
  `post_id` bigint unsigned NOT NULL COMMENT '게시글 ID',
  
  -- 댓글 작성자 ID
  -- 용도: 댓글을 작성한 사용자의 ID, users 테이블의 id를 참조
  -- 특징: 외래키, 댓글과 작성자 간의 관계 설정
  `user_id` bigint unsigned NOT NULL COMMENT '댓글 작성자 ID',
  
  -- 댓글 내용
  -- 용도: 댓글의 텍스트 내용, 사용자가 작성한 댓글 내용
  -- 타입: TEXT - 긴 텍스트 지원
  -- 특징: 필수 입력, 댓글의 핵심 내용
  `content` text NOT NULL COMMENT '댓글 내용',
  
  -- 댓글 생성일시
  -- 용도: 댓글 작성 날짜와 시간 기록
  -- 특징: 자동으로 현재 시간 설정
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '댓글 생성일시',
  
  PRIMARY KEY (`id`),
  KEY `IDX_comments_post_id` (`post_id`),
  KEY `IDX_comments_user_id` (`user_id`),
  KEY `IDX_comments_created_at` (`created_at`),
  KEY `IDX_comments_post_user` (`post_id`,`user_id`),
  CONSTRAINT `FK_comments_post_id` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_comments_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='K-Mate 댓글 테이블';
