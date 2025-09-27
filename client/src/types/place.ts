// src/types/place.ts
export type PlaceType = 'travel' | 'food' | 'cafe'

export type Place = {
	id: number
	googlePlaceId: string
	type: PlaceType | null
	name: string
	address: string | null
	lat: number
	lng: number
	phone: string | null
	website: string | null
	googleMapsUrl: string | null
	openingHoursJson?: any | null
	photosJson?: any[] | null // v1 photo objects (name 포함)
	sourceTypesJson?: string[] | null
	typeSource?: 'auto' | 'admin'
	description: string | null
	isAdvertisement?: boolean // 광고 여부 필드 추가
	lastSyncedAt?: string | null // ISO
	createdAt?: string
	updatedAt?: string
	// 프론트 편의를 위한 파생 필드들
	rating?: number // (원하면 서버 확장)
	userRatingsTotal?: number // (원하면 서버 확장)
	photoUrl?: string // photosJson -> 프록시 URL
}

export type PlaceListResponse = {
	items: Place[]
	total: number
	page: number
	pageSize: number
	totalPages?: number
}
