-- ==============================================
-- K-Buzz ERD 마이그레이션 - 003_create_posts_table.sql
-- 게시글 통합 관리 테이블
-- ==============================================

-- K-Mate 게시글 관리를 위한 posts 테이블 생성
-- 커뮤니티 게시글과 팁 게시글을 통합 관리
-- 게시글 타입을 단순화하여 community와 tips만 지원

CREATE TABLE IF NOT EXISTS `posts` (
  -- 기본키: 게시글 고유 식별자 (자동 증가)
  -- 용도: 데이터베이스 내부에서 게시글 식별, 다른 테이블에서 외래키로 참조
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  
  -- 작성자 ID
  -- 용도: 게시글을 작성한 사용자의 ID, users 테이블의 id를 참조
  -- 특징: 외래키, 게시글과 작성자의 관계 설정
  `author_id` bigint unsigned NOT NULL COMMENT '작성자 ID',
  
  -- 게시글 제목
  -- 용도: 게시글의 제목, 사용자에게 표시되는 제목
  -- 제한: 최대 200자, 필수 입력
  `title` varchar(200) NOT NULL COMMENT '게시글 제목',
  
  -- 게시글 내용
  -- 용도: 게시글의 본문 내용, 사용자가 작성한 상세 내용
  -- 타입: LONGTEXT - 매우 긴 텍스트 지원 (최대 4GB)
  -- 특징: 필수 입력, 긴 글도 저장 가능
  `content` longtext NOT NULL COMMENT '게시글 내용',
  
  -- 게시글 타입
  -- 용도: 게시글을 카테고리별로 분류
  -- 값: 'community' (커뮤니티), 'tips' (팁)
  -- 특징: 필수 입력, 게시글 분류의 기준
  `post_type` enum('community','tips') NOT NULL COMMENT '게시글 타입',
  
  -- 카테고리
  -- 용도: community 게시글의 세부 분류
  -- 값: 'travel_tip' (여행팁), 'food_review' (맛집리뷰), 'cafe_review' (카페리뷰), 'general' (일반)
  -- 특징: 선택사항 (NULL 허용), community 게시글에만 사용
  `category` enum('travel_tip','food_review','cafe_review','general') DEFAULT NULL COMMENT '카테고리',
  
  -- 게시글 상태
  -- 용도: 게시글의 공개 상태 관리
  -- 값: 'published' (게시), 'draft' (임시저장), 'hidden' (숨김)
  -- 기본값: 'published' (게시 상태로 기본 설정)
  `status` enum('published','draft','hidden') NOT NULL DEFAULT 'published' COMMENT '게시글 상태',
  
  -- 조회수
  -- 용도: 게시글을 본 횟수, 인기도 측정 지표
  -- 기본값: 0 (조회수 0으로 시작)
  -- 특징: 게시글 조회 시마다 증가
  `view_count` int NOT NULL DEFAULT '0' COMMENT '조회수',
  
  -- 게시글 생성일시
  -- 용도: 게시글 작성 날짜와 시간 기록
  -- 특징: 자동으로 현재 시간 설정
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '게시글 생성일시',
  
  -- 게시글 수정일시
  -- 용도: 게시글 수정 시 자동으로 업데이트
  -- 특징: 레코드 수정 시마다 자동으로 현재 시간으로 업데이트
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '게시글 수정일시',
  
  PRIMARY KEY (`id`),
  KEY `IDX_posts_author_id` (`author_id`),
  KEY `IDX_posts_post_type` (`post_type`),
  KEY `IDX_posts_status` (`status`),
  KEY `IDX_posts_category` (`category`),
  KEY `IDX_posts_created_at` (`created_at`),
  KEY `IDX_posts_post_type_status` (`post_type`,`status`),
  KEY `IDX_posts_author_post_type` (`author_id`,`post_type`),
  CONSTRAINT `FK_posts_author_id` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='K-Mate 게시글 테이블 (통합 관리)';

-- 인덱스 추가 (성능 최적화)
CREATE INDEX `IDX_posts_title` ON `posts` (`title`);
CREATE INDEX `IDX_posts_view_count` ON `posts` (`view_count`);
