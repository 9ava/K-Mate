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
			const kakao = await loadKakao()
			if (!hostRef.current) return
			mapRef.current = new kakao.maps.Map(hostRef.current, {
				center: new kakao.maps.LatLng(37.5665, 126.978),
				level: 6,
			})
		})()
	}, [])

	useEffect(() => {
		const kakao = window.kakao
		const map = mapRef.current
		if (!kakao || !map) return

		// 기존 오버레이/라인 제거
		overlaysRef.current.forEach((o) => o.setMap(null))
		overlaysRef.current = []
		if (polylineRef.current) {
			polylineRef.current.setMap(null)
			polylineRef.current = null
		}

		if (stops.length === 0) return

		const bounds = new kakao.maps.LatLngBounds()
		const path = stops.map((s, idx) => {
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
	}, [stops])

	// ✅ 부모가 relative일 때, 지도 div는 absolute로 해당 칼럼만 꽉 채움
	return <div ref={hostRef} className="absolute inset-0" />
}
