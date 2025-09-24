// src/api/kmap.ts - Using existing Places API for K-Map functionality
import { api } from './client'
import type { Place } from '../types/place'

// Map K-Map categories to the backend categories
const categoryMapping = {
	'K-Travel': 'travel',
	'K-Food': 'food',
	'K-Cafe': 'cafe'
} as const

const reverseCategoryMapping = {
	'travel': 'K-Travel',
	'food': 'K-Food',
	'cafe': 'K-Cafe'
} as const

export interface KMapMarker {
	id?: number
	place_id?: string
	name: string
	address: string
	category: 'K-Travel' | 'K-Food' | 'K-Cafe'
	latitude: number
	longitude: number
	description?: string
	imageUrl?: string
	status: 'active' | 'inactive'
	createdAt?: string
	updatedAt?: string
}

export interface KMapMarkersResponse {
	markers: KMapMarker[]
	total: number
}

// Convert Place entity to KMapMarker format
function placeToKMapMarker(place: Place): KMapMarker {
	return {
		id: place.id,
		place_id: place.googlePlaceId,
		name: place.name,
		address: place.address || '',
		category: place.type ? reverseCategoryMapping[place.type] : 'K-Travel',
		latitude: place.lat,
		longitude: place.lng,
		description: place.description || undefined,
		imageUrl: place.photosJson?.[0]?.url || undefined,
		status: 'active', // Places are active by default
		createdAt: place.createdAt,
		updatedAt: place.updatedAt
	}
}

// Get all K-Map markers using Places API
export async function listKMapMarkers(params?: {
	category?: string
	status?: string
	search?: string
	page?: number
	pageSize?: number
}): Promise<KMapMarkersResponse> {
	const { data } = await api.get('/places', {
		params: {
			type: params?.category ? categoryMapping[params.category as keyof typeof categoryMapping] : undefined,
			q: params?.search,
			page: params?.page,
			pageSize: params?.pageSize || 50
		}
	})

	const placesData = data?.data
	const markers = placesData?.items?.map(placeToKMapMarker) || []

	return {
		markers,
		total: placesData?.total || markers.length
	}
}

// Get markers by place type (for K-Map categories)
export async function getMarkersByPlaceType(type: 'travel' | 'food' | 'cafe'): Promise<KMapMarker[]> {
	const { data } = await api.get('/places', {
		params: {
			type,
			pageSize: 100 // Get all for category
		}
	})

	const placesData = data?.data
	const markers = placesData?.items?.map(placeToKMapMarker) || []
	return markers
}

// Create a new K-Map marker using admin/add endpoint
export async function createKMapMarker(marker: Omit<KMapMarker, 'id' | 'createdAt' | 'updatedAt'>): Promise<KMapMarker> {
	if (!marker.place_id) {
		throw new Error('Place ID is required to add a marker. Please search for the place first.')
	}

	const payload = {
		placeId: marker.place_id,
		name: marker.name,
		category: marker.category,
		description: marker.description,
		imageUrl: marker.imageUrl,
	}

	try {
		const { data } = await api.post('/places/add', payload)

		const place = data?.data as Place
		const result = placeToKMapMarker(place)
		return result
	} catch (error: any) {
		console.error('Full error response:', error.response);
		console.error('Error status:', error.response?.status);
		console.error('Error data:', error.response?.data);
		console.error('Error message:', error.message);
		if (error.response?.data?.message) {
			console.error('Server validation error:', error.response.data.message);
		}
		throw error;
	}
}

// Update an existing K-Map marker (limited to category changes)
export async function updateKMapMarker(id: number, updates: Partial<KMapMarker>): Promise<KMapMarker> {
	// Find the place by ID first
	const { data: listData } = await api.get('/places', { params: { pageSize: 100 } })
	const place = listData?.data?.items?.find((p: Place) => p.id === id)

	if (!place) {
		throw new Error('Marker not found')
	}

	// Update category if provided
	if (updates.category && place.type) {
		const currentCategory = reverseCategoryMapping[place.type as keyof typeof reverseCategoryMapping]
		if (updates.category !== currentCategory) {
			const targetType = categoryMapping[updates.category as keyof typeof categoryMapping]
			await api.put(`/places/${place.googlePlaceId}/type`, {
				type: targetType
			})
			place.type = targetType
		}
	}

	return placeToKMapMarker(place)
}

// Delete a K-Map marker
export async function deleteKMapMarker(id: number): Promise<void> {
	await api.delete(`/places/admin/${id}`)
}

// Toggle marker status (not supported by Places API - would need backend extension)
export async function toggleKMapMarkerStatus(_id: number): Promise<KMapMarker> {
	throw new Error('Toggle status functionality not available in current Places API')
}