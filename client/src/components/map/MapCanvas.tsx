// src/components/map/MapCanvas.tsx
import { useEffect, useRef } from 'react'
import { loadKakao } from '../../lib/kakao'

type Stop = { id: string; name: string; lat: number; lng: number }

export default function MapCanvas({ stops }: { stops: Stop[] }) {
	const hostRef = useRef<HTMLDivElement>(null) // ✅ 이름만 ref → hostRef
	const mapRef = useRef<any>(null)
	const overlaysRef = useRef<any[]>([])
	const polylineRef = useRef<any | null>(null)

	useEffect(() => {
		;(async () => {
			try {
				const kakao = await loadKakao()
				if (!hostRef.current || mapRef.current) return // 이미 지도가 있으면 리턴
				
				mapRef.current = new kakao.maps.Map(hostRef.current, {
					center: new kakao.maps.LatLng(37.5665, 126.978),
					level: 6,
				})
				
				// 지도 초기화 완료 후 stops가 있으면 바로 표시
				if (stops.length > 0) {
					updateMapStops(kakao, mapRef.current, stops)
				}
			} catch (error) {
				console.error('Failed to load Kakao map:', error)
			}
		})()
	}, [])

	// stops 업데이트를 위한 별도 함수
	const updateMapStops = (kakao: any, map: any, currentStops: Stop[]) => {
		if (!kakao || !map || !currentStops) return

		// 기존 오버레이/라인 제거
		overlaysRef.current.forEach((o) => o.setMap(null))
		overlaysRef.current = []
		if (polylineRef.current) {
			polylineRef.current.setMap(null)
			polylineRef.current = null
		}

		if (currentStops.length === 0) return

		const bounds = new kakao.maps.LatLngBounds()
		const path = currentStops.map((s, idx) => {
			const pos = new kakao.maps.LatLng(s.lat, s.lng)
			bounds.extend(pos)
			const content = `
        <div style="width:34px;height:34px;background:#2563eb;color:#fff;border-radius:50%;
          display:flex;align-items:center;justify-content:center;font-weight:700;
          box-shadow:0 2px 6px rgba(0,0,0,.25)">${idx + 1}</div>`
			const overlay = new kakao.maps.CustomOverlay({ position: pos, content, yAnchor: 1 })
			overlay.setMap(map)
			overlaysRef.current.push(overlay)
			return pos
		})
		map.setBounds(bounds)

		polylineRef.current = new kakao.maps.Polyline({
			map,
			path,
			strokeWeight: 4,
			strokeColor: '#2563eb',
			strokeOpacity: 0.85,
			strokeStyle: 'solid',
		})
	}

	useEffect(() => {
		const map = mapRef.current
		if (!map) return

		// 카카오맵이 로드되었는지 확인하고 stops 업데이트
		;(async () => {
			try {
				const kakao = await loadKakao()
				updateMapStops(kakao, map, stops)
			} catch (error) {
				console.error('Failed to update map stops:', error)
			}
		})()
	}, [stops])

	// ✅ 부모가 relative일 때, 지도 div는 absolute로 해당 칼럼만 꽉 채움
	return <div ref={hostRef} className="absolute inset-0" />
}
