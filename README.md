# K-Mate

한국의 다양한 매력을 공유하는 소셜 플랫폼

## 🚀 주요 기능

- **K-Map**: Google Maps 기반 한국 관광지 지도
- **K-Buzz**: 한국의 매력을 공유하는 소셜 피드
- **K-Course**: 관광 코스 추천 (개발 예정)

## 🛠️ 기술 스택

### Backend
- **NestJS** - Node.js 프레임워크
- **TypeORM** - ORM (MySQL)
- **Passport** - 인증 미들웨어
- **JWT** - 토큰 기반 인증
- **Google OAuth 2.0** - 소셜 로그인

### Frontend
- **React 19** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **React Router** - 라우팅
- **TanStack Query** - 서버 상태 관리

## 📁 프로젝트 구조

```
K-Mate/
├── server/                 # NestJS 백엔드
│   ├── src/
│   │   ├── features/       # 기능별 모듈
│   │   │   ├── auth/       # 인증 모듈
│   │   │   ├── buzz/       # K-Buzz 모듈
│   │   │   └── users/      # 사용자 모듈
│   │   ├── database/       # DB 설정
│   │   └── common/         # 공통 유틸리티
│   └── database/
│       └── migrations/     # DB 마이그레이션
└── client/                 # React 프론트엔드
    ├── src/
    │   ├── features/       # 기능별 훅/유틸
    │   ├── components/     # UI 컴포넌트
    │   ├── pages/          # 페이지 컴포넌트
    │   └── api/            # API 클라이언트
    └── public/
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
CREATE DATABASE kmate_db;

# 마이그레이션 실행
mysql -u root -p kmate_db < server/database/migrations/001_create_buzzes_table.sql
```

### 개발 서버 실행
```bash
# 백엔드 서버 실행
cd server
npm install
npm run start:dev

# 프론트엔드 서버 실행
cd client
npm install
npm run dev
```

## 🔐 인증 시스템

- **Google OAuth 2.0** 기반 소셜 로그인
- **JWT 토큰** 기반 인증
- **HttpOnly 쿠키** 보안
- **자동 토큰 갱신** 지원

## 📊 K-Buzz 기능

- **게시글 작성/수정/삭제**
- **카테고리별 분류** (여행, 맛집, 카페, 문화, 쇼핑, 자연, 액티비티, 기타)
- **위치 정보 연동**
- **이미지 업로드**
- **좋아요/댓글/조회수**
- **검색 및 필터링**
- **페이지네이션**

## 🗺️ K-Map 기능

- **Google Maps API** 연동
- **관광지 마커** 표시
- **위치 기반 서비스**
- **지도 스타일링**

## 🚀 배포

### AWS Amplify 배포
```bash
# amplify.yml 설정 확인
# 자동 배포 설정됨
```

## 📝 API 문서

개발 서버 실행 후 `http://localhost:3000/docs`에서 Swagger API 문서 확인 가능

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request