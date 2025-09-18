// src/pages/KmapPage.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { Loader } from '@googlemaps/js-api-loader'
import { listPlaces, getPlaceDetail } from '../api/places'
import type { Place, PlaceType } from '../types/place'
import SidePanel from '../components/places/SidePanel'
import SearchList from '../components/places/SearchList'

export default function KmapPage() {
	const mapRef = useRef<HTMLDivElement>(null)
	const mapObjRef = useRef<google.maps.Map | null>(null)
	const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
	const infoRef = useRef<google.maps.InfoWindow | null>(null)

	const [type, setType] = useState<PlaceType | ''>('food')
	const [loading, setLoading] = useState(false)
	const [selected, setSelected] = useState<Place | null>(null)
	const [places, setPlaces] = useState<Place[]>([])

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

	// 타입 변경 시: 서버에서 목록 로드 → 마커 렌더
	useEffect(() => {
		if (!type || !mapObjRef.current) return
		;(async () => {
			setLoading(true)
			try {
				const res = await listPlaces({ type, page: 1, pageSize: 200 })
				setPlaces(res.items || [])
				await renderMarkers(res.items || [])
				fitBounds(res.items || [])
				setSelected(null)
			} finally {
				setLoading(false)
			}
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [type])

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

		markersRef.current = items.map((p, i) => {
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

		// 지도 포커스
		map.panTo({ lat: p.lat, lng: p.lng })
		map.setZoom(Math.max(map.getZoom() ?? 12, 14))

		// 서버 상세 호출 (DB 캐시 30일 정책)
		try {
			setLoading(true)
			const full = await getPlaceDetail(p.googlePlaceId)
			setSelected(full)
		} catch {
			// 실패 시 기본정보만 표시
			setSelected(p)
		} finally {
			setLoading(false)
		}
	}

	const handleClose = () => setSelected(null)

	return (
		<div>
			<div className="fixed inset-x-0 bottom-0 flex top-14">
				{/* 왼쪽 카테고리 사이드바 */}
				<div className="w-16 bg-white border-r shrink-0">
					<Sidebar active={type} onSelect={setType} />
					<div className="p-2 text-xs text-center">{loading ? 'Loading…' : ''}</div>
				</div>

				{/* 좌측 검색 결과 패널 */}
				<SearchList places={places} onSelect={openPlace} />

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
