// src/api/bookmarks.ts
import { api, isMockMode } from './client'
import { mockPlacesApi } from '../mocks/api'

export async function addBookmark(placeId: string) {
	if (isMockMode) {
		return mockPlacesApi.addBookmark(placeId)
	}
	const { data } = await api.post(`/places/${placeId}/bookmark`)
	return data?.data
}

export async function removeBookmark(placeId: string) {
	if (isMockMode) {
		return mockPlacesApi.removeBookmark(placeId)
	}
	const { data } = await api.delete(`/places/${placeId}/bookmark`)
	return data?.success === true
}

export async function listMyBookmarks() {
	if (isMockMode) {
		return mockPlacesApi.listMyBookmarks()
	}
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
