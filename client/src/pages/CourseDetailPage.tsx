// src/pages/CourseDetailPage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCourse, updateCourse, deleteCourse, saveCourse, unsaveCourse } from '../api/courses'
import { useAuth } from '../features/auth/useAuth'
import type { Course, CreateCourseRequest } from '../types/course'
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
	const [isSaved, setIsSaved] = useState(false)
	const [saving, setSaving] = useState(false)
	const [actionLoading, setActionLoading] = useState(false)

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
				
				// TODO: 저장 상태 확인 API 추가 시 구현
				// 임시로 false로 설정
				setIsSaved(false)
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
	const handleSave = async (payload: { title: string; visibility: 'public' | 'private' }) => {
		if (!course || !courseId) return

		try {
			setSaving(true)
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

			const response = await updateCourse(courseId, courseData)
			setCourse(response.data)
			setIsEditing(false)
			alert('코스가 수정되었습니다.')
		} catch (error: any) {
			alert(`수정 실패: ${error?.message ?? error}`)
		} finally {
			setSaving(false)
		}
	}

	// 코스 삭제
	const handleDelete = async () => {
		if (!course || !courseId) return

		if (!confirm('정말로 이 코스를 삭제하시겠습니까?')) {
			return
		}

		try {
			setActionLoading(true)
			await deleteCourse(courseId)
			alert('코스가 삭제되었습니다.')
			navigate('/kcourse')
		} catch (error: any) {
			alert(`삭제 실패: ${error?.message ?? error}`)
		} finally {
			setActionLoading(false)
		}
	}

	// 코스 저장/저장취소
	const handleSaveToggle = async () => {
		if (!courseId) return

		try {
			setActionLoading(true)
			if (isSaved) {
				await unsaveCourse(courseId)
				setIsSaved(false)
				alert('코스 저장이 취소되었습니다.')
			} else {
				await saveCourse(courseId)
				setIsSaved(true)
				alert('코스가 저장되었습니다.')
			}
		} catch (error: any) {
			alert(`${isSaved ? '저장취소' : '저장'} 실패: ${error?.message ?? error}`)
		} finally {
			setActionLoading(false)
		}
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
					<div className="flex items-center gap-2">
						{/* 저장/저장취소 버튼 (남의 것만) */}
						{!isMyCase && (
							<button
								onClick={handleSaveToggle}
								disabled={actionLoading}
								className={`px-4 py-2 rounded-lg font-medium transition-colors ${
									isSaved
										? 'bg-green-100 text-green-700 hover:bg-green-200'
										: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
								} disabled:opacity-50`}
							>
								{actionLoading ? '처리중...' : (isSaved ? '저장됨 ✓' : '저장')}
							</button>
						)}
						
						{/* 편집/삭제 버튼 (내 것만) */}
						{isMyCase && (
							<>
								<button
									onClick={handleDelete}
									disabled={actionLoading}
									className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
								>
									{actionLoading ? '삭제중...' : '삭제'}
								</button>
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
							</>
						)}
					</div>
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
							saving={saving}
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