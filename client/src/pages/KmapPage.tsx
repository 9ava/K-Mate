// src/pages/KmapPage.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Sidebar from '../components/layout/Sidebar'
import { Loader } from '@googlemaps/js-api-loader'
import { getPlaceDetail, listPlaces } from '../api/places'
import { listMyBookmarks } from '../api/bookmarks'
import { useMapStore } from '../features/map/map.store'
import { useAuth } from '../features/auth/useAuth'
import type { Place, PlaceType } from '../types/place'
import SidePanel from '../components/places/SidePanel'
import SearchList from '../components/places/SearchList'

type Mode = 'type' | 'bookmarks'

export default function KmapPage() {
	const { t } = useTranslation()
	const mapRef = useRef<HTMLDivElement>(null)
	const mapObjRef = useRef<google.maps.Map | null>(null)
	const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
	const infoRef = useRef<google.maps.InfoWindow | null>(null)

	const { getMarkersByPlaceType } = useMapStore()
	const { isAuthed } = useAuth()

	const [mode, setMode] = useState<Mode>('type') // ✅ 현재 보기 모드
	const [type, setType] = useState<PlaceType | ''>('') // ✅ 초기값을 빈 문자열로 설정
	const [loading, setLoading] = useState(false)
	const [selected, setSelected] = useState<Place | null>(null)
	const [places, setPlaces] = useState<Place[]>([])
	const [titleKey, setTitleKey] = useState<string>('popular') // 번역 키만 저장
	const [showSearchList, setShowSearchList] = useState(false) // ✅ SearchList 표시 상태
	const [bookmarkedPlaces, setBookmarkedPlaces] = useState<Set<string>>(new Set()) // 북마크된 장소 ID 목록
	
	// 실시간 위치 관련 상태
	const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
	const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null)
	const [isTracking, setIsTracking] = useState(false)
	const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
	const watchIdRef = useRef<number | null>(null)
	
	// 실시간 번역 적용되는 title
	const listTitle = t(`kmap.titles.${titleKey}`)
	
	// 로그인 상태 변경 시 북마크 목록 로드
	useEffect(() => {
		if (isAuthed) {
			loadBookmarkedPlaces()
		} else {
			setBookmarkedPlaces(new Set())
		}
	}, [isAuthed])

	const loadBookmarkedPlaces = async () => {
		try {
			const bookmarks = await listMyBookmarks()
			const bookmarkedIds = new Set(bookmarks.map(b => b.placeId))
			setBookmarkedPlaces(bookmarkedIds)
		} catch (error) {
			console.error('북마크 목록 로드 실패:', error)
		}
	}

	// 위치 권한 확인 및 현재 위치 가져오기
	const requestLocationPermission = async (): Promise<boolean> => {
		if (!navigator.geolocation) {
			console.warn('Geolocation is not supported by this browser.')
			return false
		}

		try {
			// 권한 상태 확인
			const permission = await navigator.permissions.query({ name: 'geolocation' })
			setLocationPermission(permission.state)

			if (permission.state === 'granted') {
				return true
			} else if (permission.state === 'prompt') {
				// 권한 요청을 위해 getCurrentPosition 호출
				return new Promise((resolve) => {
					navigator.geolocation.getCurrentPosition(
						() => {
							setLocationPermission('granted')
							resolve(true)
						},
						() => {
							setLocationPermission('denied')
							resolve(false)
						}
					)
				})
			} else {
				return false
			}
		} catch (error) {
			console.error('Error requesting location permission:', error)
			return false
		}
	}

	// 현재 위치 가져오기
	const getCurrentPosition = (): Promise<{ lat: number; lng: number }> => {
		return new Promise((resolve, reject) => {
			if (!navigator.geolocation) {
				reject(new Error('Geolocation not supported'))
				return
			}

			navigator.geolocation.getCurrentPosition(
				(position) => {
					const location = {
						lat: position.coords.latitude,
						lng: position.coords.longitude
					}
					setUserLocation(location)
					resolve(location)
				},
				(error) => {
					console.error('Error getting current position:', error)
					reject(error)
				},
				{
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 60000
				}
			)
		})
	}

	// 사용자 위치 마커 생성/업데이트
	const updateUserLocationMarker = async (location: { lat: number; lng: number }) => {
		const map = mapObjRef.current
		if (!map) return

		try {
			const { AdvancedMarkerElement } = (await loader.importLibrary('marker')) as google.maps.MarkerLibrary

			// 기존 사용자 마커 제거
			if (userMarkerRef.current) {
				userMarkerRef.current.map = null
			}

			// 파란색 원형 마커 생성
			const userIcon = document.createElement('div')
			userIcon.className = 'user-location-marker'
			userIcon.style.cssText = `
				width: 20px;
				height: 20px;
				background-color: #3b82f6;
				border: 3px solid white;
				border-radius: 50%;
				box-shadow: 0 2px 6px rgba(0,0,0,0.3);
				position: relative;
			`

			// 새 사용자 마커 생성
			userMarkerRef.current = new AdvancedMarkerElement({
				map,
				position: location,
				content: userIcon,
				title: 'My Location' // 영어로 변경
			})

			console.log('[K-Map] User location marker updated:', location)
		} catch (error) {
			console.error('Error updating user location marker:', error)
		}
	}

	// 현재 위치로 이동
	const moveToCurrentLocation = async () => {
		try {
			const hasPermission = await requestLocationPermission()
			if (!hasPermission) {
				console.warn('Location permission denied')
				return
			}

			const location = await getCurrentPosition()
			const map = mapObjRef.current
			if (map) {
				map.panTo(location)
				map.setZoom(16)
				await updateUserLocationMarker(location)
			}
		} catch (error) {
			console.error('Error moving to current location:', error)
		}
	}

	// 실시간 위치 추적 시작/중지
	const toggleLocationTracking = async () => {
		if (isTracking) {
			// 추적 중지
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current)
				watchIdRef.current = null
			}
			setIsTracking(false)
			console.log('[K-Map] Location tracking stopped')
		} else {
			// 추적 시작
			try {
				const hasPermission = await requestLocationPermission()
				if (!hasPermission) {
					console.warn('Location permission denied')
					return
				}

				// 초기 위치 설정
				await moveToCurrentLocation()

				// 실시간 추적 시작
				watchIdRef.current = navigator.geolocation.watchPosition(
					async (position) => {
						const location = {
							lat: position.coords.latitude,
							lng: position.coords.longitude
						}
						setUserLocation(location)
						await updateUserLocationMarker(location)
						console.log('[K-Map] Location updated:', location)
					},
					(error) => {
						console.error('Error watching position:', error)
						setIsTracking(false)
					},
					{
						enableHighAccuracy: true,
						timeout: 15000,
						maximumAge: 30000
					}
				)

				setIsTracking(true)
				console.log('[K-Map] Location tracking started')
			} catch (error) {
				console.error('Error starting location tracking:', error)
			}
		}
	}

	// 컴포넌트 언마운트 시 추적 정리
	useEffect(() => {
		return () => {
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current)
			}
		}
	}, [])
	
	const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
	const ENV_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined
	const MAP_ID = ENV_MAP_ID || 'DEMO_MAP_ID'

	const loader = useMemo(() => {
		if (!API_KEY) console.warn('VITE_GOOGLE_MAPS_API_KEY 가 설정되지 않았습니다.')
		if (!ENV_MAP_ID) console.warn('VITE_GOOGLE_MAPS_MAP_ID 가 비어있습니다. DEMO_MAP_ID 사용')
		return new Loader({
			apiKey: API_KEY ?? '',
			version: 'weekly',
			libraries: ['marker'],
			language: 'en', // 영어로 강제 설정
			region: 'KR', // 한국 지역이지만 영어로 표시
		})
	}, [API_KEY, ENV_MAP_ID])

	// 지도 초기화 및 사용자 위치로 시작
	useEffect(() => {
		let cancelled = false
		;(async () => {
			await loader.load()
			if (cancelled || !mapRef.current) return

			const { Map } = (await loader.importLibrary('maps')) as google.maps.MapsLibrary
			
			// 기본 중심점 (서울)
			let mapCenter = { lat: 37.5665, lng: 126.978 }
			let initialZoom = 12
			
			// 사용자 위치 권한 확인 및 가져오기
			try {
				const hasPermission = await requestLocationPermission()
				if (hasPermission) {
					const userPos = await getCurrentPosition()
					mapCenter = userPos
					initialZoom = 16
					console.log('[K-Map] Starting with user location:', userPos)
				} else {
					console.log('[K-Map] Location permission denied, using default center')
				}
			} catch (error) {
				console.warn('[K-Map] Could not get user location, using default center:', error)
			}
			
			// 지도 초기화 (사용자 위치 또는 기본 위치)
			const map = new Map(mapRef.current, {
				center: mapCenter,
				zoom: initialZoom,
				mapId: MAP_ID,
				mapTypeControl: false,
				streetViewControl: false,
				fullscreenControl: false,
			})
			mapObjRef.current = map
			infoRef.current = new google.maps.InfoWindow()
			
			// 사용자 위치 마커 표시 (권한이 있는 경우)
			if (userLocation) {
				await updateUserLocationMarker(userLocation)
			}
		})()

		return () => {
			cancelled = true
		}
	}, [loader, MAP_ID])

	// 모드/타입 변화에 따라 목록 불러오기
	useEffect(() => {
		if (!mapObjRef.current) return
		;(async () => {
			setLoading(true)
			try {
				if (mode === 'type' && type) { // ✅ type이 있을 때만 로드
					setTitleKey(
						type === 'travel' ? 'travel' : 
						type === 'food' ? 'food' : 
						'cafe'
					)

					console.log(`[K-Map] Loading ${type} markers...`)
					// Use API to get markers by place type
					const adminMarkers = await getMarkersByPlaceType(type || 'food')
					console.log(`[K-Map] Loaded ${adminMarkers.length} markers for ${type}:`, adminMarkers)
					const items: Place[] = adminMarkers.map((marker) => ({
						id: marker.id!,
						googlePlaceId: marker.place_id || `admin_${marker.id}`,
						type: (type || 'food') as PlaceType,
						name: marker.name,
						address: marker.address,
						lat: marker.latitude,
						lng: marker.longitude,
						phone: null,
						website: null,
						googleMapsUrl: `https://maps.google.com/maps?q=${marker.latitude},${marker.longitude}`,
						openingHoursJson: null,
						photosJson: marker.imageUrl ? [{ url: marker.imageUrl }] : null,
						sourceTypesJson: null,
						typeSource: undefined,
						description: marker.description || null,
					}))

					setPlaces(items)
					await renderMarkers(items)
					
					// 일반적인 동작: 전체 마커들이 보이도록 fitBounds
					fitBounds(items)
					setSelected(null)
				} else if (mode === 'bookmarks') {
					// bookmarks 모드 - 로그인 상태 확인
					setTitleKey('bookmarks')
					
					if (!isAuthed) {
						// 비로그인 상태: 빈 배열과 특별한 처리
						setPlaces([])
						clearMarkers()
						setSelected(null)
					} else {
						// 로그인 상태: 기존 로직
						const rows = await listMyBookmarks()
						// 북마크 응답 -> Place 형태로 매핑 (상세는 openPlace에서 서버로 조회)
						const items: Place[] = rows.map((r, i) => ({
							id: i, // 임시 키
							googlePlaceId: r.placeId,
							type: (r.type as PlaceType | undefined) ?? null,
							name: r.name,
							address: r.address,
							lat: r.lat,
							lng: r.lng,
							phone: null,
							website: null,
							googleMapsUrl: r.googleMapsUrl,
							openingHoursJson: null,
							photosJson: null,
							sourceTypesJson: null,
							typeSource: undefined,
							description: null,
						}))
						setPlaces(items)
						await renderMarkers(items)
						fitBounds(items)
						setSelected(null)
					}
				}
			} finally {
				setLoading(false)
			}
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode, type, getMarkersByPlaceType])

	const clearMarkers = () => {
		markersRef.current.forEach((m) => (m.map = null))
		markersRef.current = []
	}

	const renderMarkers = async (items: Place[]) => {
		const map = mapObjRef.current!
		clearMarkers()

		const { AdvancedMarkerElement } = (await loader.importLibrary(
			'marker'
		)) as google.maps.MarkerLibrary

		markersRef.current = items.map((p) => {
			const marker = new AdvancedMarkerElement({
				map,
				position: { lat: p.lat, lng: p.lng },
				title: p.name,
			})
			marker.addListener('gmp-click', () => openPlace(p))
			return marker
		})
	}

	const fitBounds = (items: Place[]) => {
		const map = mapObjRef.current!
		if (!items.length) return
		const b = new google.maps.LatLngBounds()
		items.forEach((p) => b.extend({ lat: p.lat, lng: p.lng }))
		map.fitBounds(b)
	}

	// 리스트/마커 클릭 → 서버 상세 조회
	const openPlace = async (p: Place) => {
		const map = mapObjRef.current
		if (!map) return

		map.panTo({ lat: p.lat, lng: p.lng })
		map.setZoom(Math.max(map.getZoom() ?? 12, 14))

		try {
			setLoading(true)
			const full = await getPlaceDetail(p.googlePlaceId)
			setSelected(full)
		} catch {
			setSelected(p)
		} finally {
			setLoading(false)
		}
	}

	const handleClose = () => setSelected(null)

	// 사이드바 핸들러
	const handleSelectType = (t: PlaceType) => {
		setMode('type')
		setType(t)
		setShowSearchList(true) // 카테고리 선택 시 SearchList 바로 열기
	}
	const handleShowBookmarks = () => {
		setMode('bookmarks')
		setType('') // 카테고리 선택 해제
		setShowSearchList(true) // 북마크 클릭 시 SearchList 바로 열기
	}
	const handleToggleMenu = async () => {
		// Menu는 단순히 SearchList 토글하고 모든 활성화 상태 해제
		setShowSearchList(!showSearchList)
		setType('') // 카테고리 활성화 해제
		setMode('type') // 북마크 모드도 해제
		
		// SearchList가 열릴 때 전체 장소 데이터 로드
		if (!showSearchList) {
			try {
				setLoading(true)
				const response = await listPlaces({ pageSize: 100 }) // 전체 장소 가져오기
				setPlaces(response.items)
				setTitleKey('all_places')
				await renderMarkers(response.items)
			} catch (error) {
				console.error('전체 장소 로드 실패:', error)
			} finally {
				setLoading(false)
			}
		}
	}

	// 북마크 변경 시 북마크 리스트 새로고침
	const handleBookmarkChange = async () => {
		// 북마크 목록 새로고침
		await loadBookmarkedPlaces()
		
		// 북마크 모드인 경우 리스트도 새로고침
		if (mode === 'bookmarks' && isAuthed) {
			try {
				const rows = await listMyBookmarks()
				const items: Place[] = rows.map((r, i) => ({
					id: i,
					googlePlaceId: r.placeId,
					type: r.type || null,
					name: r.name,
					address: r.address,
					lat: r.lat,
					lng: r.lng,
					phone: null,
					website: null,
					googleMapsUrl: r.googleMapsUrl,
					description: null, // 필수 필드 추가
				}))
				setPlaces(items)
				await renderMarkers(items)
			} catch (error) {
				console.error('북마크 새로고침 실패:', error)
			}
		}
	}

	return (
		<div>
			<div className="fixed inset-x-0 bottom-0 flex top-14">
				{/* 왼쪽 카테고리 사이드바 */}
				<div className="w-16 bg-white border-r shrink-0">
					<Sidebar
						active={mode === 'type' ? type : ''}
						onSelectType={handleSelectType}
						onShowBookmarks={handleShowBookmarks}
						onToggleMenu={handleToggleMenu}
						isMenuOpen={false} // Menu는 활성화 표시 안 함
						isBookmarkMode={mode === 'bookmarks'}
					/>
					<div className="p-2 text-xs text-center">{loading ? 'Loading…' : ''}</div>
				</div>

				{/* 좌측 검색 결과 패널 - 조건부 렌더링 */}
				{showSearchList && (
					<SearchList 
						places={places} 
						onSelect={openPlace} 
						title={listTitle}
						isBookmarkMode={mode === 'bookmarks'}
					/>
				)}

				{/* 상세 패널 */}
				{selected && (
					<SidePanel 
						place={selected} 
						onClose={handleClose} 
						onBookmarkChange={handleBookmarkChange}
						isBookmarked={bookmarkedPlaces.has(selected.googlePlaceId)}
					/>
				)}

				{/* 지도 */}
				<div className="relative flex-1">
					<div ref={mapRef} className="absolute inset-0" />
					
					{/* 위치 버튼들 */}
					<div className="absolute flex flex-col gap-2 bottom-4 right-4">
						{/* 현재 위치로 이동 버튼 */}
						<button
							onClick={moveToCurrentLocation}
							className="flex items-center justify-center w-12 h-12 transition-all duration-200 bg-white rounded-lg shadow-lg hover:shadow-xl group"
							title={t('kmap.location.my_location')}
						>
							<svg 
								className="w-6 h-6 text-gray-600 group-hover:text-blue-600" 
								fill="none" 
								stroke="currentColor" 
								viewBox="0 0 24 24"
							>
								<path 
									strokeLinecap="round" 
									strokeLinejoin="round" 
									strokeWidth={2} 
									d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
								/>
								<path 
									strokeLinecap="round" 
									strokeLinejoin="round" 
									strokeWidth={2} 
									d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
								/>
							</svg>
						</button>

						{/* 실시간 추적 토글 버튼 */}
						<button
							onClick={toggleLocationTracking}
							className={`w-12 h-12 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group ${
								isTracking 
									? 'bg-blue-600 text-white' 
									: 'bg-white text-gray-600 hover:text-blue-600'
							}`}
							title={isTracking ? t('kmap.location.stop_tracking') : t('kmap.location.start_tracking')}
						>
							<svg 
								className={`w-6 h-6 ${isTracking ? 'text-white' : 'group-hover:text-blue-600'}`} 
								fill="none" 
								stroke="currentColor" 
								viewBox="0 0 24 24"
							>
								<circle cx="12" cy="12" r="3" strokeWidth={2}/>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
