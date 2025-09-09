-- ==============================================
-- K-Buzz ERD 마이그레이션 - 002_create_places_table.sql
-- 장소 정보 관리 테이블
-- ==============================================

-- K-Mate 장소 관리를 위한 places 테이블 생성
-- 여행지, 맛집, 카페 등 실제 방문 가능한 장소 정보 관리
-- 정밀한 좌표 정보와 상세 정보를 포함한 장소 데이터베이스

CREATE TABLE IF NOT EXISTS `places` (
  -- 기본키: 장소 고유 식별자 (자동 증가)
  -- 용도: 데이터베이스 내부에서 장소 식별, 다른 테이블에서 외래키로 참조
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  
  -- 장소 타입
  -- 용도: 장소를 카테고리별로 분류
  -- 값: 'travel' (여행지), 'food' (맛집), 'cafe' (카페)
  -- 특징: 필수 입력, 장소 분류의 기준
  `type` enum('travel','food','cafe') NOT NULL COMMENT '장소 타입',
  
  -- 장소명
  -- 용도: 실제 장소의 이름, 사용자에게 표시되는 장소명
  -- 제한: 최대 255자, 필수 입력
  `name` varchar(255) NOT NULL COMMENT '장소명',
  
  -- 장소 설명
  -- 용도: 장소에 대한 상세 설명, 사용자들이 장소를 이해하는 데 도움
  -- 특징: 선택사항 (NULL 허용), TEXT 타입으로 긴 설명 가능
  `description` text COMMENT '장소 설명',
  
  -- 위도 (Latitude)
  -- 용도: 정밀한 위치 좌표, 지도 표시 및 거리 계산
  -- 타입: DECIMAL(9,6) - 소수점 6자리까지 저장 (약 11cm 정밀도)
  -- 특징: 필수 입력, 지리적 위치의 정확한 표현
  `lat` decimal(9,6) NOT NULL COMMENT '위도',
  
  -- 경도 (Longitude)
  -- 용도: 정밀한 위치 좌표, 지도 표시 및 거리 계산
  -- 타입: DECIMAL(9,6) - 소수점 6자리까지 저장 (약 11cm 정밀도)
  -- 특징: 필수 입력, 지리적 위치의 정확한 표현
  `lng` decimal(9,6) NOT NULL COMMENT '경도',
  
  -- 주소
  -- 용도: 장소의 실제 주소, 사용자가 찾아갈 수 있는 주소 정보
  -- 특징: 선택사항 (NULL 허용), 최대 255자
  `address` varchar(255) DEFAULT NULL COMMENT '주소',
  
  -- 전화번호
  -- 용도: 장소의 연락처, 사용자가 문의할 수 있는 전화번호
  -- 특징: 선택사항 (NULL 허용), 최대 50자
  `phone` varchar(50) DEFAULT NULL COMMENT '전화번호',
  
  -- 웹사이트
  -- 용도: 장소의 공식 웹사이트 URL, 추가 정보 확인 가능
  -- 특징: 선택사항 (NULL 허용), 최대 255자
  `website` varchar(255) DEFAULT NULL COMMENT '웹사이트',
  
  -- 장소 등록일시
  -- 용도: 장소가 시스템에 등록된 날짜와 시간
  -- 특징: 자동으로 현재 시간 설정
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '장소 등록일시',
  
  PRIMARY KEY (`id`),
  KEY `IDX_places_type` (`type`),
  KEY `IDX_places_location` (`lat`,`lng`),
  KEY `IDX_places_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='K-Mate 장소 정보 테이블';

-- 인덱스 추가 (성능 최적화)
CREATE INDEX `IDX_places_type_created` ON `places` (`type`, `created_at`);
CREATE INDEX `IDX_places_name` ON `places` (`name`);
