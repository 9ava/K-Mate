// src/pages/KmapPage.tsx
import { useEffect, useRef } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { Loader } from '@googlemaps/js-api-loader'

//브랜치 확인용

export default function KmapPage() {
	const mapRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
		if (!API_KEY) {
			console.warn('VITE_GOOGLE_MAPS_API_KEY 가 설정되지 않았습니다.')
			return
		}

		// ✅ .env에서 MAP_ID 읽기
		const ENV_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined
		const MAP_ID = ENV_MAP_ID || 'DEMO_MAP_ID'
		if (!ENV_MAP_ID) {
			console.warn('VITE_GOOGLE_MAPS_MAP_ID 가 비어있습니다. 개발용 DEMO_MAP_ID로 대체합니다.')
		}

		let cancelled = false

		const loader = new Loader({
			apiKey: API_KEY,
			version: 'weekly',
			libraries: ['marker'], // AdvancedMarkerElement 사용 시 필수
		})

		const init = async () => {
			try {
				const { Map } = (await loader.importLibrary('maps')) as google.maps.MapsLibrary
				const { AdvancedMarkerElement } = (await loader.importLibrary(
					'marker'
				)) as google.maps.MarkerLibrary

				if (cancelled || !mapRef.current) return

				const map = new Map(mapRef.current, {
					center: { lat: 37.5665, lng: 126.978 }, // Seoul
					zoom: 12,
					mapId: MAP_ID, // ✅ .env에서 가져온 Map ID 사용
					mapTypeControl: false,
					streetViewControl: false,
					fullscreenControl: false,
				})

				const markers = [
					{ lat: 37.5665, lng: 126.978, number: '1' },
					{ lat: 37.5505, lng: 126.988, number: '2' },
					{ lat: 37.5825, lng: 126.968, number: '3' },
					{ lat: 37.5445, lng: 126.958, number: '4' },
					{ lat: 37.5705, lng: 126.998, number: '5' },
					{ lat: 37.5385, lng: 126.948, number: '1' },
					{ lat: 37.5945, lng: 126.988, number: '2' },
					{ lat: 37.5285, lng: 126.938, number: '3' },
				]

				const makeNumberPin = (num: string) => {
					const wrapper = document.createElement('div')
					wrapper.style.width = '40px'
					wrapper.style.height = '40px'
					wrapper.style.display = 'flex'
					wrapper.style.alignItems = 'center'
					wrapper.style.justifyContent = 'center'
					wrapper.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-label="${num}">
            <circle cx="20" cy="20" r="18" fill="#4285f4" stroke="white" stroke-width="2"/>
            <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">${num}</text>
            </svg>
        `
					return wrapper as Element
				}

				markers.forEach((m) => {
					new AdvancedMarkerElement({
						map,
						position: { lat: m.lat, lng: m.lng },
						title: `#${m.number}`,
						content: makeNumberPin(m.number),
					})
				})
			} catch (e) {
				console.error(e)
			}
		}

		init()
		return () => {
			cancelled = true
		}
	}, [])

	return (
		<div>
			{/* 헤더 아래 전영역 고정 & 좌우 레이아웃 */}
			<div className="fixed inset-x-0 bottom-0 flex top-14">
				{/* 왼쪽 사이드바 (고정 폭) */}
				<div className="w-16 bg-white border-r shrink-0">
					<Sidebar />
				</div>

				{/* 오른쪽 지도 영역 */}
				<div className="relative flex-1">
					<div ref={mapRef} className="absolute inset-0" />
				</div>
			</div>
		</div>
	)
}
