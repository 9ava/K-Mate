// src/mocks/data.ts
// 포트폴리오용 Mock 데이터

import type { Place, PlaceType } from '../types/place'
import type { KBuzzItem } from '../api/kbuzz'
import type { CommentItem } from '../api/comments'

// ========== Mock Users ==========
export const mockUsers = {
	admin: {
		id: 1,
		email: 'admin@kmate.com',
		name: 'K-Mate Admin',
		role: 'admin' as const,
		avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
	},
	user1: {
		id: 2,
		email: 'traveler@example.com',
		name: '여행러버',
		role: 'user' as const,
		avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=traveler',
	},
	user2: {
		id: 3,
		email: 'foodie@example.com',
		name: '맛집탐험가',
		role: 'user' as const,
		avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=foodie',
	},
	user3: {
		id: 4,
		email: 'coffee@example.com',
		name: '카페홀릭',
		role: 'user' as const,
		avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=coffee',
	},
}

// ========== Mock Places (K-Map) ==========
export const mockPlaces: Place[] = [
	{
		id: 1,
		googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
		type: 'travel',
		name: '경복궁',
		address: '서울특별시 종로구 사직로 161',
		lat: 37.5796,
		lng: 126.977,
		phone: '02-3700-3900',
		website: 'http://www.royalpalace.go.kr',
		googleMapsUrl: 'https://maps.google.com/?cid=123456',
		description: '조선 왕조의 법궁으로, 한국의 대표적인 궁궐입니다.',
		photoUrl: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=800',
	},
	{
		id: 2,
		googlePlaceId: 'ChIJBf2wDzmjfDURVsgT_iMT0Tw',
		type: 'travel',
		name: '남산타워',
		address: '서울특별시 용산구 남산공원길 105',
		lat: 37.5512,
		lng: 126.9882,
		phone: '02-3455-9277',
		website: 'https://www.nseoultower.co.kr',
		googleMapsUrl: 'https://maps.google.com/?cid=234567',
		description: '서울의 랜드마크로, 야경이 아름다운 전망대입니다.',
		photoUrl: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800',
	},
	{
		id: 3,
		googlePlaceId: 'ChIJRf3wDzmjfDURVsg12345678',
		type: 'travel',
		name: '북촌 한옥마을',
		address: '서울특별시 종로구 계동길 37',
		lat: 37.5826,
		lng: 126.9831,
		phone: '02-2148-4160',
		website: 'https://bukchon.seoul.go.kr',
		googleMapsUrl: 'https://maps.google.com/?cid=345678',
		description: '600년 역사의 전통 한옥이 보존된 마을입니다.',
		photoUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800',
	},
	{
		id: 4,
		googlePlaceId: 'ChIJFood1234567890abcdef',
		type: 'food',
		name: '광장시장',
		address: '서울특별시 종로구 창경궁로 88',
		lat: 37.57,
		lng: 126.9992,
		phone: '02-2267-0291',
		website: 'http://www.kwangjangmarket.co.kr',
		googleMapsUrl: 'https://maps.google.com/?cid=456789',
		description: '100년 전통의 재래시장, 먹거리 천국입니다.',
		photoUrl: 'https://images.unsplash.com/photo-1590662869419-d2e7f4e02a2a?w=800',
	},
	{
		id: 5,
		googlePlaceId: 'ChIJFood2345678901bcdefg',
		type: 'food',
		name: '을지로 노가리 골목',
		address: '서울특별시 중구 을지로 123',
		lat: 37.566,
		lng: 126.992,
		phone: null,
		website: null,
		googleMapsUrl: 'https://maps.google.com/?cid=567890',
		description: '서울의 대표적인 노포 맛집 골목입니다.',
		photoUrl: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800',
	},
	{
		id: 6,
		googlePlaceId: 'ChIJCafe1234567890hijklm',
		type: 'cafe',
		name: '익선동 카페거리',
		address: '서울특별시 종로구 익선동',
		lat: 37.5735,
		lng: 126.9885,
		phone: null,
		website: null,
		googleMapsUrl: 'https://maps.google.com/?cid=678901',
		description: '한옥과 현대가 어우러진 힙한 카페 거리입니다.',
		photoUrl: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800',
	},
	{
		id: 7,
		googlePlaceId: 'ChIJCafe2345678901nopqrs',
		type: 'cafe',
		name: '연남동 카페거리',
		address: '서울특별시 마포구 연남동',
		lat: 37.5658,
		lng: 126.9236,
		phone: null,
		website: null,
		googleMapsUrl: 'https://maps.google.com/?cid=789012',
		description: '경의선 숲길과 함께하는 트렌디한 카페 거리입니다.',
		photoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
	},
	{
		id: 8,
		googlePlaceId: 'ChIJTravel345678901tuvwxy',
		type: 'travel',
		name: '해운대 해수욕장',
		address: '부산광역시 해운대구 해운대해변로 264',
		lat: 35.1587,
		lng: 129.1604,
		phone: '051-749-7601',
		website: 'https://www.haeundae.go.kr',
		googleMapsUrl: 'https://maps.google.com/?cid=890123',
		description: '대한민국 대표 해수욕장입니다.',
		photoUrl: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800',
	},
]

// ========== Mock Posts (K-Buzz) ==========
export const mockPosts: KBuzzItem[] = [
	// Community posts
	{
		id: 1,
		title: '경복궁 야간개장 후기',
		content: `지난 주말 경복궁 야간개장에 다녀왔어요! 🏯

낮에 가는 것과는 완전 다른 분위기였습니다. 조명이 켜진 궁궐이 정말 신비로웠어요.

**꿀팁 공유:**
- 예약은 필수! 인터파크에서 미리 예매하세요
- 한복 입으면 무료입장
- 사진 찍기 좋은 시간은 해질녘~조명 켜지는 시간

다음에는 창덕궁 달빛기행도 가보려고요!`,
		postType: 'community',
		category: 'travel_tip',
		status: 'published',
		viewCount: 1523,
		likeCount: 89,
		scrapCount: 45,
		commentCount: 12,
		createdAt: '2024-11-15T10:30:00Z',
		updatedAt: '2024-11-15T10:30:00Z',
		author: {
			id: mockUsers.user1.id,
			name: mockUsers.user1.name,
			avatarUrl: mockUsers.user1.avatar_url,
			role: mockUsers.user1.role,
		},
		isLiked: false,
	},
	{
		id: 2,
		title: '광장시장 먹방 투어 코스 추천',
		content: `광장시장 처음 가시는 분들을 위한 완벽 코스!

1. **순희네 빈대떡** - 녹두빈대떡 필수
2. **박가네 마약김밥** - 진짜 중독성 있음
3. **원조누드김밥** - 새우튀김 추가 강추
4. **육회골목** - 신선한 육회 맛집 다 모여있음

배터지게 먹고 왔습니다 😋`,
		postType: 'community',
		category: 'food_review',
		status: 'published',
		viewCount: 2341,
		likeCount: 156,
		scrapCount: 89,
		commentCount: 23,
		createdAt: '2024-11-14T15:20:00Z',
		updatedAt: '2024-11-14T15:20:00Z',
		author: {
			id: mockUsers.user2.id,
			name: mockUsers.user2.name,
			avatarUrl: mockUsers.user2.avatar_url,
			role: mockUsers.user2.role,
		},
		isLiked: true,
	},
	{
		id: 3,
		title: '연남동 분위기 좋은 카페 BEST 5',
		content: `연남동에서 인생카페 찾았어요!

### 1. 카페 연남
- 루프탑에서 경의선숲길 뷰
- 시그니처 라떼 추천

### 2. 어니언 연남
- 빵 맛집으로 유명
- 크루아상 꼭 먹어보세요

### 3. 앤트러사이트
- 공장 개조한 힙한 분위기
- 드립커피 맛있음

### 4. 그릿비
- 2층 통유리 좌석 예쁨
- 디저트 퀄리티 좋음

### 5. 카페 온월
- 조용해서 작업하기 좋음
- 호두파이 맛있어요`,
		postType: 'community',
		category: 'cafe_review',
		status: 'published',
		viewCount: 1876,
		likeCount: 134,
		scrapCount: 102,
		commentCount: 18,
		createdAt: '2024-11-13T09:00:00Z',
		updatedAt: '2024-11-13T09:00:00Z',
		author: {
			id: mockUsers.user3.id,
			name: mockUsers.user3.name,
			avatarUrl: mockUsers.user3.avatar_url,
			role: mockUsers.user3.role,
		},
		isLiked: false,
	},
	{
		id: 4,
		title: '부산 2박3일 여행 코스',
		content: `부산 여행 코스 공유합니다!

## Day 1
- 해운대 해수욕장
- 해리단길 카페투어
- 광안리 야경

## Day 2
- 감천문화마을
- 국제시장 먹방
- 자갈치시장

## Day 3
- 태종대
- 송도 해상케이블카
- 서면 쇼핑

교통은 부산지하철 + 버스 조합이 최고예요!`,
		postType: 'community',
		category: 'travel_tip',
		status: 'published',
		viewCount: 3210,
		likeCount: 245,
		scrapCount: 178,
		commentCount: 31,
		createdAt: '2024-11-12T14:00:00Z',
		updatedAt: '2024-11-12T14:00:00Z',
		author: {
			id: mockUsers.user1.id,
			name: mockUsers.user1.name,
			avatarUrl: mockUsers.user1.avatar_url,
			role: mockUsers.user1.role,
		},
		isLiked: false,
	},
	// Trend posts (admin only)
	{
		id: 5,
		title: '2024 서울 단풍 명소 TOP 10',
		content: `올가을 꼭 가봐야 할 단풍 명소를 소개합니다!

1. **남산** - 서울 도심에서 가장 접근성 좋은 단풍 명소
2. **올림픽공원** - 넓은 공원에서 여유롭게 단풍 감상
3. **서울숲** - 사슴과 함께하는 단풍놀이
4. **북한산** - 등산과 단풍을 동시에
5. **덕수궁 돌담길** - 가을 데이트 코스 1위
6. **창경궁** - 고궁과 단풍의 조화
7. **선유도공원** - 한강 뷰와 단풍
8. **양재시민의숲** - 메타세콰이어 길
9. **경춘선숲길** - 산책하기 좋은 단풍길
10. **어린이대공원** - 가족 나들이 추천`,
		postType: 'trend',
		category: null,
		status: 'published',
		viewCount: 8934,
		likeCount: 567,
		scrapCount: 342,
		commentCount: 45,
		createdAt: '2024-11-10T08:00:00Z',
		updatedAt: '2024-11-10T08:00:00Z',
		author: {
			id: mockUsers.admin.id,
			name: mockUsers.admin.name,
			avatarUrl: mockUsers.admin.avatar_url,
			role: mockUsers.admin.role,
		},
		isLiked: false,
	},
	{
		id: 6,
		title: '한국 겨울 축제 캘린더 2024-2025',
		content: `올겨울 놓치지 말아야 할 축제들!

### 12월
- **화천 산천어축제** (12/27~) - 얼음낚시 체험
- **태백산 눈축제** (12/21~) - 눈조각 전시

### 1월
- **평창 송어축제** - 얼음낚시 + 맨손잡기
- **보성 차밭 빛 축제** - 야간 일루미네이션

### 2월
- **제주 들불축제** - 오름 들불 점화
- **강릉 커피축제** - 커피 마니아 필수

미리 예약하고 따뜻하게 입고 가세요!`,
		postType: 'trend',
		category: null,
		status: 'published',
		viewCount: 5621,
		likeCount: 389,
		scrapCount: 256,
		commentCount: 28,
		createdAt: '2024-11-08T12:00:00Z',
		updatedAt: '2024-11-08T12:00:00Z',
		author: {
			id: mockUsers.admin.id,
			name: mockUsers.admin.name,
			avatarUrl: mockUsers.admin.avatar_url,
			role: mockUsers.admin.role,
		},
		isLiked: true,
	},
	// Tips posts (admin only)
	{
		id: 7,
		title: '한국 여행 필수 앱 가이드',
		content: `한국 여행을 더 편하게 해줄 앱들을 소개합니다.

## 교통
- **카카오맵** - 대중교통/도보 길찾기 필수
- **네이버 지도** - 실시간 버스 도착 정보
- **카카오T** - 택시 호출

## 음식점
- **망고플레이트** - 맛집 리뷰
- **캐치테이블** - 레스토랑 예약
- **배달의민족** - 배달 음식

## 소통
- **파파고** - 번역 앱
- **카카오톡** - 한국인 필수 메신저

## 쇼핑
- **네이버페이** - 간편결제
- **쿠팡** - 빠른 배송`,
		postType: 'tips',
		category: null,
		status: 'published',
		viewCount: 4532,
		likeCount: 234,
		scrapCount: 189,
		commentCount: 0,
		createdAt: '2024-11-05T10:00:00Z',
		updatedAt: '2024-11-05T10:00:00Z',
		author: {
			id: mockUsers.admin.id,
			name: mockUsers.admin.name,
			avatarUrl: mockUsers.admin.avatar_url,
			role: mockUsers.admin.role,
		},
		isLiked: false,
	},
	{
		id: 8,
		title: '서울 대중교통 이용 가이드',
		content: `서울 대중교통 완전정복!

## 교통카드
- **T-money** 또는 **캐시비** 구매
- 편의점에서 구매 가능 (2,500원)
- 충전 후 사용

## 지하철
- 기본요금 1,400원
- 환승 무료 (30분 이내)
- 막차 주의! (보통 자정~12:30)

## 버스
- 기본요금 1,500원
- 파랑(간선), 초록(지선), 빨강(광역)

## 꿀팁
- 지하철 + 버스 환승 시 할인
- 러시아워(8-9시, 6-7시) 피하기
- 카카오맵으로 실시간 도착정보 확인`,
		postType: 'tips',
		category: null,
		status: 'published',
		viewCount: 6789,
		likeCount: 456,
		scrapCount: 321,
		commentCount: 0,
		createdAt: '2024-11-01T09:00:00Z',
		updatedAt: '2024-11-01T09:00:00Z',
		author: {
			id: mockUsers.admin.id,
			name: mockUsers.admin.name,
			avatarUrl: mockUsers.admin.avatar_url,
			role: mockUsers.admin.role,
		},
		isLiked: false,
	},
]

// ========== Mock Comments ==========
export const mockComments: Record<number, CommentItem[]> = {
	1: [
		{
			id: 1,
			content: '저도 다녀왔는데 정말 예뻤어요! 한복 대여소 추천해주실 수 있나요?',
			createdAt: '2024-11-15T12:00:00Z',
			author: { id: 3, name: '맛집탐험가', avatarUrl: mockUsers.user2.avatar_url },
		},
		{
			id: 2,
			content: '광화문 근처 한복대여소 많아요! 가격은 2만원~3만원 정도입니다.',
			createdAt: '2024-11-15T13:30:00Z',
			author: { id: 2, name: '여행러버', avatarUrl: mockUsers.user1.avatar_url },
		},
	],
	2: [
		{
			id: 3,
			content: '마약김밥 진짜 맛있죠!! 저는 떡볶이도 추천드려요',
			createdAt: '2024-11-14T16:00:00Z',
			author: { id: 4, name: '카페홀릭', avatarUrl: mockUsers.user3.avatar_url },
		},
	],
	3: [
		{
			id: 4,
			content: '어니언 빵 진짜 맛있어요 ㅠㅠ 크루아상 최고!',
			createdAt: '2024-11-13T11:00:00Z',
			author: { id: 2, name: '여행러버', avatarUrl: mockUsers.user1.avatar_url },
		},
		{
			id: 5,
			content: '앤트러사이트 분위기 대박이에요. 사진 찍기 좋음!',
			createdAt: '2024-11-13T14:20:00Z',
			author: { id: 3, name: '맛집탐험가', avatarUrl: mockUsers.user2.avatar_url },
		},
	],
}

// ========== Mock Bookmarks ==========
export const mockBookmarks = [
	{
		placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
		name: '경복궁',
		address: '서울특별시 종로구 사직로 161',
		lat: 37.5796,
		lng: 126.977,
		googleMapsUrl: 'https://maps.google.com/?cid=123456',
		type: 'travel' as PlaceType,
		createdAt: '2024-11-10T10:00:00Z',
	},
	{
		placeId: 'ChIJFood1234567890abcdef',
		name: '광장시장',
		address: '서울특별시 종로구 창경궁로 88',
		lat: 37.57,
		lng: 126.9992,
		googleMapsUrl: 'https://maps.google.com/?cid=456789',
		type: 'food' as PlaceType,
		createdAt: '2024-11-08T15:00:00Z',
	},
]
