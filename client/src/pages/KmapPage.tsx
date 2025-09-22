// src/pages/KmapPage.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { Loader } from '@googlemaps/js-api-loader'
import { getPlaceDetail } from '../api/places'
import { listMyBookmarks } from '../api/bookmarks'
import { useMapStore } from '../features/map/map.store'
import { useAuth } from '../features/auth/useAuth'
import type { Place, PlaceType } from '../types/place'
import SidePanel from '../components/places/SidePanel'
import SearchList from '../components/places/SearchList'

type Mode = 'type' | 'bookmarks'

export default function KmapPage() {
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
	const [listTitle, setListTitle] = useState('인기 장소 🌟')
	const [showSearchList, setShowSearchList] = useState(false) // ✅ SearchList 표시 상태
	
	// 강남취창업허브센터 Google Place ID
	const GANGNAM_HUB_PLACE_ID = 'ChIJm3FERJShfDURNVIQh8yZWFQ'

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
		})
	}, [API_KEY, ENV_MAP_ID])

	// 지도 초기화 및 강남취창업허브센터 로드
	useEffect(() => {
		let cancelled = false
		;(async () => {
			await loader.load()
			if (cancelled || !mapRef.current) return

			const { Map } = (await loader.importLibrary('maps')) as google.maps.MapsLibrary
			
			// 강남취창업허브센터 정보 가져오기
			let hubCenter = { lat: 37.4946, lng: 127.0289 } // 기본값
			let hubPlace: Place | null = null
			
			try {
				console.log('[K-Map] Loading 강남취창업허브센터 details...')
				hubPlace = await getPlaceDetail(GANGNAM_HUB_PLACE_ID)
				hubCenter = { lat: hubPlace.lat, lng: hubPlace.lng }
				console.log('[K-Map] 강남취창업허브센터 location:', hubCenter)
			} catch (error) {
				console.warn('[K-Map] Failed to load hub center details:', error)
			}
			
			// 강남취창업허브센터 좌표로 지도 초기화
			const map = new Map(mapRef.current, {
				center: hubCenter,
				zoom: 16, // 더 가까이 확대
				mapId: MAP_ID,
				mapTypeControl: false,
				streetViewControl: false,
				fullscreenControl: false,
			})
			mapObjRef.current = map
			infoRef.current = new google.maps.InfoWindow()
			
			// 강남취창업허브센터 마커 즉시 표시
			if (hubPlace) {
				console.log('[K-Map] Auto-displaying 강남취창업허브센터 marker')
				// 상세 정보는 표시하지 않고 마커만 생성
				
				// 단일 마커 생성
				const { AdvancedMarkerElement } = (await loader.importLibrary('marker')) as google.maps.MarkerLibrary
				const hubMarker = new AdvancedMarkerElement({
					map,
					position: hubCenter,
					title: hubPlace.name,
				})
				hubMarker.addListener('gmp-click', () => setSelected(hubPlace))
				markersRef.current = [hubMarker]
			}
		})()

		return () => {
			cancelled = true
		}
	}, [loader, MAP_ID, GANGNAM_HUB_PLACE_ID])

	// 모드/타입 변화에 따라 목록 불러오기
	useEffect(() => {
		if (!mapObjRef.current) return
		;(async () => {
			setLoading(true)
			try {
				if (mode === 'type' && type) { // ✅ type이 있을 때만 로드
					setListTitle(
						type === 'travel' ? 'K-Travel 🌍' : type === 'food' ? 'K-Food 🍽️' : 'K-Cafe ☕'
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
					setListTitle('내 북마크 🔖')
					
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
		// SearchList는 항상 표시되어 있음
	}
	const handleShowBookmarks = () => {
		setMode('bookmarks')
		setType('') // 카테고리 선택 해제
		// SearchList는 항상 표시되어 있음
	}
	const handleToggleMenu = () => {
		// Menu는 단순히 SearchList 토글하고 모든 활성화 상태 해제
		setShowSearchList(!showSearchList)
		setType('') // 카테고리 활성화 해제
		setMode('type') // 북마크 모드도 해제
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
				{selected && <SidePanel place={selected} onClose={handleClose} />}

				{/* 지도 */}
				<div className="relative flex-1">
					<div ref={mapRef} className="absolute inset-0" />
				</div>
			</div>
		</div>
	)
}
