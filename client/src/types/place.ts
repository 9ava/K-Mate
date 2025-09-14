export type PlaceType = 'travel' | 'food' | 'cafe'

export type Place = {
	id: number
	type: PlaceType
	name: string
	lat: number
	lng: number
	address?: string | null
	phone?: string | null
	website?: string | null
	google_place_id?: string | null
	distance?: number

	rating?: number
	userRatingsTotal?: number
	photoUrl?: string
	description?: string
	reviews?: string[]
}

export type PlaceListResponse = {
	items: Place[]
	total: number
	page: number
	pageSize: number
	totalPages: number
}
