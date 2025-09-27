# K-Mate Database Migrations

이 디렉토리는 K-Mate 프로젝트의 데이터베이스 마이그레이션 파일들을 포함합니다.

## 📁 마이그레이션 파일들

### 1. `001_create_initial_schema.sql`
- **목적**: 기본 테이블 구조 생성
- **포함 테이블**: `users`, `places`, `place_bookmarks`, `posts`, `comments`, `interactions`
- **실행 순서**: 1번째

### 2. `002_create_triggers.sql`
- **목적**: 비즈니스 정책 강제 트리거 생성
- **포함 트리거**: 
  - `trg_posts_before_insert/update`: tips/trend 게시글은 관리자만 생성/수정
  - `trg_comments_before_insert`: community/trend 게시글에만 댓글 허용
  - `trg_interactions_before_insert/update`: 상호작용 정책 강제
- **실행 순서**: 2번째

### 3. `003_create_views.sql`
- **목적**: 조회 편의를 위한 뷰 생성
- **포함 뷰**: `community_posts`, `tips_posts`, `trend_posts`, `user_posts`, `user_interaction_stats`
- **실행 순서**: 3번째

### 4. `004_insert_sample_data.sql`
- **목적**: 테스트용 샘플 데이터 삽입
- **포함 데이터**: 게시글, 댓글, 상호작용 샘플
- **실행 순서**: 4번째

### 5. `005_create_courses_schema.sql`
- **목적**: 코스 관련 테이블 생성
- **포함 테이블**: `courses`, `course_stops`, `saved_courses`
- **실행 순서**: 5번째

## 🚀 마이그레이션 실행 방법

### 방법 1: MySQL CLI 사용
```bash
# MySQL에 접속
mysql -u root -p

# 데이터베이스 생성 (필요시)
CREATE DATABASE IF NOT EXISTS kmate DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kmate;

# 마이그레이션 실행
source database/migrations/001_create_initial_schema.sql;
source database/migrations/002_create_triggers.sql;
source database/migrations/003_create_views.sql;
source database/migrations/004_insert_sample_data.sql;
source database/migrations/005_create_courses_schema.sql;
```

### 방법 2: MySQL Workbench 사용
1. MySQL Workbench에서 `kmate` 데이터베이스에 연결
2. 각 마이그레이션 파일을 순서대로 열어서 실행
3. 실행 순서: 001 → 002 → 003 → 004 → 005

### 방법 3: 명령줄에서 직접 실행
```bash
# 각 파일을 순서대로 실행
mysql -u root -p kmate < database/migrations/001_create_initial_schema.sql
mysql -u root -p kmate < database/migrations/002_create_triggers.sql
mysql -u root -p kmate < database/migrations/003_create_views.sql
mysql -u root -p kmate < database/migrations/004_insert_sample_data.sql
mysql -u root -p kmate < database/migrations/005_create_courses_schema.sql
```

## ⚠️ 주의사항

1. **실행 순서**: 반드시 001 → 002 → 003 → 004 → 005 순서로 실행
2. **데이터베이스**: `kmate` 데이터베이스가 미리 생성되어 있어야 함
3. **권한**: MySQL 사용자가 테이블 생성, 트리거 생성 권한을 가져야 함
4. **백업**: 기존 데이터가 있다면 마이그레이션 전에 백업 권장

## 🔍 마이그레이션 검증

마이그레이션 실행 후 다음 쿼리로 검증할 수 있습니다:

```sql
-- 테이블 생성 확인
SHOW TABLES;

-- 트리거 생성 확인
SHOW TRIGGERS;

-- 뷰 생성 확인
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- 샘플 데이터 확인
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM posts;
SELECT COUNT(*) FROM comments;
SELECT COUNT(*) FROM interactions;

-- 코스 관련 테이블 확인
SELECT COUNT(*) FROM courses;
SELECT COUNT(*) FROM course_stops;
SELECT COUNT(*) FROM saved_courses;
```

## 🛠️ 문제 해결

### 트리거 생성 실패
- MySQL 버전이 5.7 이상인지 확인
- `sql_mode`에서 `NO_AUTO_CREATE_USER` 제거

### 외래키 제약 조건 오류
- 테이블 생성 순서 확인 (users → places → posts → comments/interactions)

### 권한 오류
- MySQL 사용자에게 `CREATE`, `INSERT`, `UPDATE`, `DELETE` 권한 부여
