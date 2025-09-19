// src/api/bookmarks.ts
import { api } from './client'

export async function addBookmark(placeId: string) {
	const { data } = await api.post(`/places/${placeId}/bookmark`)
	return data?.data
}

export async function removeBookmark(placeId: string) {
	const { data } = await api.delete(`/places/${placeId}/bookmark`)
	return data?.success === true
}

export async function listMyBookmarks() {
	const { data } = await api.get(`/places/bookmarks/me`)
	return data?.data as Array<{
		placeId: string
		name: string
		address: string | null
		lat: number
		lng: number
		googleMapsUrl: string | null
		type?: 'travel' | 'food' | 'cafe'
		createdAt: string
	}>
}
