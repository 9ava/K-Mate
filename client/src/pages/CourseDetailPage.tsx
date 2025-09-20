// src/pages/CourseDetailPage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCourse } from '../api/courses'
import { useAuth } from '../features/auth/useAuth'
import type { Course } from '../types/course'
import MapCanvas from '../components/map/MapCanvas'
import CoursePanel from '../components/course/CoursePanel'
import SearchPanel from '../components/search/SearchPanel'

type Stop = { id: string; name: string; lat: number; lng: number }

export default function CourseDetailPage() {
	const { courseId } = useParams<{ courseId: string }>()
	const navigate = useNavigate()
	const { user } = useAuth()
	
	const [course, setCourse] = useState<Course | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isEditing, setIsEditing] = useState(false)
	const [stops, setStops] = useState<Stop[]>([])

	// 코스 데이터를 Stop 배열로 변환
	const convertCourseToStops = (courseData: Course): Stop[] => {
		return courseData.stops
			.sort((a, b) => a.order - b.order)
			.map(stop => ({
				id: stop.externalId || stop.id,
				name: stop.name,
				lat: stop.lat,
				lng: stop.lng,
			}))
	}

	// 코스 데이터 로드
	useEffect(() => {
		const loadCourse = async () => {
			if (!courseId) {
				setError('코스 ID가 없습니다.')
				setLoading(false)
				return
			}

			try {
				setLoading(true)
				const response = await getCourse(courseId)
				setCourse(response.data)
				const convertedStops = convertCourseToStops(response.data)
				setStops(convertedStops)
			} catch (err: any) {
				setError(err.message || '코스를 불러오는데 실패했습니다.')
			} finally {
				setLoading(false)
			}
		}

		loadCourse()
	}, [courseId])

	// 내 코스인지 확인
	const isMyCase = course && user && String(course.authorId) === String(user.id)

	// 편집 모드 토글
	const toggleEdit = () => {
		if (isMyCase) {
			setIsEditing(!isEditing)
		}
	}

	// 저장 함수 (편집 모드에서만 사용)
	const handleSave = async (_payload: { title: string; visibility: 'public' | 'private' }) => {
		// TODO: 코스 업데이트 API 구현 필요
		alert('코스 업데이트 기능은 아직 구현되지 않았습니다.')
		setIsEditing(false)
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-lg text-gray-500">로딩중...</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen">
				<div className="text-lg text-red-500 mb-4">{error}</div>
				<button
					onClick={() => navigate('/kcourse')}
					className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
				>
					코스 목록으로 돌아가기
				</button>
			</div>
		)
	}

	if (!course) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen">
				<div className="text-lg text-gray-500 mb-4">코스를 찾을 수 없습니다.</div>
				<button
					onClick={() => navigate('/kcourse')}
					className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
				>
					코스 목록으로 돌아가기
				</button>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* 헤더 */}
			<div className="bg-white border-b px-4 py-3">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<div className="flex items-center gap-4">
						<button
							onClick={() => navigate('/kcourse')}
							className="text-gray-500 hover:text-gray-700"
						>
							← 목록으로
						</button>
						<div>
							<h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
							<div className="text-sm text-gray-500">
								{course.author?.name || '작성자'} · {new Date(course.created_at).toLocaleDateString('ko-KR')} 
								· {course.visibility === 'public' ? '공개' : '비공개'}
							</div>
						</div>
					</div>
					{isMyCase && (
						<button
							onClick={toggleEdit}
							className={`px-4 py-2 rounded-lg font-medium ${
								isEditing 
									? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
									: 'bg-blue-600 text-white hover:bg-blue-700'
							}`}
						>
							{isEditing ? '편집 취소' : '편집'}
						</button>
					)}
				</div>
			</div>

			{/* 메인 컨텐츠 */}
			{isEditing ? (
				// 편집 모드: PlannerPage와 동일한 레이아웃
				<div className="fixed inset-x-0 bottom-0 top-[120px] grid grid-cols-[20rem_1fr_20rem]">
					{/* 좌 패널 - 검색 */}
					<aside className="z-10 overflow-y-auto bg-white border-r">
						<SearchPanel
							onPick={(place) =>
								setStops((prev) => 
									prev.some((s) => s.id === place.id) ? prev : [...prev, place]
								)
							}
						/>
					</aside>

					{/* 지도 칼럼 */}
					<main className="relative z-0">
						<MapCanvas stops={stops} />
					</main>

					{/* 우 패널 - 코스 편집 */}
					<aside className="z-10 overflow-y-auto bg-white border-l">
						<CoursePanel 
							stops={stops} 
							setStops={setStops} 
							onSave={handleSave}
							saving={false}
						/>
					</aside>
				</div>
			) : (
				// 읽기 모드: 지도만 표시
				<div className="relative" style={{ height: 'calc(100vh - 120px)' }}>
					<MapCanvas stops={stops} />
					
					{/* 코스 정보 오버레이 */}
					{stops.length > 0 && (
						<div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-10">
							<h3 className="font-semibold mb-2">여행 경로</h3>
							<div className="space-y-2">
								{stops.map((stop, index) => (
									<div key={stop.id} className="flex items-center gap-2">
										<div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
											{index + 1}
										</div>
										<span className="text-sm">{stop.name}</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	)
}