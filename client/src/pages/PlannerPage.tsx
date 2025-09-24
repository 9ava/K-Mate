import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import MapCanvas from '../components/map/MapCanvas'
import SearchPanel from '../components/search/SearchPanel'
import CoursePanel from '../components/course/CoursePanel'
import { createCourse } from '../api/courses'
import type { CreateCourseRequest } from '../types/course'

type Stop = { id: string; name: string; lat: number; lng: number }

export default function PlannerPage() {
	const { t } = useTranslation()
	const [stops, setStops] = useState<Stop[]>([])
	const [saving, setSaving] = useState(false)
	const navigate = useNavigate()

	async function saveCourse(payload: { title: string; visibility: 'public' | 'private' }) {
		if (!payload.title.trim()) {
			alert(t('planner.messages.enter_course_title'))
			return
		}
		if (stops.length === 0) {
			alert(t('planner.messages.add_at_least_one_place'))
			return
		}

		// 새로운 API 형식에 맞게 데이터 변환
		const courseData: CreateCourseRequest = {
			title: payload.title.trim(),
			visibility: payload.visibility,
			stops: stops.map((s, idx) => ({
				order: idx + 1,
				name: s.name,
				lat: s.lat,
				lng: s.lng,
				externalId: s.id,
				provider: 'kakao',
			})),
		}

		try {
			setSaving(true)
			await createCourse(courseData)
			alert(t('planner.messages.course_saved'))
			
			// 저장 후 K-Course 페이지로 이동
			navigate('/kcourse')
		} catch (error: any) {
			alert(`${t('planner.messages.save_failed')}: ${error?.message ?? error}`)
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
