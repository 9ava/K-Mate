import { useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { Loader } from '@googlemaps/js-api-loader'
import { fetchPlacesByType } from '../api/places'
import type { Place, PlaceType } from '../lib/types/place'

export default function KmapPage() {
	const mapRef = useRef<HTMLDivElement>(null)
	const mapObjRef = useRef<google.maps.Map | null>(null)
	const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
	const infoRef = useRef<google.maps.InfoWindow | null>(null)

	const [type, setType] = useState<PlaceType | ''>('food')
	const [loading, setLoading] = useState(false)

	const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
	const ENV_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined
	const MAP_ID = ENV_MAP_ID || 'DEMO_MAP_ID'

	const loader = useMemo(() => {
		if (!API_KEY) {
			console.warn('VITE_GOOGLE_MAPS_API_KEY 가 설정되지 않았습니다.')
		}
		if (!ENV_MAP_ID) {
			console.warn('VITE_GOOGLE_MAPS_MAP_ID 가 비어있습니다. DEMO_MAP_ID 사용')
		}
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

	// 타입이 바뀔 때마다 Axios로 불러와 마커 렌더
	useEffect(() => {
		if (!type || !mapObjRef.current) return
		;(async () => {
			setLoading(true)
			try {
				const items = await fetchPlacesByType(type, 200) // /places?type=food
				renderMarkers(items)
				fitBounds(items)
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
				// 번호 뱃지 마커 (원하면 제거 가능)
				//content: makePin(String(i + 1)),
			})

			marker.addListener('gmp-click', () => {
				const html = `
          <div style="max-width:240px">
            <div style="font-weight:600">${esc(p.name)}</div>
            ${
							p.address
								? `<div style="color:#555;font-size:12px;margin-top:4px">${esc(p.address!)}</div>`
								: ''
						}
            <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;font-size:12px">
              ${p.phone ? `<a href="tel:${p.phone}">Call</a>` : ''}
              ${p.website ? `<a href="${p.website}" target="_blank">Website</a>` : ''}
              ${
								p.google_place_id
									? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
											p.name
									  )}&query_place_id=${p.google_place_id}" target="_blank">Maps</a>`
									: ''
							}
            </div>
          </div>`
				infoRef.current?.setContent(html)
				infoRef.current?.open(map, marker)
			})

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

	return (
		<div>
			<div className="fixed inset-x-0 bottom-0 flex top-14">
				{/* 사이드바 */}
				<div className="w-16 bg-white border-r shrink-0">
					<Sidebar active={type} onSelect={setType} />
					<div className="p-2 text-center text-xs">{loading ? 'Loading…' : ''}</div>
				</div>
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
