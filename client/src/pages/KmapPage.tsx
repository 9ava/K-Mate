// src/pages/KmapPage.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { Loader } from '@googlemaps/js-api-loader'
import { listPlaces, getPlaceDetail } from '../api/places'
import { listMyBookmarks } from '../api/bookmarks' 
import type { Place, PlaceType } from '../types/place'
import SidePanel from '../components/places/SidePanel'
import SearchList from '../components/places/SearchList'

type Mode = 'type' | 'bookmarks'

export default function KmapPage() {
	const mapRef = useRef<HTMLDivElement>(null)
	const mapObjRef = useRef<google.maps.Map | null>(null)
	const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
	const infoRef = useRef<google.maps.InfoWindow | null>(null)

	const [mode, setMode] = useState<Mode>('type') // ✅ 현재 보기 모드
	const [type, setType] = useState<PlaceType | ''>('food')
	const [loading, setLoading] = useState(false)
	const [selected, setSelected] = useState<Place | null>(null)
	const [places, setPlaces] = useState<Place[]>([])
	const [listTitle, setListTitle] = useState('인기 장소 🌟')

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

	// 지도 초기화
	useEffect(() => {
		let cancelled = false
		;(async () => {
			await loader.load()
			if (cancelled || !mapRef.current) return

			const { Map } = (await loader.importLibrary('maps')) as google.maps.MapsLibrary
			const map = new Map(mapRef.current, {
				center: { lat: 37.5665, lng: 126.978 },
				zoom: 12,
				mapId: MAP_ID,
				mapTypeControl: false,
				streetViewControl: false,
				fullscreenControl: false,
			})
			mapObjRef.current = map
			infoRef.current = new google.maps.InfoWindow()
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
				if (mode === 'type') {
					setListTitle(
						type === 'travel' ? 'K-Travel 🌍' : type === 'food' ? 'K-Food 🍽️' : 'K-Cafe ☕'
					)
					const res = await listPlaces({ type: type || 'food', page: 1, pageSize: 200 })
					setPlaces(res.items || [])
					await renderMarkers(res.items || [])
					fitBounds(res.items || [])
					setSelected(null)
				} else {
					// bookmarks 모드
					setListTitle('내 북마크 🔖')
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
			} finally {
				setLoading(false)
			}
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode, type])

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
	}
	const handleShowBookmarks = () => {
		setMode('bookmarks')
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
					/>
					<div className="p-2 text-xs text-center">{loading ? 'Loading…' : ''}</div>
				</div>

				{/* 좌측 검색 결과 패널 */}
				<SearchList places={places} onSelect={openPlace} title={listTitle} />

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
