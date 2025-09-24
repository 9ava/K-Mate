// src/lib/hybridSearch.ts
import { loadKakao } from './kakao'
import { searchGooglePlaces } from './googlePlaces'

export interface HybridPlace {
  id: string
  name: string
  nameEn?: string
  nameKo?: string
  lat: number
  lng: number
  address?: string
  source: 'kakao' | 'google'
  photoName?: string
  types?: string[]
}

/**
 * 하이브리드 검색: 카카오 지도 + Google Places 조합
 * @param query 검색어
 * @param currentLanguage 현재 언어 (ko, en, zh)
 * @returns 통합 검색 결과
 */
export async function hybridSearch(query: string, currentLanguage: string = 'ko'): Promise<HybridPlace[]> {
  const results: HybridPlace[] = []
  
  try {
    // 1. 카카오 검색 (한국어 기준, 정확도 높음)
    const kakaoResults = await searchKakaoPlaces(query)
    
    // 2. Google 검색 (다국어 지원)
    const googleResults = await searchGooglePlaces(query, currentLanguage)
    
    // 3. 카카오 결과를 우선으로 추가
    kakaoResults.forEach(place => {
      results.push({
        id: place.id,
        name: place.name,
        nameKo: place.name, // 카카오는 항상 한국어
        lat: place.lat,
        lng: place.lng,
        address: place.address,
        source: 'kakao'
      })
    })
    
    // 4. Google 결과 중 중복되지 않는 것들 추가
    googleResults.forEach(place => {
      // 거리 기반 중복 체크 (100m 이내면 같은 장소로 간주)
      const isDuplicate = results.some(existing => {
        const distance = calculateDistance(
          existing.lat, existing.lng,
          place.lat, place.lng
        )
        return distance < 100 // 100미터 이내
      })
      
      if (!isDuplicate) {
        results.push({
          id: place.placeId,
          name: place.name,
          nameEn: currentLanguage === 'en' ? place.name : undefined,
          lat: place.lat,
          lng: place.lng,
          address: place.address,
          source: 'google',
          photoName: place.photoName,
          types: place.types
        })
      }
    })
    
    return results
  } catch (error) {
    console.error('Hybrid search failed:', error)
    return []
  }
}

/**
 * 카카오 지도 검색
 */
async function searchKakaoPlaces(query: string): Promise<Array<{
  id: string
  name: string
  lat: number
  lng: number
  address?: string
}>> {
  try {
    if (!window.kakao?.maps?.services) {
      await loadKakao()
    }
    
    return new Promise((resolve) => {
      const ps = new window.kakao.maps.services.Places()
      ps.keywordSearch(
        query,
        (data: any, status: string) => {
          if (status !== window.kakao.maps.services.Status.OK) {
            resolve([])
            return
          }
          
          const results = data.map((d: any) => ({
            id: d.id,
            name: d.place_name,
            lat: +d.y,
            lng: +d.x,
            address: d.road_address_name || d.address_name,
          }))
          
          resolve(results)
        },
        { size: 10 }
      )
    })
  } catch (error) {
    console.error('Kakao search failed:', error)
    return []
  }
}

/**
 * 두 좌표 간의 거리 계산 (미터 단위)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3 // 지구 반지름 (미터)
  const φ1 = lat1 * Math.PI/180
  const φ2 = lat2 * Math.PI/180
  const Δφ = (lat2-lat1) * Math.PI/180
  const Δλ = (lng2-lng1) * Math.PI/180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c // 미터 단위 거리
}

/**
 * 현재 언어에 맞는 장소명 반환
 */
export function getLocalizedPlaceName(place: HybridPlace, language: string): string {
  switch (language) {
    case 'en':
      return place.nameEn || place.name
    case 'ko':
      return place.nameKo || place.name
    default:
      return place.name
  }
}