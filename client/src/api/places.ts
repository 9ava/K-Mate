// src/api/places.ts
import { api } from './client'
import type { Place, PlaceListResponse, PlaceType } from '../types/place'

export async function listPlaces(params: {
	type?: PlaceType
	q?: string
	page?: number
	pageSize?: number
}): Promise<PlaceListResponse> {
	const { data } = await api.get('/places', { params })
	// 서버: { success: true, data: {...} }
	const payload = data?.data as PlaceListResponse
	return {
		...payload,
		totalPages: Math.ceil(payload.total / payload.pageSize),
	}
}

export async function getPlaceDetail(googlePlaceId: string): Promise<Place> {
	const { data } = await api.get(`/places/${googlePlaceId}`)
	const p = data?.data as Place

	// photoUrl 파생 (v1 photo name -> 프록시)
	const photoName: string | undefined = p?.photosJson?.[0]?.name
	const photoUrl = photoName ? buildPhotoUrl(photoName, { maxHeightPx: 800 }) : undefined

	return { ...p, photoUrl }
}

export async function fetchMyBookmarks() {
	const { data } = await api.get<Place[]>('/places/bookmarks/me')
	return data
}

// 서버 프록시 경유 URL (302 redirect)
export function buildPhotoUrl(
	photoName?: string,
	opts?: { maxHeightPx?: number; maxWidthPx?: number }
) {
	if (!photoName) return undefined
	const base = import.meta.env.VITE_API_URL || '' // ✅ 이름 그대로 사용
	const qs = new URLSearchParams()
	if (opts?.maxHeightPx) qs.set('maxHeightPx', String(opts.maxHeightPx))
	if (opts?.maxWidthPx) qs.set('maxWidthPx', String(opts.maxWidthPx))
	qs.set('name', photoName)
	return `${base}/places/photo?${qs.toString()}`
}
