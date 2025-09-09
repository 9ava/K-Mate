import { api } from './client'
import type { PlaceListResponse, PlaceType } from '../lib/types/place'

export async function fetchPlacesByType(type: PlaceType, pageSize = 200) {
	const { data } = await api.get<PlaceListResponse>('/places', {
		params: { type, page: 1, pageSize },
	})
	return data.items
}
