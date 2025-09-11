-- =========================================================
-- K-Mate 샘플 데이터 삽입
-- 개발 및 테스트용 샘플 데이터
-- =========================================================

-- 호환성 옵션
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- 샘플 사용자 데이터
-- =========================================================
INSERT INTO users (google_sub, email, name, avatar_url, email_verified, role) VALUES
('google_123456789', 'admin@kmate.com', '관리자', 'https://example.com/admin.jpg', 1, 'admin'),
('google_987654321', 'user1@kmate.com', '홍길동', 'https://example.com/user1.jpg', 1, 'user'),
('google_111222333', 'user2@kmate.com', '김철수', 'https://example.com/user2.jpg', 1, 'user'),
('google_444555666', 'user3@kmate.com', '이영희', 'https://example.com/user3.jpg', 1, 'user');

-- =========================================================
-- 샘플 장소 데이터
-- =========================================================
INSERT INTO places (google_place_id, name, address, lat, lng, phone, website, google_maps_url, description) VALUES
('ChIJN1t_tDeuEmsRUsoyG83frY4', '경복궁', '서울특별시 종로구 사직로 161', 37.5796, 126.9770, '+82-2-3700-3900', 'https://www.royalpalace.go.kr', 'https://maps.google.com/...', '조선 왕조의 대표적인 궁궐'),
('ChIJAVkDPzdZ7jARVW8H6y1rS0Q', '명동', '서울특별시 중구 명동', 37.5636, 126.9826, NULL, NULL, 'https://maps.google.com/...', '서울의 대표적인 쇼핑과 관광지'),
('ChIJrTLr-GyuEmsRBfy61i59si0', '남산타워', '서울특별시 용산구 남산공원길 105', 37.5512, 126.9882, '+82-2-3455-9277', 'https://www.nseoultower.co.kr', 'https://maps.google.com/...', '서울의 랜드마크 타워'),
('ChIJKxjxuaNqEmsR0qQwQj9fD5g', '홍대입구역', '서울특별시 마포구 양화로 188', 37.5563, 126.9226, NULL, NULL, 'https://maps.google.com/...', '젊음의 거리 홍대의 중심'),
('ChIJVwjKdD9qEmsR4LQyJc1cD5g', '강남역', '서울특별시 강남구 강남대로 396', 37.4979, 127.0276, NULL, NULL, 'https://maps.google.com/...', '서울의 비즈니스 중심가');

-- =========================================================
-- 샘플 게시글 데이터
-- =========================================================

-- Community 게시글 (일반 사용자 작성 가능)
INSERT INTO posts (author_id, title, content, post_type, category, status, view_count) VALUES
(2, '서울 맛집 추천! 강남역 근처 맛있는 곳들', '강남역 근처에서 꼭 가봐야 할 맛집들을 소개합니다. 1. 삼겹살집 - 정말 맛있어요! 2. 파스타집 - 분위기 좋고 맛도 좋아요.', 'community', 'food_review', 'published', 15),
(3, '경복궁 관광 후기', '경복궁에 다녀왔는데 정말 아름다웠습니다. 궁궐의 웅장함과 한국의 전통 건축미를 느낄 수 있었어요. 추천합니다!', 'community', 'travel_tip', 'published', 8),
(4, '홍대 카페 투어', '홍대에 있는 예쁜 카페들을 돌아다녔습니다. 각각 다른 매력이 있어서 좋았어요. 사진 찍기 좋은 곳들이 많아요.', 'community', 'cafe_review', 'published', 12),
(2, '서울 여행 코스 추천', '서울을 처음 방문하는 분들을 위한 3일 코스를 추천드립니다. 명동-남산타워-경복궁 순서로 돌아보시면 좋을 것 같아요.', 'community', 'travel_tip', 'published', 25);

-- Tips 게시글 (관리자만 작성 가능)
INSERT INTO posts (author_id, title, content, post_type, category, status, view_count) VALUES
(1, '서울 여행 필수 준비물', '서울 여행을 계획하고 계신가요? 꼭 챙겨야 할 준비물들을 정리해드립니다. 1. T-money 카드 2. 환율 확인 3. 날씨 체크 4. 지하철 앱 다운로드', 'tips', 'travel_tip', 'published', 45),
(1, '한국 음식 문화 가이드', '한국 음식 문화를 이해하고 맛있게 즐기는 방법을 알려드립니다. 김치의 종류, 밥상 예절, 술 문화 등 다양한 정보를 담았습니다.', 'tips', 'general', 'published', 32),
(1, '서울 대중교통 이용법', '서울의 지하철, 버스, 택시 이용법을 자세히 설명합니다. T-money 카드 사용법부터 환승 할인까지 모든 정보를 담았습니다.', 'tips', 'general', 'published', 28);

-- Trend 게시글 (관리자만 작성 가능)
INSERT INTO posts (author_id, title, content, post_type, category, status, view_count) VALUES
(1, '2024년 서울 핫플레이스 TOP 10', '올해 가장 인기 있는 서울의 핫플레이스를 소개합니다. SNS에서 화제가 된 곳들부터 숨은 명소까지 다양한 장소를 만나보세요.', 'trend', 'travel_tip', 'published', 67),
(1, '서울 카페 트렌드 리포트', '최신 서울 카페 트렌드를 분석해드립니다. 테라리움 카페, 북카페, 반려동물 카페 등 다양한 테마의 카페들이 인기를 끌고 있어요.', 'trend', 'cafe_review', 'published', 54),
(1, '한국 맛집 미슐랭 가이드', '미슐랭 가이드에 소개된 한국 맛집들을 정리했습니다. 별점별로 분류하여 예산에 맞는 맛집을 찾아보세요.', 'trend', 'food_review', 'published', 89);

-- =========================================================
-- 샘플 댓글 데이터 (community, trend 게시글에만)
-- =========================================================
INSERT INTO comments (post_id, user_id, content) VALUES
(1, 3, '정말 유용한 정보네요! 다음에 강남역 갈 때 참고하겠습니다.'),
(1, 4, '저도 그 파스타집 가봤는데 정말 맛있었어요!'),
(2, 2, '경복궁 정말 아름답죠. 저도 가보고 싶어요.'),
(2, 4, '사진도 정말 예쁘게 나왔네요!'),
(3, 2, '홍대 카페들 정말 예쁘죠. 저도 가보고 싶어요.'),
(3, 3, '어떤 카페가 가장 좋았나요?'),
(7, 2, '정말 유용한 정보입니다! 다음 여행 때 꼭 챙겨야겠어요.'),
(7, 3, 'T-money 카드 정말 필수네요. 감사합니다!'),
(8, 2, '한국 음식 문화 정말 흥미로워요. 더 알고 싶어요.'),
(8, 4, '김치 종류가 이렇게 많았군요!'),
(9, 2, '핫플레이스 정보 정말 좋네요! 다음에 가보고 싶어요.'),
(9, 3, '사진도 정말 예쁘고 정보도 유용해요.'),
(10, 2, '카페 트렌드 정말 빠르게 변하네요.'),
(10, 4, '테라리움 카페 정말 예쁠 것 같아요!');

-- =========================================================
-- 샘플 상호작용 데이터
-- =========================================================

-- 게시글 좋아요/스크랩 (community, trend만)
INSERT INTO interactions (user_id, interaction_type, target_type, target_id) VALUES
-- Community 게시글 상호작용
(2, 'like', 'post', 1),
(3, 'like', 'post', 1),
(4, 'like', 'post', 1),
(2, 'scrap', 'post', 1),
(3, 'scrap', 'post', 2),
(4, 'scrap', 'post', 2),
(2, 'like', 'post', 3),
(3, 'like', 'post', 3),
(4, 'like', 'post', 3),
(2, 'scrap', 'post', 3),
(3, 'scrap', 'post', 4),
(4, 'scrap', 'post', 4),

-- Trend 게시글 상호작용
(2, 'like', 'post', 7),
(3, 'like', 'post', 7),
(4, 'like', 'post', 7),
(2, 'scrap', 'post', 7),
(3, 'scrap', 'post', 7),
(2, 'like', 'post', 8),
(3, 'like', 'post', 8),
(4, 'like', 'post', 8),
(2, 'scrap', 'post', 8),
(3, 'scrap', 'post', 8),
(4, 'scrap', 'post', 8),
(2, 'like', 'post', 9),
(3, 'like', 'post', 9),
(4, 'like', 'post', 9),
(2, 'scrap', 'post', 9),
(3, 'scrap', 'post', 9),
(2, 'like', 'post', 10),
(3, 'like', 'post', 10),
(4, 'like', 'post', 10),
(2, 'scrap', 'post', 10),
(3, 'scrap', 'post', 10),
(4, 'scrap', 'post', 10);

-- 장소 북마크
INSERT INTO interactions (user_id, interaction_type, target_type, target_id) VALUES
(2, 'bookmark', 'place', 1),  -- 홍길동이 경복궁 북마크
(2, 'bookmark', 'place', 2),  -- 홍길동이 명동 북마크
(3, 'bookmark', 'place', 1),  -- 김철수가 경복궁 북마크
(3, 'bookmark', 'place', 3),  -- 김철수가 남산타워 북마크
(4, 'bookmark', 'place', 2),  -- 이영희가 명동 북마크
(4, 'bookmark', 'place', 4),  -- 이영희가 홍대입구역 북마크
(2, 'bookmark', 'place', 5),  -- 홍길동이 강남역 북마크
(3, 'bookmark', 'place', 5);  -- 김철수가 강남역 북마크
