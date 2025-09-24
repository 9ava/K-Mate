import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { listKMapMarkers, createKMapMarker, updateKMapMarker, getMarkersByPlaceType as apiGetMarkersByPlaceType } from '../../api/kmap'
import type { KMapMarker } from '../../api/kmap'

// Note: API availability is checked by attempting API calls and falling back to local storage

// Use the KMapMarker interface from API
export type MapMarker = KMapMarker & {
	id: number // Make id required for local state
}

// Map category to PlaceType
export const categoryToPlaceType = {
	'K-Travel': 'travel',
	'K-Food': 'food',
	'K-Cafe': 'cafe'
} as const

type State = {
	markers: MapMarker[]
	loading: boolean
	error: string | null
	isApiMode: boolean
}

type Actions = {
	// Data loading
	loadMarkers: () => Promise<void>

	// CRUD operations
	addMarker: (marker: Omit<KMapMarker, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
	updateMarker: (id: number, updates: Partial<KMapMarker>) => Promise<void>
	deleteMarker: (id: number) => Promise<void>
	toggleMarkerStatus: (id: number) => Promise<void>

	// Getters
	getMarkersByCategory: (category: string) => MapMarker[]
	getActiveMarkers: () => MapMarker[]
	getMarkersByPlaceType: (type: 'travel' | 'food' | 'cafe') => Promise<MapMarker[]>
}

export const useMapStore = create<State & Actions>()(
	devtools(
		persist(
			(set, get) => ({
				markers: [
					// Fallback demo data for when API is not available
					{
						id: 1,
						place_id: 'ChIJzaOKGAiafDURdKWEEJfhCQY',
						name: '경복궁',
						address: '서울 종로구 사직로 161',
						category: 'K-Travel',
						latitude: 37.5796,
						longitude: 126.977,
						description: '조선왕조의 법궁으로 한국의 대표적인 궁궐',
						imageUrl: 'https://picsum.photos/400/300?1',
						status: 'active',
						createdAt: '2024-01-15',
					},
					{
						id: 2,
						place_id: 'ChIJ5bQQANWffDURXBaFSDg7L4g',
						name: '명동 교자',
						address: '서울 중구 명동10길 29',
						category: 'K-Food',
						latitude: 37.5636,
						longitude: 126.9834,
						description: '유명한 만두 전문점',
						imageUrl: 'https://picsum.photos/400/300?2',
						status: 'active',
						createdAt: '2024-01-14',
					},
					{
						id: 3,
						place_id: 'ChIJR2CxaNKffDURVwZgOV7QDwQ',
						name: '스타벅스 명동점',
						address: '서울 중구 명동길 52',
						category: 'K-Cafe',
						latitude: 37.5640,
						longitude: 126.9854,
						description: '명동 중심가의 대표적인 카페',
						imageUrl: 'https://picsum.photos/400/300?3',
						status: 'active',
						createdAt: '2024-01-13',
					},
					{
						id: 4,
						place_id: 'ChIJS8KpktOffDUR_bdBWGgJXA8',
						name: '강남 스타일 거리',
						address: '서울 강남구 테헤란로',
						category: 'K-Travel',
						latitude: 37.5665,
						longitude: 127.0782,
						description: '강남의 대표적인 쇼핑 거리',
						imageUrl: 'https://picsum.photos/400/300?4',
						status: 'active',
						createdAt: '2024-01-12',
					},
					{
						id: 5,
						place_id: 'ChIJZVZGYL6ffDURXBaFSDg7L4g',
						name: '광화문 토스트',
						address: '서울 종로구 세종대로 172',
						category: 'K-Food',
						latitude: 37.5715,
						longitude: 126.9769,
						description: '아침 간단식사로 인기인 토스트 전문점',
						imageUrl: 'https://picsum.photos/400/300?5',
						status: 'active',
						createdAt: '2024-01-11',
					},
					{
						id: 6,
						place_id: 'ChIJdQzw1tOhfDUR2F0gV23QXgQ',
						name: '홍대 상상마당',
						address: '서울 마포구 어울마당로 65',
						category: 'K-Cafe',
						latitude: 37.5547,
						longitude: 126.9236,
						description: '복합문화공간 내 특색있는 카페',
						imageUrl: 'https://picsum.photos/400/300?6',
						status: 'active',
						createdAt: '2024-01-10',
					}
				],
				loading: false,
				error: null,
				isApiMode: false,

				// Load markers - try API first, fallback to local storage
				loadMarkers: async () => {
					try {
						set({ loading: true, error: null })

						// Try API first
						const response = await listKMapMarkers()
						set({
							markers: response.markers.filter((m: KMapMarker) => m.id) as MapMarker[],
							loading: false,
							isApiMode: true
						})
					} catch (error) {
						// Fallback to local storage (which will use the initial demo data)
						console.warn('API not available, using local storage fallback')
						set({
							loading: false,
							isApiMode: false,
							error: null // Don't show error in fallback mode
						})
					}
				},

				// CRUD operations - API or local fallback
				addMarker: async (markerData) => {
					const state = get()
					try {
						set({ loading: true, error: null })

						try {
							// Always try API first (it has auth fallback now)
							const newMarker = await createKMapMarker(markerData)

							set((state) => ({
								markers: [...state.markers, newMarker as MapMarker],
								loading: false,
								isApiMode: true // Successfully used API (even if mocked)
							}))
						} catch (apiError) {
							console.warn('[Store] API failed, using local fallback:', apiError)

							// Local fallback if API completely fails
							const newMarker: MapMarker = {
								...markerData,
								id: Date.now(),
								createdAt: new Date().toISOString().split('T')[0]
							}
							set((state) => ({
								markers: [...state.markers, newMarker],
								loading: false,
								isApiMode: false
							}))
						}
					} catch (error) {
						set({ error: error instanceof Error ? error.message : 'Failed to add marker', loading: false })
					}
				},

				updateMarker: async (id, updates) => {
					const state = get()
					try {
						set({ loading: true, error: null })

						if (state.isApiMode) {
							// Use API
							const updatedMarker = await updateKMapMarker(id, updates)
							set((state) => ({
								markers: state.markers.map(marker =>
									marker.id === id ? { ...marker, ...updatedMarker } : marker
								),
								loading: false
							}))
						} else {
							// Local fallback
							set((state) => ({
								markers: state.markers.map(marker =>
									marker.id === id ? { ...marker, ...updates } : marker
								),
								loading: false
							}))
						}
					} catch (error) {
						if (state.isApiMode) {
							set({ error: error instanceof Error ? error.message : 'Failed to update marker', loading: false })
						}
					}
				},

				deleteMarker: async (id) => {
					const state = get()
					try {
						set({ loading: true, error: null })

						if (state.isApiMode) {
							// Use API delete endpoint
							const { deleteKMapMarker } = await import('../../api/kmap')
							await deleteKMapMarker(id)
							set((state) => ({
								markers: state.markers.filter(marker => marker.id !== id),
								loading: false
							}))
						} else {
							// Local fallback only
							set((state) => ({
								markers: state.markers.filter(marker => marker.id !== id),
								loading: false
							}))
						}
					} catch (error) {
						set({ error: error instanceof Error ? error.message : 'Failed to delete marker', loading: false })
					}
				},

				toggleMarkerStatus: async (id) => {
					const state = get()
					try {
						set({ loading: true, error: null })

						if (state.isApiMode) {
							// API mode - toggle not supported by Places API
							set({
								error: 'Toggle status functionality not available in current API.',
								loading: false
							})
							return
						} else {
							// Local fallback only
							set((state) => ({
								markers: state.markers.map(marker =>
									marker.id === id
										? { ...marker, status: marker.status === 'active' ? 'inactive' : 'active' }
										: marker
								),
								loading: false
							}))
						}
					} catch (error) {
						set({ error: error instanceof Error ? error.message : 'Failed to toggle marker status', loading: false })
					}
				},

				// Getters
				getMarkersByCategory: (category) => {
					return get().markers.filter(marker =>
						marker.category === category && marker.status === 'active'
					)
				},

				getActiveMarkers: () => {
					return get().markers.filter(marker => marker.status === 'active')
				},

				getMarkersByPlaceType: async (type) => {
					const state = get()

					// Always try API first, then fallback to local
					try {
						const apiMarkers = await apiGetMarkersByPlaceType(type)
						return apiMarkers.filter((m: KMapMarker) => m.id) as MapMarker[]
					} catch (error) {
						console.warn('[Store] API failed, using local store fallback:', error)
						// Fallback to local store
						const categoryMappings = {
							travel: ['K-Travel'],
							food: ['K-Food'],
							cafe: ['K-Cafe']
						}
						const localMarkers = state.markers.filter(marker =>
							categoryMappings[type].includes(marker.category) && marker.status === 'active'
						)
						return localMarkers
					}
				},
			}),
			{
				name: 'k-mate-map-store',
			}
		)
	)
)