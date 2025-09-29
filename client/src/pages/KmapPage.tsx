// src/pages/KmapPage.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import { getGoogleMapsLoader } from '../lib/map/googleMapsLoader'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { getPlaceDetail, listPlaces } from '../api/places'
import { listMyBookmarks } from '../api/bookmarks'
import { useMapStore } from '../features/map/map.store'
import { useAuth } from '../features/auth/useAuth'
import type { Place, PlaceType } from '../types/place'
import SidePanel from '../components/places/SidePanel'
import SearchList from '../components/places/SearchList'
import { makePlaceMarkerEl, makeUserMarkerEl, makeClusterMarkerEl } from '../lib/map/markerFactory'
import '../styles/map-markers.css'

type Mode = 'type' | 'bookmarks'

export default function KmapPage() {
	const { t } = useTranslation()
	const [searchParams] = useSearchParams()
	const mapRef = useRef<HTMLDivElement>(null)
	const mapObjRef = useRef<google.maps.Map | null>(null)
	const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
	const infoRef = useRef<google.maps.InfoWindow | null>(null)
	const clustererRef = useRef<MarkerClusterer | null>(null) // 클러스터러 참조 추가

	const { getMarkersByPlaceType } = useMapStore()
	const { isAuthed } = useAuth()

	const [mode, setMode] = useState<Mode>('type') // ✅ 현재 보기 모드
	const [type, setType] = useState<PlaceType | ''>('') // ✅ 초기값을 빈 문자열로 설정
	const [loading, setLoading] = useState(false)
	const [loadingState, setLoadingState] = useState<'idle' | 'map-init' | 'places' | 'markers'>(
		'idle'
	)
	const [selected, setSelected] = useState<Place | null>(null)
	const [places, setPlaces] = useState<Place[]>([])
	const [titleKey, setTitleKey] = useState<string>('popular') // 번역 키만 저장
	const [showSearchList, setShowSearchList] = useState(false) // ✅ SearchList 표시 상태
	const [bookmarkedPlaces, setBookmarkedPlaces] = useState<Set<string>>(new Set()) // 북마크된 장소 ID 목록
	const [nearbyRadius, setNearbyRadius] = useState(5000) // 주변 검색 반경 (미터 단위)

	// 실시간 위치 관련 상태
	const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
	const [locationPermission, setLocationPermission] = useState<
		'granted' | 'denied' | 'prompt' | null
	>(null)
	const [isTracking, setIsTracking] = useState(false)
	const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
	const watchIdRef = useRef<number | null>(null)

	// 실시간 번역 적용되는 title
	const listTitle = t(`kmap.titles.${titleKey}`)

	// URL 파라미터에서 타입 설정
	useEffect(() => {
		const typeParam = searchParams.get('type')
		if (typeParam && (typeParam === 'travel' || typeParam === 'food' || typeParam === 'cafe')) {
			setType(typeParam as PlaceType)
			setMode('type')
			setShowSearchList(false) // 검색 리스트 닫기
			setSelected(null) // 선택된 항목 초기화
		}
	}, [searchParams])

	// 컴포넌트 마운트 시에도 URL 파라미터 확인
	useEffect(() => {
		const typeParam = searchParams.get('type')
		if (typeParam && (typeParam === 'travel' || typeParam === 'food' || typeParam === 'cafe')) {
			setType(typeParam as PlaceType)
			setMode('type')
		}
	}, [])

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
			const bookmarkedIds = new Set(bookmarks.map((b) => b.placeId))
			setBookmarkedPlaces(bookmarkedIds)
		} catch (error) {
			console.error('북마크 목록 로드 실패:', error)
		}
	}

	// 위치 권한 확인 및 현재 위치 가져오기
	const requestLocationPermission = async (): Promise<boolean> => {
		if (!navigator.geolocation) {
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
						lng: position.coords.longitude,
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
					maximumAge: 60000,
				}
			)
		})
	}

	// 사용자 위치 마커 생성/업데이트
	const updateUserLocationMarker = async (location: { lat: number; lng: number }) => {
		const map = mapObjRef.current
		if (!map) return

		try {
			// 캐시된 라이브러리 사용
			if (!markerLibRef.current) {
				markerLibRef.current = (await loader.importLibrary('marker')) as google.maps.MarkerLibrary
			}
			const { AdvancedMarkerElement } = markerLibRef.current

			// 기존 사용자 마커 제거
			if (userMarkerRef.current) {
				userMarkerRef.current.map = null
			}

			// 새로운 사용자 마커 생성 (아이콘 포함)
			const userIcon = makeUserMarkerEl()

			// 새 사용자 마커 생성
			userMarkerRef.current = new AdvancedMarkerElement({
				map,
				position: location,
				content: userIcon,
				title: 'My Location',
				zIndex: 9999, // 가장 위에 표시
			})
		} catch (error) {
			console.error('Error updating user location marker:', error)
		}
	}

	// 현재 위치로 이동
	const moveToCurrentLocation = async () => {
		try {
			const hasPermission = await requestLocationPermission()
			if (!hasPermission) {
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
		} else {
			// 추적 시작
			try {
				const hasPermission = await requestLocationPermission()
				if (!hasPermission) {
					return
				}

				// 초기 위치 설정
				await moveToCurrentLocation()

				// 실시간 추적 시작
				watchIdRef.current = navigator.geolocation.watchPosition(
					async (position) => {
						const location = {
							lat: position.coords.latitude,
							lng: position.coords.longitude,
						}
						setUserLocation(location)
						await updateUserLocationMarker(location)
					},
					(error) => {
						console.error('Error watching position:', error)
						setIsTracking(false)
					},
					{
						enableHighAccuracy: true,
						timeout: 15000,
						maximumAge: 30000,
					}
				)

				setIsTracking(true)
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
			// 클러스터러 정리
			if (clustererRef.current) {
				clustererRef.current.clearMarkers()
			}
		}
	}, [])

	const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
	const ENV_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined
	const MAP_ID = ENV_MAP_ID || 'DEMO_MAP_ID'

	// 라이브러리 캐싱을 위한 ref 추가
	const markerLibRef = useRef<google.maps.MarkerLibrary | null>(null)
	const mapsLibRef = useRef<google.maps.MapsLibrary | null>(null)

	const loader = useMemo(() => {
		if (!API_KEY) console.warn('VITE_GOOGLE_MAPS_API_KEY 가 설정되지 않았습니다.')
		if (!ENV_MAP_ID) console.warn('VITE_GOOGLE_MAPS_MAP_ID 가 비어있습니다. DEMO_MAP_ID 사용')
		return getGoogleMapsLoader()
	}, [API_KEY, ENV_MAP_ID])

	// 지도 위치 저장을 위한 sessionStorage 키
	const MAP_POSITION_KEY = 'kmate-map-position'

	// 지도 위치 저장
	const saveMapPosition = (map: google.maps.Map) => {
		const center = map.getCenter()
		const zoom = map.getZoom()
		if (center && zoom) {
			const position = {
				lat: center.lat(),
				lng: center.lng(),
				zoom: zoom,
			}
			sessionStorage.setItem(MAP_POSITION_KEY, JSON.stringify(position))
		}
	}

	// 저장된 지도 위치 복원
	const getStoredMapPosition = () => {
		try {
			const stored = sessionStorage.getItem(MAP_POSITION_KEY)
			if (stored) {
				return JSON.parse(stored)
			}
		} catch (error) {
			console.warn('Failed to restore map position:', error)
		}
		return null
	}

	// 지도 초기화 및 사용자 위치로 시작
	useEffect(() => {
		let cancelled = false
		;(async () => {
			setLoadingState('map-init')
			await loader.load()
			if (cancelled || !mapRef.current) return

			// 라이브러리 캐시
			if (!mapsLibRef.current) {
				mapsLibRef.current = (await loader.importLibrary('maps')) as google.maps.MapsLibrary
			}
			const { Map } = mapsLibRef.current

			// 저장된 위치가 있으면 사용, 없으면 기본값 (서울)
			const storedPosition = getStoredMapPosition()
			const mapCenter = storedPosition
				? { lat: storedPosition.lat, lng: storedPosition.lng }
				: { lat: 37.5665, lng: 126.978 }
			const initialZoom = storedPosition ? storedPosition.zoom : 12

			// 지도를 먼저 생성 (위치 권한 대기하지 않음)
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
			setLoadingState('idle')

			// 지도 이동/줌 변경 시 위치 저장
			map.addListener('idle', () => {
				saveMapPosition(map)
			})

			// 저장된 위치가 없을 때만 사용자 위치로 이동
			if (!storedPosition) {
				requestLocationPermission()
					.then(async (hasPermission) => {
						if (hasPermission && !cancelled) {
							try {
								const userPos = await getCurrentPosition()
								map.panTo(userPos)
								map.setZoom(16)
								setUserLocation(userPos)
								await updateUserLocationMarker(userPos)
							} catch (error) {
								console.warn('사용자 위치 가져오기 실패:', error)
							}
						}
					})
					.catch(() => {
						// 위치 권한 실패는 조용히 무시
					})
			}
		})()

		return () => {
			cancelled = true
		}
	}, [loader, MAP_ID])

	// 모드/타입 변화에 따라 목록 불러오기
	useEffect(() => {
		;(async () => {
			setLoading(true)
			setLoadingState('places')
			try {
				if (mode === 'type' && type) {
					// ✅ type이 있을 때만 로드
					setTitleKey(type === 'travel' ? 'travel' : type === 'food' ? 'food' : 'cafe')

					// 전체 장소 API에서 타입별로 필터링해서 가져오기 (관리자 마커 + 코스 장소 모두 포함)
					const response = await listPlaces({ type: type, pageSize: 100 })

					// Place 타입으로 변환
					const items: Place[] = response.items

					setPlaces(items)
					setLoadingState('markers')

					// 지도가 준비되었을 때만 마커 렌더링
					if (mapObjRef.current) {
						await renderMarkers(items)
					}

					// fitBounds 제거 - 지도 위치 유지
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
						setLoadingState('markers')
						await renderMarkers(items)
						// fitBounds 제거 - 지도 위치 유지
						setSelected(null)
					}
				}
			} finally {
				setLoading(false)
				setLoadingState('idle')
			}
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode, type, isAuthed])

	// 반경 또는 사용자 위치 변경 시 마커 재렌더링 - 비활성화
	// useEffect(() => {
	// 	if (places.length > 0 && mapObjRef.current) {
	// 		renderMarkers(places)
	// 	}
	// 	// eslint-disable-next-line react-hooks/exhaustive-deps
	// }, [nearbyRadius, userLocation])

	const clearMarkers = () => {
		// 기존 클러스터러 제거
		if (clustererRef.current) {
			clustererRef.current.clearMarkers()
			clustererRef.current = null
		}
		// 기존 마커들 제거
		markersRef.current.forEach((m) => (m.map = null))
		markersRef.current = []
	}

	// 커스텀 마커 요소 생성 (성능 최적화됨)
	const createCustomMarker = (place: Place): HTMLElement => {
		try {
			const markerEl = makePlaceMarkerEl(place.type, place.name)
			return markerEl
		} catch (error) {
			console.error('[K-Map] Error creating custom marker, using fallback:', error)

			// Fallback: 더 간단한 마커 (성능 최적화)
			const container = document.createElement('div')

			// 타입별 색상 매핑 (한 번만 계산)
			const colorMap: Record<string, string> = {
				travel: '#3b82f6',
				food: '#ef4444',
				cafe: '#f59e0b',
			}
			const dotColor = colorMap[place.type || ''] || '#6b7280'

			// CSS 문자열을 한 번에 설정 (DOM 조작 최소화)
			container.innerHTML = `<div style="
				width: 16px;
				height: 16px;
				background: ${dotColor};
				border-radius: 50%;
				filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
			"></div>`

			container.style.cssText = `
				width: 32px;
				height: 32px;
				display: grid;
				place-items: center;
				background: transparent;
				cursor: pointer;
				transition: transform 200ms ease;
				z-index: 100;
			`

			// 이벤트 리스너를 한 번에 처리
			let isHovered = false
			container.onmouseenter = () => {
				if (!isHovered) {
					container.style.transform = 'scale(1.3)'
					container.style.zIndex = '200'
					isHovered = true
				}
			}
			container.onmouseleave = () => {
				if (isHovered) {
					container.style.transform = 'scale(1)'
					container.style.zIndex = '100'
					isHovered = false
				}
			}

			return container
		}
	}

	const renderMarkers = async (items: Place[]) => {
		const map = mapObjRef.current!
		clearMarkers()

		// 위치 기반 필터링을 비활성화 - 모든 마커를 표시
		const filteredPlaces = items

		if (filteredPlaces.length === 0) {
			return
		}

		// 캐시된 라이브러리 사용
		if (!markerLibRef.current) {
			markerLibRef.current = (await loader.importLibrary('marker')) as google.maps.MarkerLibrary
		}
		const { AdvancedMarkerElement } = markerLibRef.current

		// 마커 생성
		const markers = filteredPlaces.map((place) => {
			const marker = new AdvancedMarkerElement({
				map: null, // 클러스터러가 관리하므로 null로 설정
				position: { lat: place.lat, lng: place.lng },
				content: createCustomMarker(place),
				title: place.name,
			})

			// 마커 클릭 이벤트
			marker.addListener('gmp-click', () => openPlace(place))
			return marker
		})

		markersRef.current = markers

		// MarkerClusterer 생성 및 적용
		if (markers.length > 0) {
			clustererRef.current = new MarkerClusterer({
				map,
				markers,
				renderer: {
					render: ({ count, position }) => {
						return new AdvancedMarkerElement({
							position,
							content: makeClusterMarkerEl(count),
							zIndex: 1000 + Math.min(count, 100), // 레이어링
						})
					},
				},
				// 기본 클러스터링 옵션 사용
			})
		}
	}

	// 리스트/마커 클릭 → 서버 상세 조회
	const openPlace = async (p: Place) => {
		const map = mapObjRef.current
		if (!map) return

		// 지도를 해당 위치로 이동 및 줌 레벨 조정 (마커가 확실히 보이도록)
		map.panTo({ lat: p.lat, lng: p.lng })
		const currentZoom = map.getZoom() ?? 12
		// 충분히 확대해서 마커가 명확히 보이도록 함
		map.setZoom(Math.max(currentZoom, 16))

		// 해당 장소의 마커를 찾아서 강조 표시
		const targetMarker = markersRef.current.find((marker) => {
			const position = marker.position
			if (!position) return false
			const markerLat = typeof position.lat === 'function' ? position.lat() : position.lat
			const markerLng = typeof position.lng === 'function' ? position.lng() : position.lng
			return Math.abs(markerLat - p.lat) < 0.0001 && Math.abs(markerLng - p.lng) < 0.0001
		})

		// 마커 강조 효과 (잠시 크게 만들었다가 원래대로)
		if (targetMarker && targetMarker.content) {
			const originalTransform = (targetMarker.content as HTMLElement).style.transform
			const originalZIndex = (targetMarker.content as HTMLElement).style.zIndex

			// 강조 효과
			;(targetMarker.content as HTMLElement).style.transform = 'scale(1.5)'
			;(targetMarker.content as HTMLElement).style.zIndex = '10000'

			// 1초 후 원래대로
			setTimeout(() => {
				if (targetMarker.content) {
					;(targetMarker.content as HTMLElement).style.transform = originalTransform
					;(targetMarker.content as HTMLElement).style.zIndex = originalZIndex
				}
			}, 1000)
		}

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
		// 같은 타입을 다시 클릭하면 토글 (닫기)
		if (mode === 'type' && type === t && showSearchList) {
			setShowSearchList(false)
			setType('')
			return
		}

		// 다른 타입 선택하거나 처음 선택
		setMode('type')
		setType(t)
		setShowSearchList(true)
	}
	const handleShowBookmarks = () => {
		// 북마크가 이미 활성화된 상태에서 다시 클릭하면 토글 (닫기)
		if (mode === 'bookmarks' && showSearchList) {
			setShowSearchList(false)
			setMode('type')
			setType('')
			return
		}

		// 북마크 모드 활성화
		setMode('bookmarks')
		setType('') // 카테고리 선택 해제
		setShowSearchList(true)
	}
	const handleToggleMenu = async () => {
		// 메뉴가 이미 열려있고 전체 리스트 모드면 토글 (닫기)
		if (mode === 'type' && type === '' && showSearchList) {
			setShowSearchList(false)
			return
		}

		// 메뉴 열기: SearchList 토글하고 모든 활성화 상태 해제
		setShowSearchList(true)
		setType('') // 카테고리 활성화 해제
		setMode('type') // 북마크 모드도 해제

		// 전체 장소 데이터 로드
		try {
			setLoading(true)
			const response = await listPlaces({ pageSize: 100 }) // 전체 장소 가져오기
			setPlaces(response.items)
			setTitleKey('all_places')
			await renderMarkers(response.items)
			// fitBounds 제거 - 지도 위치 유지
		} catch (error) {
			console.error('전체 장소 로드 실패:', error)
		} finally {
			setLoading(false)
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
				// fitBounds 제거 - 지도 위치 유지
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
					<div className="p-2 text-xs text-center text-gray-600">
						{loadingState === 'map-init' && '지도 초기화 중...'}
						{loadingState === 'places' && '장소 정보 로딩 중...'}
						{loadingState === 'markers' && '마커 렌더링 중...'}
						{loadingState === 'idle' && loading && 'Loading...'}
					</div>
				</div>

				{/* 좌측 검색 결과 패널 - 조건부 렌더링 */}
				{showSearchList && (
					<SearchList
						places={places}
						onSelect={openPlace}
						title={listTitle}
						isBookmarkMode={mode === 'bookmarks'}
						onClose={() => setShowSearchList(false)}
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
						{/* 위치 권한 상태 알림 */}
						{locationPermission === 'denied' && (
							<div className="max-w-xs p-3 border border-red-200 rounded-lg shadow-lg bg-red-50">
								<div className="flex items-start gap-2">
									<svg
										className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
										/>
									</svg>
									<div>
										<p className="text-xs font-medium text-red-800">위치 권한 필요</p>
										<p className="mt-1 text-xs text-red-600">
											브라우저 설정에서 위치 권한을 허용해주세요.
										</p>
									</div>
								</div>
							</div>
						)}

						{/* 반경 조절 슬라이더 - 위치 권한이 있을 때만 표시 */}
						{userLocation && locationPermission === 'granted' && (
							<div className="p-3 bg-white rounded-lg shadow-lg">
								<label className="block mb-2 text-xs text-gray-600">
									{t('kmap.nearby_radius')}: {(nearbyRadius / 1000).toFixed(1)}km
								</label>
								<input
									type="range"
									min="500"
									max="10000"
									step="500"
									value={nearbyRadius}
									onChange={(e) => setNearbyRadius(Number(e.target.value))}
									className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
								/>
							</div>
						)}

						{/* 현재 위치로 이동 버튼 - 권한 상태에 따른 스타일링 */}
						<button
							onClick={moveToCurrentLocation}
							disabled={locationPermission === 'denied'}
							className={`flex items-center justify-center w-12 h-12 transition-all duration-200 rounded-lg shadow-lg hover:shadow-xl group ${
								locationPermission === 'denied'
									? 'bg-gray-100 text-gray-400 cursor-not-allowed'
									: 'bg-white text-gray-600 hover:text-blue-600'
							}`}
							title={
								locationPermission === 'denied'
									? '위치 권한이 차단되었습니다'
									: t('kmap.location.my_location')
							}
						>
							<svg
								className={`w-6 h-6 ${
									locationPermission === 'denied'
										? 'text-gray-400'
										: 'text-gray-600 group-hover:text-blue-600'
								}`}
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

						{/* 실시간 추적 토글 버튼 - 권한 상태에 따른 스타일링 */}
						<button
							onClick={toggleLocationTracking}
							disabled={locationPermission === 'denied'}
							className={`w-12 h-12 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group ${
								locationPermission === 'denied'
									? 'bg-gray-100 text-gray-400 cursor-not-allowed'
									: isTracking
									? 'bg-blue-600 text-white'
									: 'bg-white text-gray-600 hover:text-blue-600'
							}`}
							title={
								locationPermission === 'denied'
									? '위치 권한이 차단되었습니다'
									: isTracking
									? t('kmap.location.stop_tracking')
									: t('kmap.location.start_tracking')
							}
						>
							<svg
								className={`w-6 h-6 ${
									locationPermission === 'denied'
										? 'text-gray-400'
										: isTracking
										? 'text-white'
										: 'group-hover:text-blue-600'
								}`}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<circle cx="12" cy="12" r="3" strokeWidth={2} />
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"
								/>
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
