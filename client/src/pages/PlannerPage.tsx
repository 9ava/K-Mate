// src/pages/PlannerPage.tsx
import { useState } from 'react'
import MapCanvas from '../components/map/MapCanvas'
import SearchPanel from '../components/search/SearchPanel'
import CoursePanel from '../components/course/CoursePanel'

type Stop = { id: string; name: string; lat: number; lng: number }

export default function PlannerPage() {
	const [stops, setStops] = useState<Stop[]>([])

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
				<CoursePanel stops={stops} setStops={setStops} />
			</aside>
		</div>
	)
}
