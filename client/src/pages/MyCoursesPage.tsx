import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { getMyCourses, getSavedCourses } from '../api/mypage'
import { getCourse } from '../api/courses'
import { getPlaceDetail } from '../api/places'
import type { MyCourseItem, SavedCourseItem, PaginationQueryDto } from '../api/mypage'

type TabType = 'created' | 'saved'

export default function MyCoursesPage() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const { isAuthed } = useAuth()
	
	// URL 파라미터에서 탭 타입을 확인하여 초기값 설정
	const getInitialTab = (): TabType => {
		const tabParam = searchParams.get('tab')
		if (tabParam === 'saved') return 'saved'
		return 'created'
	}
	
	const [activeTab, setActiveTab] = useState<TabType>(getInitialTab())
	const [myCourses, setMyCourses] = useState<MyCourseItem[]>([])
	const [savedCourses, setSavedCourses] = useState<SavedCourseItem[]>([])
	const [coursePhotos, setCoursePhotos] = useState<Record<string, string>>({})
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		myTotal: 0,
		savedTotal: 0,
		page: 1,
		limit: 12
	})

	useEffect(() => {
		if (!isAuthed) {
			navigate('/login')
			return
		}
		loadCourses()
	}, [isAuthed, navigate, pagination.page, activeTab])

	const loadCourses = async () => {
		try {
			setLoading(true)
			const query: PaginationQueryDto = {
				page: pagination.page,
				limit: pagination.limit
			}

			let coursesToLoadPhotos: any[] = []

			if (activeTab === 'created') {
				const data = await getMyCourses(query)
				setMyCourses(data.courses)
				coursesToLoadPhotos = data.courses
				setPagination(prev => ({
					...prev,
					myTotal: data.total
				}))
			} else {
				const data = await getSavedCourses(query)
				setSavedCourses(data.savedCourses)
				coursesToLoadPhotos = data.savedCourses.map(item => item.course)
				setPagination(prev => ({
					...prev,
					savedTotal: data.total
				}))
			}

			// 각 코스의 첫 번째 장소 사진 로드
			loadCoursePhotos(coursesToLoadPhotos)

			setError(null)
		} catch (error) {
			console.error('코스 로드 실패:', error)
			setError('코스를 불러오는데 실패했습니다.')
		} finally {
			setLoading(false)
		}
	}

	// 코스들의 사진을 로드하는 함수
	const loadCoursePhotos = async (courses: any[]) => {
		console.log('🔄 Loading photos for courses:', courses.length)
		
		const photoPromises = courses.map(async (course) => {
			const actualCourse = 'course' in course ? course.course : course
			console.log(`📝 Course ${actualCourse.id} - getting full course details`)
			
			try {
				// 각 코스의 상세 정보(stops 포함)를 가져오기
				const courseResponse = await getCourse(actualCourse.id)
				const fullCourseData = courseResponse.data
				console.log(`📋 Full course data for ${actualCourse.id}:`, fullCourseData)
				
				// KcoursePage와 동일한 방식: 첫 번째 스톱의 externalId 확인
				const firstStop = fullCourseData.stops?.[0]
				console.log(`📍 First stop for course ${actualCourse.id}:`, firstStop)
				
				if (!firstStop?.externalId) {
					console.log(`❌ No externalId for course ${actualCourse.id}`)
					return { courseId: actualCourse.id, photoUrl: null }
				}

				console.log(`🔍 Getting place detail for ${firstStop.externalId}`)
				const placeDetail = await getPlaceDetail(firstStop.externalId)
				console.log(`📸 Photo URL for course ${actualCourse.id}:`, placeDetail.photoUrl)
				return {
					courseId: actualCourse.id,
					photoUrl: placeDetail.photoUrl || null
				}
			} catch (error) {
				console.warn(`Failed to load photo for course ${actualCourse.id}:`, error)
				return { courseId: actualCourse.id, photoUrl: null }
			}
		})

		const photoResults = await Promise.all(photoPromises)
		const photoMap: Record<string, string> = {}
		photoResults.forEach(result => {
			if (result.photoUrl) {
				photoMap[result.courseId] = result.photoUrl
			}
		})
		console.log('🎨 Final photo map:', photoMap)
		setCoursePhotos(photoMap)
	}

	const handleCourseClick = (courseId: string) => {
		// 현재 탭 정보와 함께 코스 상세로 이동
		const currentTab = activeTab
		navigate(`/kcourse/${courseId}?from=mypage&tab=${currentTab}`)
	}

	const getVisibilityColor = (visibility: string) => {
		return visibility === 'public' 
			? 'bg-green-100 text-green-800' 
			: 'bg-gray-100 text-gray-800'
	}

	const getVisibilityLabel = (visibility: string) => {
		return visibility === 'public' ? '공개' : '비공개'
	}

	const handleTabChange = (tab: TabType) => {
		setActiveTab(tab)
		setPagination(prev => ({ ...prev, page: 1 }))
		
		// URL 파라미터 업데이트
		const newSearchParams = new URLSearchParams(searchParams)
		newSearchParams.set('tab', tab)
		navigate(`/mypage/courses?${newSearchParams.toString()}`, { replace: true })
	}

	const currentTotal = activeTab === 'created' ? pagination.myTotal : pagination.savedTotal
	const currentCourses = activeTab === 'created' ? myCourses : savedCourses
	const totalPages = Math.ceil(currentTotal / pagination.limit)

	const handlePageChange = (newPage: number) => {
		setPagination(prev => ({ ...prev, page: newPage }))
	}

	if (loading && currentCourses.length === 0) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center">
					<div className="w-12 h-12 mx-auto mb-4 border-b-2 border-green-600 rounded-full animate-spin"></div>
					<p className="text-gray-600">코스를 불러오는 중...</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center">
					<p className="mb-4 text-red-600">{error}</p>
					<button 
						onClick={loadCourses} 
						className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
					>
						다시 시도
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="px-6 py-8 mx-auto max-w-7xl">
				{/* 헤더 */}
				<div className="mb-8">
					<div className="flex items-center gap-3 mb-4">
						<button
							onClick={() => navigate('/mypage')}
							className="flex items-center justify-center w-10 h-10 transition-colors bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
						>
							<svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
						</button>
						<h1 className="text-2xl font-bold text-gray-900">내 여행 코스</h1>
						<div className="px-3 py-1 text-sm font-bold text-white bg-green-500 rounded-full">
							K-Course
						</div>
					</div>
					<p className="text-gray-600">내가 만들고 저장한 여행 코스 목록입니다.</p>
				</div>

				{/* 탭 네비게이션 */}
				<div className="mb-8">
					<div className="flex max-w-md p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
						<button
							onClick={() => handleTabChange('created')}
							className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
								activeTab === 'created'
									? 'bg-green-600 text-white shadow-sm'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
							</svg>
							<span>내가 만든 코스</span>
							<span className={`text-xs px-2 py-1 rounded-full ${
								activeTab === 'created' ? 'bg-white/20' : 'bg-gray-100'
							}`}>
								{pagination.myTotal}
							</span>
						</button>

						<button
							onClick={() => handleTabChange('saved')}
							className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
								activeTab === 'saved'
									? 'bg-green-600 text-white shadow-sm'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
							</svg>
							<span>저장한 코스</span>
							<span className={`text-xs px-2 py-1 rounded-full ${
								activeTab === 'saved' ? 'bg-white/20' : 'bg-gray-100'
							}`}>
								{pagination.savedTotal}
							</span>
						</button>
					</div>
				</div>

				{/* 코스 목록 */}
				{currentCourses.length === 0 ? (
					<div className="p-12 text-center bg-white border border-gray-200 rounded-lg shadow-sm">
						<div className="mb-4 text-gray-400">
							{activeTab === 'created' ? (
								<svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
								</svg>
							) : (
								<svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
								</svg>
							)}
						</div>
						<h3 className="mb-2 text-lg font-medium text-gray-900">
							{activeTab === 'created' ? '만든 코스가 없습니다' : '저장한 코스가 없습니다'}
						</h3>
						<p className="mb-6 text-gray-500">
							{activeTab === 'created' 
								? '나만의 여행 코스를 만들어보세요!'
								: '마음에 드는 코스를 저장해보세요!'
							}
						</p>
						<button
							onClick={() => navigate(activeTab === 'created' ? '/planner' : '/kcourse')}
							className="px-6 py-3 text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
						>
							{activeTab === 'created' ? '코스 만들기' : '코스 둘러보기'}
						</button>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{currentCourses.map((item) => {
							const course = 'course' in item ? item.course : item as MyCourseItem
							const isOwnCourse = activeTab === 'created'
							
							return (
								<div
									key={course.id}
									className="overflow-hidden transition-all duration-200 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:shadow-md"
									onClick={() => handleCourseClick(course.id)}
								>
									<div className="relative h-48 bg-gradient-to-br from-green-50 to-emerald-100">
										<div className="absolute z-10 flex gap-2 top-4 left-4">
											<span className={`px-2 py-1 text-xs font-medium rounded-full ${getVisibilityColor(course.visibility)}`}>
												{getVisibilityLabel(course.visibility)}
											</span>
											{!isOwnCourse && (
												<span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
													저장됨
												</span>
											)}
										</div>
										
										{/* 첫 번째 장소의 Google Places 사진 또는 기본 아이콘 */}
										{coursePhotos[course.id] ? (
											<img
												src={coursePhotos[course.id]}
												alt={course.title}
												className="object-cover w-full h-full"
												onError={(e) => {
													// 이미지 로드 실패 시 기본 아이콘 표시
													const target = e.target as HTMLImageElement
													target.style.display = 'none'
													const parent = target.parentElement
													if (parent) {
														const fallback = parent.querySelector('.fallback-icon') as HTMLElement
														if (fallback) fallback.style.display = 'flex'
													}
												}}
											/>
										) : null}
										
										<div className={`fallback-icon absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 ${coursePhotos[course.id] ? 'hidden' : ''}`}>
											<svg className="w-16 h-16 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
											</svg>
										</div>
									</div>
									<div className="p-4">
										<h3 className="mb-2 text-lg font-semibold text-gray-900 line-clamp-2">
											{course.title}
										</h3>
										<div className="flex items-center gap-2 mb-3">
											{course.author.avatarUrl && (
												<img 
													src={course.author.avatarUrl} 
													alt={course.author.name}
													className="w-6 h-6 rounded-full"
												/>
											)}
											<span className="text-sm text-gray-600">{course.author.name}</span>
										</div>
										<div className="flex items-center justify-between text-sm text-gray-500">
											<div className="flex items-center gap-1">
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												<span>{new Date(course.createdAt).toLocaleDateString('ko-KR')}</span>
											</div>
											{!isOwnCourse && (
												<div className="flex items-center gap-1 text-xs text-blue-600">
													<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
													</svg>
													<span>{new Date((item as SavedCourseItem).savedAt).toLocaleDateString('ko-KR')}</span>
												</div>
											)}
										</div>
									</div>
								</div>
							)
						})}
					</div>
				)}

				{/* 페이지네이션 */}
				{totalPages > 1 && (
					<div className="flex justify-center mt-8">
						<div className="flex items-center gap-2">
							<button
								onClick={() => handlePageChange(pagination.page - 1)}
								disabled={pagination.page === 1}
								className="px-3 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								이전
							</button>
							
							{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
								const page = i + Math.max(1, pagination.page - 2)
								if (page > totalPages) return null
								
								return (
									<button
										key={page}
										onClick={() => handlePageChange(page)}
										className={`px-3 py-2 rounded-lg border ${
											pagination.page === page
												? 'bg-green-600 text-white border-green-600'
												: 'border-gray-200 text-gray-600 hover:bg-gray-50'
										}`}
									>
										{page}
									</button>
								)
							})}
							
							<button
								onClick={() => handlePageChange(pagination.page + 1)}
								disabled={pagination.page === totalPages}
								className="px-3 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								다음
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}