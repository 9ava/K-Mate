import { useState } from 'react'
import MapCanvas from '../components/map/MapCanvas'
import SearchPanel from '../components/search/SearchPanel'
import CoursePanel from '../components/course/CoursePanel'

type Stop = { id: string; name: string; lat: number; lng: number }

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export default function PlannerPage() {
	const [stops, setStops] = useState<Stop[]>([])
	const [saving, setSaving] = useState(false)

	// 백엔드로 저장
	async function saveCourse(payload: { title: string; visibility: 'public' | 'private' }) {
		if (!payload.title.trim()) {
			alert('코스 제목을 입력해 주세요.')
			return
		}
		if (stops.length === 0) {
			alert('최소 1개 이상의 장소를 담아주세요.')
			return
		}

		// 서버로 보낼 데이터 형태(예시)
		const body = {
			title: payload.title.trim(),
			visibility: payload.visibility,
			// 정렬된 순서를 order로 함께 전송
			stops: stops.map((s, idx) => ({
				order: idx + 1,
				name: s.name,
				lat: s.lat,
				lng: s.lng,
				// placeId가 있다면 여기에 추가 (Kakao id 등)
				externalId: s.id,
				provider: 'kakao',
			})),
		}

		try {
			setSaving(true)
			const res = await fetch(`${API_BASE}/courses`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include', // ✅ 쿠키 인증일 때 필수
				body: JSON.stringify(body),
			})
			if (!res.ok) {
				const msg = await res.text().catch(() => '')
				throw new Error(msg || `Failed: ${res.status}`)
			}
			const data = await res.json().catch(() => ({}))
			alert('코스가 저장되었습니다!')
			// 필요하면 저장 후 이동: navigate(`/courses/${data?.data?.id}`)
		} catch (e: any) {
			alert(`저장 실패: ${e?.message ?? e}`)
		} finally {
			setSaving(false)
		}
	}

	return (
		// 헤더가 고정(top-14 등)이라면 아래처럼 오프셋을 줘서 덮지 않도록
		<div className="fixed inset-x-0 bottom-0 top-14 grid grid-cols-[20rem_1fr_20rem]">
			{/* 좌 패널 */}
			<aside className="z-10 overflow-y-auto bg-white border-r">
				<SearchPanel
					onPick={(p) =>
						setStops((prev) => (prev.some((s) => s.id === p.id) ? prev : [...prev, p]))
					}
				/>
			</aside>

			{/* 지도 칼럼 */}
			<main className="relative z-0">
				{/* ✅ MapCanvas는 absolute inset-0 로 이 영역만 꽉 채움 */}
				<MapCanvas stops={stops} />
			</main>

			{/* 우 패널 */}
			<aside className="z-10 overflow-y-auto bg-white border-l">
				<CoursePanel stops={stops} setStops={setStops} onSave={saveCourse} saving={saving} />
			</aside>
		</div>
	)
}
