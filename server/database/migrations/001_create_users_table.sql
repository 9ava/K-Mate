-- ==============================================
-- K-Buzz ERD 마이그레이션 - 001_create_users_table.sql
-- Google OAuth 2.0 최적화된 사용자 관리 테이블
-- ==============================================

-- K-Mate 사용자 관리를 위한 users 테이블 생성
-- Google OAuth 2.0을 통한 사용자 인증 및 기본 정보 관리
-- 내부 ID와 Google ID를 분리하여 성능 최적화 및 확장성 확보

CREATE TABLE IF NOT EXISTS `users` (
  -- 기본키: 사용자 고유 식별자 (자동 증가)
  -- 용도: 데이터베이스 내부에서 사용자 식별, 다른 테이블에서 외래키로 참조
  -- 타입: BIGINT UNSIGNED (큰 정수, 음수 불가) - 성능 최적화를 위해 정수형 사용
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  
  -- Google OAuth 2.0 고유 식별자
  -- 용도: Google 로그인 시 사용자 식별, Google OAuth 2.0의 'sub' 필드 저장
  -- 특징: UNIQUE 제약조건으로 중복 방지, Google 계정과 1:1 매핑 보장
  `google_id` varchar(64) NOT NULL COMMENT 'Google OAuth 고유 ID',
  
  -- 사용자 이메일 주소
  -- 용도: 사용자 식별 및 연락처, Google에서 제공하는 이메일 주소
  -- 특징: UNIQUE 제약조건 없음 (Google 계정 이메일 변경 가능성 고려)
  `email` varchar(255) NOT NULL COMMENT '이메일 주소',
  
  -- 사용자 이름
  -- 용도: 화면에 표시되는 사용자 이름, Google 프로필에서 가져옴
  -- 제한: 최대 100자
  `name` varchar(100) NOT NULL COMMENT '사용자 이름',
  
  -- 프로필 이미지 URL
  -- 용도: 사용자 아바타 이미지, Google 프로필 이미지 URL 저장
  -- 특징: 선택사항 (NULL 허용), 최대 512자
  `avatar_url` varchar(512) DEFAULT NULL COMMENT '프로필 이미지 URL',
  
  -- 사용자 권한
  -- 용도: 사용자와 관리자 권한 구분
  -- 값: 'user' (일반 사용자), 'admin' (관리자)
  -- 기본값: 'user' (일반 사용자로 기본 설정)
  `role` enum('user','admin') NOT NULL DEFAULT 'user' COMMENT '사용자 권한',
  
  -- 계정 생성일시
  -- 용도: 사용자 가입 날짜와 시간 기록
  -- 특징: 자동으로 현재 시간 설정
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '계정 생성일시',
  
  -- 계정 수정일시
  -- 용도: 사용자 정보 수정 시 자동으로 업데이트
  -- 특징: 레코드 수정 시마다 자동으로 현재 시간으로 업데이트
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '정보 수정일시',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_users_google_id` (`google_id`),
  KEY `IDX_users_email` (`email`),
  KEY `IDX_users_role` (`role`),
  KEY `IDX_users_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='K-Mate 사용자 테이블 (Google OAuth 최적화)';

-- 인덱스 추가 (성능 최적화)
CREATE INDEX `IDX_users_email_role` ON `users` (`email`, `role`);
CREATE INDEX `IDX_users_role_created` ON `users` (`role`, `created_at`);
