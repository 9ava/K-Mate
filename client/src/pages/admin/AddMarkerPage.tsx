import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMapStore } from '../../features/map/map.store'
import { useAuth } from '../../features/auth/useAuth'

// Use Google Maps API types directly
type PlaceResult = google.maps.places.PlaceResult

export default function AddMarkerPage() {
	const navigate = useNavigate()
	const { addMarker } = useMapStore()
	const { isAuthed, ready, refresh } = useAuth()
	const mapRef = useRef<HTMLDivElement>(null)
	const searchInputRef = useRef<HTMLInputElement>(null)
	const [map, setMap] = useState<google.maps.Map | null>(null)
	const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null)
	const [searchResults, setSearchResults] = useState<PlaceResult[]>([])
	const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [markers, setMarkers] = useState<google.maps.Marker[]>([])

	// Form data for new marker
	const [markerData, setMarkerData] = useState({
		name: '',
		category: 'K-Travel' as 'K-Travel' | 'K-Food' | 'K-Cafe',
		description: '',
		imageUrl: ''
	})

	const categories: ('K-Travel' | 'K-Food' | 'K-Cafe')[] = ['K-Travel', 'K-Food', 'K-Cafe']

	// Check authentication on mount
	useEffect(() => {
		refresh()
	}, [refresh])

	// Redirect if not authenticated
	useEffect(() => {
		if (ready && !isAuthed) {
			alert('로그인이 필요합니다.')
			navigate('/login')
		}
	}, [ready, isAuthed, navigate])

	// Show loading while checking auth
	if (!ready) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
				<div className="text-center">
					<div className="mb-4">
						<div className="w-8 h-8 mx-auto border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
					</div>
					<p className="text-gray-600">인증 상태를 확인하고 있습니다...</p>
				</div>
			</div>
		)
	}

	// Show login required message if not authenticated
	if (!isAuthed) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
				<div className="text-center">
					<h1 className="mb-2 text-2xl font-bold text-gray-900">로그인이 필요합니다</h1>
					<p className="text-gray-600">새 마커를 추가하려면 로그인이 필요합니다.</p>
					<button
						onClick={() => navigate('/login')}
						className="px-4 py-2 mt-4 text-white bg-blue-600 rounded-md hover:bg-blue-700"
					>
						로그인 페이지로 이동
					</button>
				</div>
			</div>
		)
	}

	// Helper function to extract lat/lng from Google Maps LatLng
	const getLatLng = (location: google.maps.LatLng) => {
		return {
			lat: typeof location.lat === 'function' ? location.lat() : (location.lat as unknown as number),
			lng: typeof location.lng === 'function' ? location.lng() : (location.lng as unknown as number)
		}
	}

	useEffect(() => {
		// Initialize Google Maps
		if (!window.google || !mapRef.current) return

		const mapInstance = new google.maps.Map(mapRef.current, {
			center: { lat: 37.5665, lng: 126.9780 }, // Seoul center
			zoom: 13,
			mapTypeControl: true,
			streetViewControl: true,
			fullscreenControl: true,
		})

		const placesServiceInstance = new google.maps.places.PlacesService(mapInstance)

		setMap(mapInstance)
		setPlacesService(placesServiceInstance)

		// Initialize autocomplete
		if (searchInputRef.current) {
			const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
				componentRestrictions: { country: 'kr' }, // Restrict to South Korea
				fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types', 'photos', 'rating', 'business_status']
			})

			autocomplete.addListener('place_changed', () => {
				const place = autocomplete.getPlace()
				if (place.place_id) {
					handlePlaceSelection(place)
				}
			})
		}
	}, [])

	const searchPlaces = (query: string) => {
		if (!placesService || !query.trim()) return

		setIsLoading(true)

		const request = {
			query: query,
			location: new google.maps.LatLng(37.5665, 126.9780), // Seoul center
			radius: 50000, // 50km radius
		}

		placesService.textSearch(request, (results, status) => {
			setIsLoading(false)
			if (status === google.maps.places.PlacesServiceStatus.OK && results) {
				setSearchResults(results.slice(0, 10)) // Limit to 10 results
			} else {
				setSearchResults([])
			}
		})
	}

	const handlePlaceSelection = (place: PlaceResult) => {
		setSelectedPlace(place)
		setMarkerData(prev => ({
			...prev,
			name: place.name || ''
		}))

		// Clear existing markers
		markers.forEach(marker => marker.setMap(null))
		setMarkers([])

		// Add new marker
		if (map && place.geometry?.location) {
			const { lat, lng } = getLatLng(place.geometry.location)

			const marker = new google.maps.Marker({
				position: { lat, lng },
				map: map,
				title: place.name,
				icon: {
					url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
					scaledSize: new google.maps.Size(32, 32)
				}
			})

			setMarkers([marker])

			// Center map on selected place
			map.setCenter({ lat, lng })
			map.setZoom(16)

			// Create info window
			const infoWindow = new google.maps.InfoWindow({
				content: `
					<div style="max-width: 300px;">
						<h3 style="margin: 0 0 8px 0; font-weight: bold;">${place.name}</h3>
						<p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${place.formatted_address}</p>
						<p style="margin: 0; color: #999; font-size: 12px;">Place ID: ${place.place_id}</p>
						${place.rating ? `<p style="margin: 4px 0 0 0; color: #333; font-size: 14px;">⭐ ${place.rating}</p>` : ''}
					</div>
				`
			})

			marker.addListener('click', () => {
				infoWindow.open(map, marker)
			})

			// Open info window immediately
			infoWindow.open(map, marker)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!selectedPlace || !markerData.name.trim()) {
			alert('장소를 선택하고 필수 정보를 입력해주세요.')
			return
		}

		try {
			setIsLoading(true)

			console.log('[Add Marker] Checking authentication...')

			// Save to the API/database
			const { lat, lng } = selectedPlace.geometry?.location
				? getLatLng(selectedPlace.geometry.location)
				: { lat: 0, lng: 0 }

			const newMarker = {
				place_id: selectedPlace.place_id,
				name: markerData.name,
				address: selectedPlace.formatted_address || '',
				category: markerData.category,
				latitude: lat,
				longitude: lng,
				description: markerData.description,
				imageUrl: markerData.imageUrl,
				status: 'active' as const
			}

			console.log('[Add Marker] Adding marker:', newMarker)
			await addMarker(newMarker)
			console.log('[Add Marker] Marker added successfully')
			alert('마커가 성공적으로 추가되었습니다!\n(테스트 모드: 실제 데이터베이스에는 저장되지 않을 수 있습니다)')
			navigate('/admin/map')
		} catch (error) {
			console.error('Failed to add marker:', error)
			alert('마커 추가에 실패했습니다. 다시 시도해주세요.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="min-h-[calc(100vh-3.5rem)] bg-gray-50">
			<div className="px-4 py-8 mx-auto max-w-7xl">
				{/* Header */}
				<div className="relative mb-8">
					<div className="text-center">
						<h1 className="mb-2 text-3xl font-bold text-gray-900">새 마커 추가</h1>
						<p className="text-gray-600">Google Places를 검색하여 새로운 지도 마커를 추가합니다</p>
					</div>
					<div className="absolute top-0 right-0">
						<button
							onClick={() => navigate('/admin/map')}
							className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
						>
							돌아가기
						</button>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
					{/* Left: Search and Form */}
					<div className="space-y-6">
						{/* Search */}
						<div className="p-6 bg-white rounded-lg shadow">
							<h2 className="mb-4 text-lg font-semibold">장소 검색</h2>
							<div className="space-y-4">
								<div>
									<label className="block mb-2 text-sm font-medium text-gray-700">
										장소명 또는 주소 검색
									</label>
									<input
										ref={searchInputRef}
										type="text"
										placeholder="예: 경복궁, 명동성당, 홍대입구역..."
										className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault()
												searchPlaces(e.currentTarget.value)
											}
										}}
									/>
								</div>
								<button
									onClick={() => {
										if (searchInputRef.current) {
											searchPlaces(searchInputRef.current.value)
										}
									}}
									disabled={isLoading}
									className="w-full px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400"
								>
									{isLoading ? '검색 중...' : '검색'}
								</button>
							</div>

							{/* Search Results */}
							{searchResults.length > 0 && (
								<div className="mt-6">
									<h3 className="mb-3 text-sm font-medium text-gray-700">검색 결과</h3>
									<div className="space-y-2 max-h-60 overflow-y-auto">
										{searchResults.map((place) => (
											<button
												key={place.place_id}
												onClick={() => handlePlaceSelection(place)}
												className={`w-full p-3 text-left border rounded-md hover:bg-gray-50 ${
													selectedPlace?.place_id === place.place_id
														? 'border-red-500 bg-red-50'
														: 'border-gray-200'
												}`}
											>
												<div className="font-medium text-gray-900">{place.name}</div>
												<div className="text-sm text-gray-500">{place.formatted_address}</div>
												{place.rating && (
													<div className="text-xs text-gray-400">⭐ {place.rating}</div>
												)}
											</button>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Form */}
						{selectedPlace && (
							<form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow">
								<h2 className="mb-4 text-lg font-semibold">마커 정보 입력</h2>

								<div className="space-y-4">
									<div>
										<label className="block mb-2 text-sm font-medium text-gray-700">
											마커명 *
										</label>
										<input
											type="text"
											value={markerData.name}
											onChange={(e) => setMarkerData(prev => ({ ...prev, name: e.target.value }))}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
											required
										/>
									</div>

									<div>
										<label className="block mb-2 text-sm font-medium text-gray-700">
											카테고리 *
										</label>
										<select
											value={markerData.category}
											onChange={(e) => setMarkerData(prev => ({ ...prev, category: e.target.value as typeof markerData.category }))}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
										>
											{categories.map(category => (
												<option key={category} value={category}>{category}</option>
											))}
										</select>
									</div>

									<div>
										<label className="block mb-2 text-sm font-medium text-gray-700">
											설명
										</label>
										<textarea
											value={markerData.description}
											onChange={(e) => setMarkerData(prev => ({ ...prev, description: e.target.value }))}
											rows={3}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
											placeholder="마커에 대한 간단한 설명을 입력하세요..."
										/>
									</div>

									<div>
										<label className="block mb-2 text-sm font-medium text-gray-700">
											이미지 URL
										</label>
										<input
											type="url"
											value={markerData.imageUrl}
											onChange={(e) => setMarkerData(prev => ({ ...prev, imageUrl: e.target.value }))}
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
											placeholder="https://example.com/image.jpg"
										/>
									</div>

									{/* Selected Place Info */}
									<div className="p-4 bg-gray-50 rounded-md">
										<h4 className="mb-2 font-medium text-gray-900">선택된 장소</h4>
										<div className="text-sm text-gray-600 space-y-1">
											<div><strong>이름:</strong> {selectedPlace.name}</div>
											<div><strong>주소:</strong> {selectedPlace.formatted_address}</div>
											<div><strong>좌표:</strong> {
												selectedPlace.geometry?.location ? (() => {
													const { lat, lng } = getLatLng(selectedPlace.geometry.location)
													return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
												})() : '위치 정보 없음'
											}</div>
											<div><strong>Place ID:</strong> {selectedPlace.place_id}</div>
										</div>
									</div>

									<button
										type="submit"
										className="w-full px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
									>
										마커 추가
									</button>
								</div>
							</form>
						)}
					</div>

					{/* Right: Map */}
					<div className="bg-white rounded-lg shadow">
						<div className="p-4 border-b">
							<h2 className="text-lg font-semibold">지도 미리보기</h2>
							<p className="text-sm text-gray-600">검색한 장소가 지도에 표시됩니다</p>
						</div>
						<div
							ref={mapRef}
							className="w-full h-96 lg:h-[600px] rounded-b-lg"
						/>
					</div>
				</div>
			</div>
		</div>
	)
}