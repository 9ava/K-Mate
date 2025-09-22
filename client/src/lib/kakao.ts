// src/lib/kakao.ts
declare global {
	interface Window {
		kakao: any
	}
}

export async function loadKakao(): Promise<typeof window.kakao> {
	if (window.kakao?.maps) return window.kakao
	await new Promise<void>((resolve, reject) => {
		const s = document.createElement('script')
		s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${
			import.meta.env.VITE_KAKAO_JS_KEY
		}&autoload=false&libraries=services,clusterer,drawing`
		s.async = true
		s.defer = true
		s.onload = () => window.kakao.maps.load(() => resolve())
		s.onerror = () => reject(new Error('Failed to load Kakao Maps'))
		document.head.appendChild(s)
	})
	return window.kakao
}

/**
 * 장소 이름을 기반으로 카테고리 추론
 */
export function inferCategoryFromName(placeName: string): 'cultural' | 'cafe' | 'food' | 'nature' {
	const name = placeName.toLowerCase()
	
	// 카페 관련
	if (name.includes('카페') || name.includes('커피') || 
		name.includes('cafe') || name.includes('coffee') ||
		name.includes('스타벅스') || name.includes('이디야') ||
		name.includes('투썸') || name.includes('할리스') ||
		name.includes('빽다방') || name.includes('메가커피') ||
		name.includes('디저트') || name.includes('베이커리') ||
		name.includes('브런치') || name.includes('tea') ||
		name.includes('차') || name.includes('티')) {
		return 'cafe'
	}
	
	// 음식점 관련
	if (name.includes('식당') || name.includes('맛집') ||
		name.includes('치킨') || name.includes('피자') ||
		name.includes('햄버거') || name.includes('분식') ||
		name.includes('고기') || name.includes('회') ||
		name.includes('족발') || name.includes('찜닭') ||
		name.includes('갈비') || name.includes('삼겹살') ||
		name.includes('비빔밥') || name.includes('냉면') ||
		name.includes('라면') || name.includes('국수') ||
		name.includes('restaurant') || name.includes('bbq')) {
		return 'food'
	}
	
	// 자연 관련
	if (name.includes('공원') || name.includes('산') ||
		name.includes('숲') || name.includes('한강') ||
		name.includes('계곡') || name.includes('호수') ||
		name.includes('park') || name.includes('river')) {
		return 'nature'
	}
	
	// 문화 관련
	if (name.includes('궁') || name.includes('박물관') ||
		name.includes('미술관') || name.includes('사찰') ||
		name.includes('교회') || name.includes('성당') ||
		name.includes('전시') || name.includes('문화') ||
		name.includes('관광') || name.includes('쇼핑') ||
		name.includes('몰') || name.includes('마트')) {
		return 'cultural'
	}
	
	return 'cultural'
}

/**
 * 카테고리별 기본 이미지 반환
 */
function getCategoryImage(category: 'cultural' | 'cafe' | 'food' | 'nature'): string {
	switch (category) {
		case 'cafe':
			return 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&crop=center&q=80'
		case 'food':
			return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop&crop=center&q=80'
		case 'nature':
			return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&crop=center&q=80'
		case 'cultural':
		default:
			return 'https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=1d0f0330-cfb2-4a40-82ce-37c02fb61768'
	}
}

/**
 * 장소 정보를 기반으로 이미지와 카테고리 반환
 */
export async function getPlaceDetails(_placeId: string, placeName?: string): Promise<{
	image: string
	category: 'cultural' | 'cafe' | 'food' | 'nature'
} | null> {
	try {
		if (!placeName) {
			return {
				image: 'https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=1d0f0330-cfb2-4a40-82ce-37c02fb61768',
				category: 'cultural'
			}
		}
		
		// 카테고리 추론
		const category = inferCategoryFromName(placeName)
		
		// 카테고리별 이미지 가져오기
		const image = getCategoryImage(category)
		
		return { image, category }
	} catch (error) {
		console.error('Failed to get place details:', error)
		return null
	}
}
