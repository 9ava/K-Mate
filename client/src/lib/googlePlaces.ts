// src/lib/googlePlaces.ts
export interface GooglePlace {
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
  photoName?: string
  types?: string[]
}

/**
 * 백엔드를 통해 Google Places API로 텍스트 검색 (다국어 지원)
 * @param query 검색어
 * @param language 언어 코드 (ko, en, zh)
 * @param lat 위도 (옵션)
 * @param lng 경도 (옵션)
 * @returns 검색 결과 배열
 */
export async function searchGooglePlaces(
  query: string, 
  language: string = 'en',
  lat?: number,
  lng?: number
): Promise<GooglePlace[]> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const params = new URLSearchParams({
      q: query,
      language,
    })
    
    if (lat !== undefined) params.append('lat', lat.toString())
    if (lng !== undefined) params.append('lng', lng.toString())
    params.append('maxResults', '10')

    const response = await fetch(`${apiUrl}/places/search?${params}`)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      console.warn('Places search failed:', data.error)
      return []
    }

    return data.data || []
  } catch (error) {
    console.error('Failed to search Google Places:', error)
    return []
  }
}

/**
 * 백엔드를 통해 Google Places API로 근처 장소 검색
 * @param lat 위도
 * @param lng 경도
 * @param radius 검색 반경 (미터)
 * @param types 장소 타입 배열 (옵션)
 * @returns 근처 장소 배열
 */
export async function searchNearbyGooglePlaces(
  lat: number, 
  lng: number, 
  radius: number = 1000,
  types?: string[]
): Promise<GooglePlace[]> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
    })
    
    if (types && types.length > 0) {
      params.append('types', types.join(','))
    }

    const response = await fetch(`${apiUrl}/places/nearby?${params}`)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      console.warn('Places nearby search failed:', data.error)
      return []
    }

    return data.data || []
  } catch (error) {
    console.error('Failed to search nearby Google Places:', error)
    return []
  }
}