// src/pages/CourseDetailPage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { getCourse, updateCourse, deleteCourse, saveCourse, unsaveCourse } from '../api/courses'
import { getPlaceDetail } from '../api/places'
import { useAuth } from '../features/auth/useAuth'
import type { Course, CreateCourseRequest } from '../types/course'
import MapCanvas from '../components/map/MapCanvas'
import CoursePanel from '../components/course/CoursePanel'
import SearchPanel from '../components/search/SearchPanel'

type Stop = { 
	id: string
	name: string
	lat: number
	lng: number
	address?: string
	placeId?: string
	photoUrl?: string
	description?: string
	category?: string
}

export default function CourseDetailPage() {
	const { courseId } = useParams<{ courseId: string }>()
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const { user } = useAuth()
	
	const [course, setCourse] = useState<Course | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isEditing, setIsEditing] = useState(false)
	const [stops, setStops] = useState<Stop[]>([])
	const [isSaved, setIsSaved] = useState(false)
	const [saving, setSaving] = useState(false)
	const [actionLoading, setActionLoading] = useState(false)

	// 목록으로 돌아가기 핸들러
	const handleBackToList = (needsRefresh: boolean = false) => {
		// returnTo 파라미터가 있으면 우선 사용
		const returnTo = searchParams.get('returnTo')
		if (returnTo) {
			const decodedUrl = decodeURIComponent(returnTo)
			if (needsRefresh) {
				// URL에 refresh 파라미터 추가
				const url = new URL(decodedUrl, window.location.origin)
				url.searchParams.set('refresh', Date.now().toString())
				navigate(url.pathname + url.search)
			} else {
				navigate(decodedUrl)
			}
			return
		}
		
		// 기존 로직 유지 (하위 호환성)
		const from = searchParams.get('from')
		const tab = searchParams.get('tab')
		
		// refresh 파라미터를 추가하여 목록 새로고침을 트리거
		const refreshParam = needsRefresh ? `?refresh=${Date.now()}` : ''
		
		if (from === 'mypage' && tab) {
			// MyPage의 코스에서 온 경우 MyCoursesPage로 돌아가기
			navigate(`/mypage/courses?tab=${tab}${needsRefresh ? `&refresh=${Date.now()}` : ''}`)
		} else {
			// 기본적으로 KcoursePage로 돌아가기
			navigate(`/kcourse${refreshParam}`)
		}
	}

	// 코스 데이터를 Stop 배열로 변환
	const convertCourseToStops = async (courseData: Course): Promise<Stop[]> => {
		const basicStops = courseData.stops
			.sort((a, b) => a.order - b.order)
			.map(stop => ({
				id: stop.externalId || stop.id,
				name: stop.name,
				lat: stop.lat,
				lng: stop.lng,
				placeId: stop.externalId || undefined, // Google Place ID로 사용
			}))

		// 각 장소의 상세 정보를 병렬로 가져오기
		try {
			const detailedStops = await Promise.all(
				basicStops.map(async (stop) => {
					if (stop.placeId) {
						try {
							const placeDetail = await getPlaceDetail(stop.placeId)
							return {
								...stop,
								photoUrl: placeDetail.photoUrl,
								description: placeDetail.description || undefined,
								category: placeDetail.type || undefined,
								address: placeDetail.address || undefined,
							}
						} catch (error) {
							console.warn(`Failed to load details for ${stop.name}:`, error)
							return stop
						}
					}
					return stop
				})
			)
			return detailedStops
		} catch (error) {
			console.warn('Failed to load place details:', error)
			return basicStops
		}
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
				console.log(`Loading course ${courseId}...`)
				const response = await getCourse(courseId)
				console.log(`Course ${courseId} loaded successfully:`, response.data)
				setCourse(response.data)
				const convertedStops = await convertCourseToStops(response.data)
				setStops(convertedStops)
				
				// TODO: 저장 상태 확인 API 추가 시 구현
				// 임시로 false로 설정
				setIsSaved(false)
			} catch (err: any) {
				console.error(`Failed to load course ${courseId}:`, err)
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
				})),
			}

			const response = await updateCourse(courseId, courseData)
			setCourse(response.data)
			setIsEditing(false)
			alert('코스가 수정되었습니다.')
			
			// 2초 후 목록으로 돌아가기 (새로고침 트리거)
			setTimeout(() => {
				handleBackToList(true)
			}, 2000)
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
				<div className="mb-4 text-lg text-red-500">{error}</div>
				<button
					onClick={() => navigate('/kcourse')}
					className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
				>
					코스 목록으로 돌아가기
				</button>
			</div>
		)
	}

	if (!course) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen">
				<div className="mb-4 text-lg text-gray-500">코스를 찾을 수 없습니다.</div>
				<button
					onClick={() => navigate('/kcourse')}
					className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
				>
					코스 목록으로 돌아가기
				</button>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* 헤더 */}
			<div className="px-4 py-3 bg-white border-b">
				<div className="flex items-center justify-between mx-auto max-w-7xl">
					<div className="flex items-center gap-4">
						<button
							onClick={() => handleBackToList()}
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
									className="px-4 py-2 font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
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
							onPick={(place) => {
								const newStop: Stop = {
									id: place.id,
									name: place.name,
									lat: place.lat,
									lng: place.lng,
									address: place.address,
									placeId: place.id, // Google Place ID로 사용
								}
								setStops((prev) => 
									prev.some((s) => s.id === place.id) ? prev : [...prev, newStop]
								)
							}}
						/>
					</aside>

					{/* 지도 칼럼 */}
					<main className="relative z-0">
						<MapCanvas key={`edit-map-${courseId}-${stops.length}`} stops={stops} />
					</main>

					{/* 우 패널 - 코스 편집 */}
					<aside className="z-10 overflow-y-auto bg-white border-l">
						<CoursePanel 
							stops={stops} 
							setStops={setStops} 
							onSave={handleSave}
							saving={saving}
							initialTitle={course?.title}
							initialVisibility={course?.visibility}
						/>
					</aside>
				</div>
			) : (
				// 읽기 모드: 지도만 표시
				<div className="relative" style={{ height: 'calc(100vh - 120px)' }}>
					{stops.length > 0 ? (
						<>
							<MapCanvas key={`course-map-${courseId}-${stops.length}`} stops={stops} />
							
							{/* 코스 정보 오버레이 */}
							<RouteInfoOverlay stops={stops} />
						</>
					) : (
						<div className="flex items-center justify-center h-full">
							<div className="text-lg text-gray-500">경로를 불러오는 중...</div>
						</div>
					)}
				</div>
			)}
		</div>
	)
}

// 여행경로 정보 오버레이 컴포넌트
function RouteInfoOverlay({ stops }: { stops: Stop[] }) {
	return (
		<div className="absolute z-10 max-w-sm p-4 overflow-y-auto bg-white rounded-lg shadow-lg top-4 left-4 max-h-96">
			<h3 className="mb-3 font-semibold text-gray-900">여행 경로</h3>
			<div className="space-y-3">
				{stops.map((stop, index) => (
					<div key={stop.id} className="flex gap-3">
						{/* 사진 영역 */}
						<div className="relative flex-shrink-0 w-12 h-12 overflow-hidden bg-gray-200 rounded-lg">
							{stop.photoUrl ? (
								<img 
									src={stop.photoUrl} 
									alt={stop.name}
									className="object-cover w-full h-full"
								/>
							) : (
								<div className="flex items-center justify-center w-full h-full">
									<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
								</div>
							)}
							{/* 순서 번호 */}
							<div className="absolute flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full -top-1 -left-1">
								{index + 1}
							</div>
						</div>

						{/* 정보 영역 */}
						<div className="flex-1 min-w-0">
							<h4 className="mb-1 text-sm font-medium text-gray-900 truncate">
								{stop.name}
							</h4>
							{stop.address && (
								<p className="mb-1 text-xs text-gray-500 truncate">
									{stop.address}
								</p>
							)}
							{stop.description && (
								<p className="text-xs leading-relaxed text-gray-600" style={{
									display: '-webkit-box',
									WebkitLineClamp: 2,
									WebkitBoxOrient: 'vertical',
									overflow: 'hidden'
								}}>
									{stop.description}
								</p>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}