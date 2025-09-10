import { useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { Loader } from '@googlemaps/js-api-loader'
import { fetchPlacesByType } from '../api/places'
import type { Place, PlaceType } from '../lib/types/place'
import SidePanel from '../components/places/SidePanel'
import SearchList from '../components/places/SearchList'

export default function KmapPage() {
	const mapRef = useRef<HTMLDivElement>(null)
	const mapObjRef = useRef<google.maps.Map | null>(null)
	const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
	const infoRef = useRef<google.maps.InfoWindow | null>(null)
	const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)

	const [type, setType] = useState<PlaceType | ''>('food')
	const [loading, setLoading] = useState(false)
	const [selected, setSelected] = useState<Place | null>(null)
	const [places, setPlaces] = useState<Place[]>([]) // ★ 목록 패널용

	const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
	const ENV_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined
	const MAP_ID = ENV_MAP_ID || 'DEMO_MAP_ID'

	const loader = useMemo(() => {
		if (!API_KEY) console.warn('VITE_GOOGLE_MAPS_API_KEY 가 설정되지 않았습니다.')
		if (!ENV_MAP_ID) console.warn('VITE_GOOGLE_MAPS_MAP_ID 가 비어있습니다. DEMO_MAP_ID 사용')
		return new Loader({
			apiKey: API_KEY ?? '',
			version: 'weekly',
			libraries: ['marker', 'places'],
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
			// ★ PlacesService 한 번만 생성해서 재사용
			placesServiceRef.current = new google.maps.places.PlacesService(map)
		})()

		return () => {
			cancelled = true
		}
	}, [loader, MAP_ID])

	// 타입 변경 시: 데이터 불러와서 마커 & 목록 렌더
	useEffect(() => {
		if (!type || !mapObjRef.current) return
		;(async () => {
			setLoading(true)
			try {
				const items = await fetchPlacesByType(type, 200)
				setPlaces(items) // ★ 목록 패널 업데이트
				await renderMarkers(items)
				fitBounds(items)
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

	const makePin = (text?: string) => {
		const el = document.createElement('div')
		el.style.width = '36px'
		el.style.height = '36px'
		el.style.display = 'flex'
		el.style.alignItems = 'center'
		el.style.justifyContent = 'center'
		el.style.borderRadius = '9999px'
		el.style.background = '#2563eb'
		el.style.color = 'white'
		el.style.fontWeight = '700'
		el.style.fontSize = '12px'
		el.textContent = text ?? ''
		return el
	}

	// ★ 공통: 리스트/마커에서 상세 패널 열기
	const openPlace = (p: Place) => {
		const map = mapObjRef.current
		const service = placesServiceRef.current
		if (!map) return

		// 포커스 이동
		map.panTo({ lat: p.lat, lng: p.lng })
		map.setZoom(Math.max(map.getZoom() ?? 12, 14))

		if (p.google_place_id && service) {
			service.getDetails(
				{
					placeId: p.google_place_id,
					fields: [
						'place_id',
						'name',
						'formatted_address',
						'rating',
						'user_ratings_total',
						'formatted_phone_number',
						'website',
						'photos',
					],
				},
				(res, status) => {
					if (status !== google.maps.places.PlacesServiceStatus.OK || !res) {
						setSelected({ ...p })
						return
					}
					const detail: Place = {
						...p,
						address: res.formatted_address ?? p.address ?? undefined,
						phone: res.formatted_phone_number ?? p.phone ?? undefined,
						website: res.website ?? p.website ?? undefined,
						rating: res.rating ?? undefined,
						userRatingsTotal: res.user_ratings_total ?? undefined,
						photoUrl: res.photos?.[0]?.getUrl({ maxWidth: 800 }),
					}
					setSelected(detail)
				}
			)
		} else {
			setSelected({ ...p })
		}
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
				// content: makePin(String(i + 1)), // 번호 뱃지 쓰고 싶으면 주석 해제
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

	const handleClose = () => setSelected(null)

	return (
		<div>
			<div className="fixed inset-x-0 bottom-0 flex top-14">
				{/* 왼쪽 카테고리 사이드바 */}
				<div className="w-16 bg-white border-r shrink-0">
					<Sidebar active={type} onSelect={setType} />
					<div className="p-2 text-center text-xs">{loading ? 'Loading…' : ''}</div>
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

// 간단 escape
function esc(s: string) {
	return s.replace(/[&<>"']/g, (ch) =>
		ch === '&'
			? '&amp;'
			: ch === '<'
			? '&lt;'
			: ch === '>'
			? '&gt;'
			: ch === '"'
			? '&quot;'
			: '&#39;'
	)
}
