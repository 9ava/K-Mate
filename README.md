# K-Mate

한국의 다양한 매력을 공유하는 소셜 플랫폼

## 🚀 주요 기능

- **K-Map**: Google Maps 기반 한국 관광지 지도 및 장소 검색
- **K-Buzz**: 한국의 매력을 공유하는 소셜 커뮤니티 플랫폼
  - **K-Community**: 사용자 자유 게시판
  - **K-Trend**: 트렌드 게시글 (관리자 전용)
  - **Tips**: 여행 팁 게시글 (관리자 전용)

## 🛠️ 기술 스택

### Backend
- **NestJS 11** - Node.js 프레임워크
- **TypeORM** - ORM (MySQL)
- **Passport** - 인증 미들웨어
- **JWT** - 토큰 기반 인증
- **Google OAuth 2.0** - 소셜 로그인
- **Swagger** - API 문서화
- **MySQL 8.0** - 데이터베이스

### Frontend
- **React 19** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **Tailwind CSS 4** - 스타일링
- **React Router 7** - 라우팅
- **Zustand** - 상태 관리
- **TanStack Query** - 서버 상태 관리
- **Google Maps API** - 지도 서비스

## 📁 프로젝트 구조

```
K-Mate/
├── server/                     # NestJS 백엔드
│   ├── src/
│   │   ├── features/           # 기능별 모듈
│   │   │   ├── auth/           # 인증 모듈 (Google OAuth + JWT)
│   │   │   ├── places/         # 장소 관리 모듈
│   │   │   ├── posts/          # 게시글 관리 모듈
│   │   │   ├── comments/       # 댓글 관리 모듈
│   │   │   ├── interactions/   # 상호작용 관리 모듈
│   │   │   └── mypage/         # 마이페이지 모듈
│   │   ├── database/           # DB 설정
│   │   ├── common/             # 공통 유틸리티
│   │   │   ├── decorators/     # 커스텀 데코레이터
│   │   │   └── guards/         # 인증/권한 가드
│   │   └── main.ts             # 애플리케이션 진입점
│   └── database/
│       └── migrations/         # DB 마이그레이션
│           ├── 001_create_initial_schema.sql
│           ├── 002_create_triggers.sql
│           ├── 003_create_views.sql
│           └── 004_insert_sample_data.sql
├── client/                     # React 프론트엔드
│   ├── src/
│   │   ├── features/           # 기능별 훅/스토어
│   │   │   └── auth/           # 인증 관련 상태 관리
│   │   ├── components/         # UI 컴포넌트
│   │   │   ├── common/         # 공통 컴포넌트
│   │   │   ├── layout/         # 레이아웃 컴포넌트
│   │   │   └── places/         # 장소 관련 컴포넌트
│   │   ├── pages/              # 페이지 컴포넌트
│   │   │   ├── KBuzz/          # K-Buzz 관련 페이지
│   │   │   ├── KmapPage.tsx    # K-Map 페이지
│   │   │   ├── KBuzzPage.tsx   # K-Buzz 메인 페이지
│   │   │   └── LoginPage.tsx   # 로그인 페이지
│   │   ├── api/                # API 클라이언트
│   │   ├── types/              # TypeScript 타입 정의
│   │   └── styles/             # 스타일 파일
│   └── public/
├── infrastructure/             # 배포 인프라
│   ├── nginx/                  # Nginx 설정
│   ├── scripts/                # 배포 스크립트
│   └── systemd/                # 서비스 설정
└── report/                     # 프로젝트 문서
    ├── requirements_specification.md
    └── README.md
```

## 🔧 설치 및 실행

### 환경 설정
```bash
# 서버 환경변수 설정
cp server/.env.example server/.env

# 클라이언트 환경변수 설정
cp client/.env.example client/.env
```

### 데이터베이스 설정
```bash
# MySQL 데이터베이스 생성
mysql -u root -p
CREATE DATABASE kmate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 마이그레이션 실행
mysql -u root -p kmate_db < server/database/migrations/001_create_initial_schema.sql
mysql -u root -p kmate_db < server/database/migrations/002_create_triggers.sql
mysql -u root -p kmate_db < server/database/migrations/003_create_views.sql
mysql -u root -p kmate_db < server/database/migrations/004_insert_sample_data.sql
```

### 개발 서버 실행
```bash
# 백엔드 서버 실행
cd server
npm install
npm run start:dev

# 프론트엔드 서버 실행 (새 터미널)
cd client
npm install
npm run dev
```

## 🔐 인증 시스템

- **Google OAuth 2.0** 기반 소셜 로그인
- **JWT 토큰** 기반 인증
- **HttpOnly 쿠키** 보안
- **자동 토큰 갱신** 지원
- **역할 기반 접근 제어** (user/admin)

## 📊 K-Buzz 기능

### 게시글 타입
- **K-Community**: 모든 사용자 자유 게시판
- **K-Trend**: 트렌드 게시글 (관리자만 작성/수정)
- **Tips**: 여행 팁 게시글 (관리자만 작성/수정)

### 주요 기능
- **게시글 CRUD**: 타입별 권한 제어
- **댓글 시스템**: community/trend 게시글에만 허용
- **상호작용**: 좋아요/스크랩 토글 기능
- **카테고리 분류**: 여행, 맛집, 카페, 일반
- **검색 및 필터링**: 게시글 검색 기능
- **페이지네이션**: 대용량 데이터 처리

## 🗺️ K-Map 기능

- **Google Maps API** 연동
- **Google Places API** 장소 검색
- **관광지 마커** 표시
- **장소 상세 정보** 조회
- **장소 북마크** 기능
- **위치 기반 서비스**
- **지도 스타일링**

## 📱 마이페이지 기능

- **사용자 활동 통계** 조회
- **북마크한 장소** 목록
- **스크랩한 게시글** 목록
- **작성한 게시글** 목록
- **작성한 댓글** 목록

## 🗄️ 데이터베이스 구조

### 주요 테이블
- **users**: 사용자 정보 (Google OAuth)
- **places**: 장소 정보 (Google Places API 연동)
- **posts**: 게시글 (community/trend/tips 통합)
- **comments**: 댓글
- **interactions**: 상호작용 (like/scrap/bookmark)

### 데이터베이스 뷰
- **community_posts**: 커뮤니티 게시글 뷰
- **tips_posts**: 팁 게시글 뷰
- **trend_posts**: 트렌드 게시글 뷰
- **user_interaction_stats**: 사용자 활동 통계
- **post_interaction_stats**: 게시글 상호작용 통계

### 비즈니스 규칙 트리거
- **게시글 작성 권한**: tips/trend는 관리자만 작성/수정
- **댓글 작성 제한**: community/trend 게시글에만 허용
- **상호작용 정책**: like/scrap은 community/trend 게시글에만 허용

## 🚀 배포

### AWS Amplify 배포
```bash
# amplify.yml 설정 확인
# 자동 배포 설정됨
```

### 인프라 구성
- **Nginx**: 리버스 프록시 및 정적 파일 서빙
- **Systemd**: 서비스 관리
- **배포 스크립트**: 자동화된 배포 프로세스

## 📝 API 문서

개발 서버 실행 후 `http://localhost:3000/docs`에서 Swagger API 문서 확인 가능

### 주요 API 엔드포인트
- **인증**: `/auth/*` - Google OAuth, JWT 토큰 관리
- **장소**: `/places/*` - 장소 검색, 상세 정보, 북마크
- **게시글**: `/posts/*` - 게시글 CRUD, 검색, 필터링
- **댓글**: `/comments/*` - 댓글 CRUD
- **상호작용**: `/interactions/*` - 좋아요/스크랩 토글
- **마이페이지**: `/mypage/*` - 사용자 활동 통계 및 목록


## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


