-- ==============================================
-- K-Buzz ERD 마이그레이션 - 005_create_interactions_table.sql
-- 상호작용 통합 관리 테이블
-- ==============================================

-- K-Mate 상호작용 관리를 위한 interactions 테이블 생성
-- 좋아요, 스크랩, 북마크를 하나의 테이블로 통합 관리
-- 상호작용 타입과 대상 타입을 구분하여 다양한 상호작용 지원

CREATE TABLE IF NOT EXISTS `interactions` (
  -- 기본키: 상호작용 고유 식별자 (자동 증가)
  -- 용도: 데이터베이스 내부에서 상호작용 식별
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  
  -- 사용자 ID
  -- 용도: 상호작용을 한 사용자의 ID, users 테이블의 id를 참조
  -- 특징: 외래키, 상호작용과 사용자 간의 관계 설정
  `user_id` bigint unsigned NOT NULL COMMENT '사용자 ID',
  
  -- 상호작용 타입
  -- 용도: 상호작용의 종류 구분
  -- 값: 'like' (좋아요), 'scrap' (스크랩), 'bookmark' (북마크)
  -- 특징: 필수 입력, 상호작용의 종류를 명확히 구분
  `interaction_type` enum('like','scrap','bookmark') NOT NULL COMMENT '상호작용 타입',
  
  -- 대상 타입
  -- 용도: 상호작용의 대상이 되는 엔티티 타입 구분
  -- 값: 'post' (게시글), 'place' (장소)
  -- 특징: 필수 입력, 상호작용 대상을 명확히 구분
  `target_type` enum('post','place') NOT NULL COMMENT '대상 타입',
  
  -- 대상 ID
  -- 용도: 상호작용의 대상이 되는 엔티티의 ID
  -- 특징: target_type과 함께 사용하여 구체적인 대상을 식별
  `target_id` bigint unsigned NOT NULL COMMENT '대상 ID',
  
  -- 상호작용 생성일시
  -- 용도: 상호작용이 발생한 날짜와 시간 기록
  -- 특징: 자동으로 현재 시간 설정
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '상호작용 생성일시',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_interaction` (`user_id`,`interaction_type`,`target_type`,`target_id`),
  KEY `IDX_interactions_user_id` (`user_id`),
  KEY `IDX_interactions_target` (`target_type`,`target_id`),
  KEY `IDX_interactions_interaction_type` (`interaction_type`),
  KEY `IDX_interactions_created_at` (`created_at`),
  KEY `IDX_interactions_user_interaction_type` (`user_id`,`interaction_type`),
  KEY `IDX_interactions_target_interaction_type` (`target_type`,`target_id`,`interaction_type`),
  CONSTRAINT `FK_interactions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='K-Mate 상호작용 테이블 (통합 관리)';
