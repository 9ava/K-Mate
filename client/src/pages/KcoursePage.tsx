// src/pages/KCoursePage.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getMyCourses, getPublicCourses, getMonthlyBestCourses, unsaveCourse, shareCourse } from '../api/courses'
import { getPlaceDetail } from '../api/places'
import type { Course } from '../types/course'
import { useAuth } from '../features/auth/useAuth'

type Tab = 'my-course' | 'monthly-best'

// 코스 변환 결과를 캐싱하는 Map
const courseCache = new Map<string, TravelCourse>()

// Course 타입을 TravelCourse 형태로 변환하는 헬퍼 함수
async function courseToTravelCourse(course: Course, t: any): Promise<TravelCourse> {
	// 캐시에서 먼저 확인
	const cacheKey = course.id
	if (courseCache.has(cacheKey)) {
		return courseCache.get(cacheKey)!
	}

	let image = 'https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=1d0f0330-cfb2-4a40-82ce-37c02fb61768' // 기본 이미지
	let category: 'all' | 'cultural' | 'cafe' | 'food' = course.category || 'all' // 코스에서 직접 가져오기
	
	// 첫 번째 장소의 Google Places 정보 가져오기 (이미지만)
	const firstStop = course.stops[0]
	if (firstStop?.externalId) {
		try {
			const placeDetail = await getPlaceDetail(firstStop.externalId)
			if (placeDetail) {
				// Google Places API에서 가져온 사진 사용
				if (placeDetail.photoUrl) {
					image = placeDetail.photoUrl
				}
			}
		} catch (error) {
			console.warn('Failed to get Google place details for course:', course.id, error)
		}
	}
	
	const travelCourse: TravelCourse = {
		id: parseInt(course.id),
		title: course.title,
		location: firstStop?.name || t('kcourse.labels.unknown_location'),
		date: new Date(course.created_at).toLocaleDateString('ko-KR'),
		author: course.author?.name || t('kcourse.labels.author'),
		image,
		category,
		isAdvertisement: course.isAdvertisement || false,
		shareCount: course.shareCount || 0,
		saveCount: course.saveCount || 0,
		visibility: course.visibility,
	}

	// 캐시에 저장
	courseCache.set(cacheKey, travelCourse)
	
	return travelCourse
}

type TravelCourse = {
	id: number
	title: string
	location: string
	date: string
	author: string
	image: string
	category: 'all' | 'cultural' | 'cafe' | 'food'
	isAdvertisement?: boolean
	shareCount?: number
	saveCount?: number
	visibility?: 'public' | 'private'
}

/* --- HeroBanner --- */
function HeroBanner({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (t: Tab) => void }) {
	const { t } = useTranslation()
	
	return (
		<section className="py-8 bg-gray-50">
			<div className="max-w-2xl px-4 mx-auto">
				<div className="flex justify-center">
					<div className="flex p-1 bg-gray-100 rounded-lg shadow-sm">
						<button
							onClick={() => onTabChange('my-course')}
							className={`px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
								activeTab === 'my-course'
									? 'bg-white text-gray-900 shadow-sm'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							<div className="flex items-center gap-1">
								<div
									className={`w-2 h-2 rounded-full ${
										activeTab === 'my-course' ? 'bg-blue-500' : 'bg-gray-400'
									}`}
								/>
								<div
									className={`w-1.5 h-1.5 rounded-full ${
										activeTab === 'my-course' ? 'bg-blue-300' : 'bg-gray-300'
									}`}
								/>
							</div>
							<span className="text-lg">{t('kcourse.tabs.my_course')}</span>
						</button>

						<button
							onClick={() => onTabChange('monthly-best')}
							className={`px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
								activeTab === 'monthly-best'
									? 'bg-white text-gray-900 shadow-sm'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							<div
								className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
									activeTab === 'monthly-best' ? 'bg-blue-500 text-white' : 'bg-gray-400 text-white'
								}`}
							>
								Best
							</div>
							<span className="text-lg">{t('kcourse.tabs.monthly_best')}</span>
						</button>
					</div>
				</div>
			</div>
		</section>
	)
}

/* --- MyTravelCourse (실제 데이터) --- */
function MyTravelCourse({ 
	onCreate, 
	myCourses, 
	savedCourses, 
	loading,
	onUnsaveCourse,
	onShareCourse,
	currentTab
}: { 
	onCreate: () => void
	myCourses: TravelCourse[]
	savedCourses: TravelCourse[]
	loading: boolean
	onUnsaveCourse: (courseId: number) => Promise<void>
	onShareCourse?: (courseId: number) => Promise<void>
	currentTab?: Tab
}) {
	const { t } = useTranslation()
	
	if (loading) {
		return (
			<section className="py-12 bg-white">
				<div className="container px-4 mx-auto">
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-3xl font-bold text-gray-900">{t('kcourse.titles.my_travel_course')}</h2>
						<button
							onClick={onCreate}
							className="px-6 py-2 font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
						>
							{t('kcourse.buttons.create_course')} →
						</button>
					</div>
					<div className="py-20 text-center">
						<div className="text-lg text-gray-500">{t('kcourse.messages.loading')}</div>
					</div>
				</div>
			</section>
		)
	}

	const allCourses = [...myCourses, ...savedCourses]

	if (allCourses.length === 0) {
		return (
			<section className="py-12 bg-white">
				<div className="container px-4 mx-auto">
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-3xl font-bold text-gray-900">{t('kcourse.titles.my_travel_course')}</h2>
						<button
							onClick={onCreate}
							className="px-6 py-2 font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
						>
							{t('kcourse.buttons.create_course')} →
						</button>
					</div>

					<div className="py-20 text-center">
						<div className="text-lg text-gray-500">{t('kcourse.messages.no_courses')}</div>
						<div className="mt-2 text-sm text-gray-500">{t('kcourse.messages.create_course_message')}</div>
						<button
							onClick={onCreate}
							className="px-8 py-3 mt-6 font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
						>
							{t('kcourse.buttons.first_course')}
						</button>
					</div>
				</div>
			</section>
		)
	}

	return (
		<section className="py-12 bg-white">
			<div className="container px-4 mx-auto">
				<div className="flex items-center justify-between mb-8">
					<h2 className="text-3xl font-bold text-gray-900">{t('kcourse.titles.my_travel_course')}</h2>
					<button
						onClick={onCreate}
						className="px-6 py-2 font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
					>
						{t('kcourse.buttons.create_course')} →
					</button>
				</div>

				{/* 내가 만든 코스 섹션 */}
				{myCourses.length > 0 && (
					<div className="mb-12">
						<div className="flex items-center gap-2 mb-4">
							<h3 className="text-xl font-semibold text-gray-800">{t('kcourse.titles.my_courses')}</h3>
							<span className="text-sm text-gray-500">({myCourses.length}개)</span>
						</div>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
							{myCourses.map((course) => (
								<TravelCourseCard 
									key={`my-${course.id}`} 
									course={course} 
									isOwned={true} 
									onShare={onShareCourse}
									currentTab={currentTab}
								/>
							))}
						</div>
					</div>
				)}

				{/* 저장한 코스 섹션 */}
				{savedCourses.length > 0 && (
					<div>
						<div className="flex items-center gap-2 mb-4">
							<h3 className="text-xl font-semibold text-gray-800">{t('kcourse.titles.saved_courses')}</h3>
							<span className="text-sm text-gray-500">({savedCourses.length}개)</span>
						</div>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
							{savedCourses.map((course) => (
								<TravelCourseCard 
									key={`saved-${course.id}`} 
									course={course} 
									isOwned={false} 
									onUnsave={onUnsaveCourse}
									onShare={onShareCourse}
									currentTab={currentTab}
								/>
							))}
						</div>
					</div>
				)}
			</div>
		</section>
	)
}

/* --- TravelCourseCard --- */
function TravelCourseCard({ 
	course, 
	isOwned, 
	onUnsave,
	onShare,
	currentTab
}: { 
	course: TravelCourse
	isOwned?: boolean
	onUnsave?: (courseId: number) => Promise<void>
	onShare?: (courseId: number) => Promise<void>
	currentTab?: Tab
}) {
	const { t } = useTranslation()
	const navigate = useNavigate()

	const handleClick = () => {
		// 내 코스 탭에서 온 경우 돌아갈 때를 위해 탭 정보를 포함
		const returnUrl = currentTab === 'my-course' ? '/kcourse?tab=my-course' : '/kcourse'
		navigate(`/kcourse/${course.id}?returnTo=${encodeURIComponent(returnUrl)}`)
	}

	const handleUnsave = async (e: React.MouseEvent) => {
		e.stopPropagation() // 카드 클릭 이벤트 방지
		if (onUnsave) {
			await onUnsave(course.id)
		}
	}

	const handleShare = async (e: React.MouseEvent) => {
		e.stopPropagation() // 카드 클릭 이벤트 방지
		try {
			// 부모 컴포넌트의 onShare 콜백 호출 (상태 업데이트)
			if (onShare) {
				await onShare(course.id)
			} else {
				// 기본 공유 로직 (onShare가 없을 때)
				await shareCourse(course.id.toString())
			}
			
			// 공유 성공 시 Navigator API 사용해서 URL 공유
			if (navigator.share) {
				await navigator.share({
					title: course.title,
					text: `${course.title} - ${course.location}에서 함께 여행해요!`,
					url: `${window.location.origin}/kcourse/${course.id}`,
				})
			} else {
				// Web Share API 미지원 시 클립보드에 복사
				await navigator.clipboard.writeText(`${window.location.origin}/kcourse/${course.id}`)
				alert('링크가 클립보드에 복사되었습니다!')
			}
		} catch (error) {
			console.error('Failed to share course:', error)
		}
	}

	return (
		<div 
			className="overflow-hidden transition-all duration-300 border border-gray-200 rounded-lg cursor-pointer group hover:shadow-lg"
			onClick={handleClick}
		>
			<div className="relative">
				<img
					src={course.image || '/placeholder.svg'}
					alt={course.title}
					className="object-cover w-full h-48 transition-transform duration-300 group-hover:scale-105"
				/>

				{/* 상단 배지 컨테이너 */}
				<div className="absolute flex items-start justify-between top-3 left-3 right-3">
					{/* 왼쪽 배지들 */}
					<div className="flex flex-col gap-1">
						{/* 광고 배지 */}
						{course.isAdvertisement && (
							<span className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-full">
								광고 ⓘ
							</span>
						)}
						
						{/* Private 코스 배지 */}
						{course.visibility === 'private' && (
							<span className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-yellow-100 border border-yellow-300 rounded-full">
								🔒 비공개
							</span>
						)}
					</div>

					{/* 오른쪽 배지들 */}
					<div className="flex flex-col items-end gap-1">
						{/* 소유 여부 표시 */}
						{isOwned !== undefined && (
							<span className={`px-2 py-1 text-xs font-medium rounded-full ${
								isOwned 
									? 'bg-blue-100 text-blue-800' 
									: 'bg-green-100 text-green-800'
							}`}>
								{isOwned ? t('kcourse.labels.my_course') : t('kcourse.labels.saved')}
							</span>
						)}

						{/* 저장된 코스 삭제 버튼 */}
						{isOwned === false && onUnsave && (
							<button
								onClick={handleUnsave}
								className="flex items-center justify-center w-8 h-8 text-white transition-all duration-200 bg-red-500 rounded-full shadow-md hover:bg-red-600 group"
								title={t('kcourse.buttons.unsave_course')}
							>
								<svg 
									className="w-4 h-4 transition-transform group-hover:scale-110" 
									fill="none" 
									stroke="currentColor" 
									viewBox="0 0 24 24"
								>
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						)}
					</div>
				</div>

				{/* 카테고리 배지 */}
				{course.category === 'all' && (
					<div 
						className="absolute flex items-center justify-center w-8 h-8 rounded-full bottom-3 right-3 bg-white/80 cursor-help" 
						title={t('kcourse.categories.all')}
					>
						<div className="w-4 h-4 bg-purple-500 rounded-full" />
					</div>
				)}
				{course.category === 'cultural' && (
					<div 
						className="absolute flex items-center justify-center w-8 h-8 rounded-full bottom-3 right-3 bg-white/80 cursor-help" 
						title={t('kcourse.categories.cultural')}
					>
						<div className="w-4 h-4 bg-blue-400 rounded-full" />
					</div>
				)}
				{course.category === 'cafe' && (
					<div 
						className="absolute flex items-center justify-center w-8 h-8 rounded-full bottom-3 right-3 bg-white/80 cursor-help" 
						title={t('kcourse.categories.cafe')}
					>
						<div className="w-4 h-4 rounded-full bg-amber-400" />
					</div>
				)}
				{course.category === 'food' && (
					<div 
						className="absolute flex items-center justify-center w-8 h-8 rounded-full bottom-3 right-3 bg-white/80 cursor-help" 
						title={t('kcourse.categories.food')}
					>
						<div className="w-4 h-4 bg-red-400 rounded-full" />
					</div>
				)}
			</div>

			<div className="p-4 space-y-2">
				<h3 className="text-lg font-bold leading-tight text-gray-900 line-clamp-2">
					{course.title}
				</h3>
				<p className="text-sm text-gray-500">{course.location}</p>
				<div className="flex items-center justify-between pt-2 text-xs text-gray-500">
					<span>{course.author}</span>
					<span>{course.date}</span>
				</div>
				
				{/* 통계 및 공유 버튼 */}
				<div className="flex items-center justify-between pt-2 border-t border-gray-100">
					<div className="flex items-center space-x-3 text-xs text-gray-500">
						{course.shareCount !== undefined && (
							<span title="공유 횟수">🔗 {course.shareCount}</span>
						)}
						{course.saveCount !== undefined && (
							<span title="저장 횟수">⭐ {course.saveCount}</span>
						)}
					</div>
					<button
						onClick={handleShare}
						className="flex items-center px-2 py-1 text-xs text-blue-600 transition-colors rounded bg-blue-50 hover:bg-blue-100"
						title="코스 공유하기"
					>
						<svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
						</svg>
						공유
					</button>
				</div>
			</div>
		</div>
	)
}

function TravelCourseGrid({ 
	onCreate, 
	courses, 
	loading,
	onShareCourse
}: { 
	onCreate: () => void
	courses: TravelCourse[]
	loading: boolean
	onShareCourse?: (courseId: number) => Promise<void>
}) {
	const { t } = useTranslation()
	
	if (loading) {
		return (
			<section className="py-12 bg-white">
				<div className="container px-4 mx-auto">
					<div className="py-20 text-center">
						<div className="text-lg text-gray-500">{t('kcourse.messages.loading')}</div>
					</div>
				</div>
			</section>
		)
	}

	// 공개 코스가 없을 때
	if (courses.length === 0) {
		return (
			<section className="py-12 bg-white">
				<div className="container px-4 mx-auto">
					<div className="flex items-center justify-between mb-8">
						<div className="flex items-center gap-2">
							<h2 className="text-3xl font-bold text-gray-900">{t('kcourse.titles.monthly_best_9')}</h2>
							<div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
								<span className="text-xs text-gray-500">i</span>
							</div>
						</div>
						<button
							onClick={onCreate}
							className="px-6 py-2 font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
						>
							{t('kcourse.buttons.create_course')} →
						</button>
					</div>

					<div className="py-20 text-center">
						<div className="text-lg text-gray-500">아직 공개된 코스가 없습니다</div>
						<div className="mt-2 text-sm text-gray-500">첫 번째 코스를 만들어보세요!</div>
						<button
							onClick={onCreate}
							className="px-8 py-3 mt-6 font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
						>
							코스 만들어보기
						</button>
					</div>
				</div>
			</section>
		)
	}

	return (
		<section className="py-12 bg-white">
			<div className="container px-4 mx-auto">
				<div className="flex items-center justify-between mb-8">
					<div className="flex items-center gap-2">
						<h2 className="text-3xl font-bold text-gray-900">{t('kcourse.titles.monthly_best_9')}</h2>
						<div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
							<span className="text-xs text-gray-500">i</span>
						</div>
					</div>
					<button
						onClick={onCreate}
						className="px-6 py-2 font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
					>
						{t('kcourse.buttons.create_course')} →
					</button>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					{courses.map((course: TravelCourse) => (
						<TravelCourseCard key={course.id} course={course} onShare={onShareCourse} />
					))}
				</div>
			</div>
		</section>
	)
}


export default function KCoursePage() {
	const { t } = useTranslation()
	const [searchParams, setSearchParams] = useSearchParams()
	
	// URL 파라미터에서 초기 탭 설정
	const getInitialTab = (): Tab => {
		const tab = searchParams.get('tab')
		if (tab === 'my-course' || tab === 'my' || tab === 'saved') {
			return 'my-course'
		}
		return 'monthly-best'
	}
	
	const [activeTab, setActiveTab] = useState<Tab>(getInitialTab())
	const [myCourses, setMyCourses] = useState<TravelCourse[]>([])
	const [savedCourses, setSavedCourses] = useState<TravelCourse[]>([])
	const [publicCourses, setPublicCourses] = useState<TravelCourse[]>([])
	const [myCoursesLoading, setMyCoursesLoading] = useState(false)
	const [publicCoursesLoading, setPublicCoursesLoading] = useState(false)
	const [lastRefreshParam, setLastRefreshParam] = useState<string | null>(null)
	
	const navigate = useNavigate()
	const { isAuthed } = useAuth()
	
	const goPlanner = () => navigate('/planner')

	// 탭 변경 핸들러 - URL 파라미터도 함께 업데이트
	const handleTabChange = (newTab: Tab) => {
		setActiveTab(newTab)
		const newParams = new URLSearchParams(searchParams)
		newParams.set('tab', newTab)
		setSearchParams(newParams, { replace: true })
	}

	// 캐시 무효화 함수
	const clearCourseCache = () => {
		courseCache.clear()
	}

	// 강제 새로고침 함수
	const refreshAllData = async () => {
		clearCourseCache()
		await loadPublicCourses()
		if (isAuthed && activeTab === 'my-course') {
			await loadMyCourses()
		}
	}

	// 코스 공유 핸들러 (실시간 업데이트)
	const handleShareCourse = async (courseId: number) => {
		try {
			await shareCourse(courseId.toString())
			
			// 내 코스 목록에서 해당 코스의 공유수 증가
			setMyCourses(prev => prev.map(course => 
				course.id === courseId 
					? { ...course, shareCount: (course.shareCount || 0) + 1 }
					: course
			))
			
			// 저장된 코스 목록에서 해당 코스의 공유수 증가
			setSavedCourses(prev => prev.map(course => 
				course.id === courseId 
					? { ...course, shareCount: (course.shareCount || 0) + 1 }
					: course
			))
			
			// 공개 코스 목록에서 해당 코스의 공유수 증가
			setPublicCourses(prev => prev.map(course => 
				course.id === courseId 
					? { ...course, shareCount: (course.shareCount || 0) + 1 }
					: course
			))
			
		} catch (error) {
			console.error('Failed to share course:', error)
			throw error // 에러를 다시 던져서 TravelCourseCard에서 처리하도록 함
		}
	}

	// 저장한 코스 삭제 핸들러
	const handleUnsaveCourse = async (courseId: number) => {
		// 삭제 확인
		const confirmed = window.confirm(t('kcourse.messages.confirm_unsave'))
		if (!confirmed) return

		try {
			await unsaveCourse(courseId.toString())
			// 저장한 코스 목록에서 해당 코스 제거
			setSavedCourses(prev => prev.filter(course => course.id !== courseId))
			
			// 성공 메시지 (추후 토스트로 개선 가능)
			alert(t('kcourse.messages.unsave_success'))
		} catch (error) {
			console.error('Failed to unsave course:', error)
			// 사용자에게 오류 알림
			alert(t('kcourse.messages.unsave_failed'))
		}
	}

	// 내 코스 데이터 로드
	const loadMyCourses = async () => {
		if (!isAuthed) return
		
		try {
			setMyCoursesLoading(true)
			const response = await getMyCourses()
			
			// 새로운 API 응답 구조에 맞게 처리
			if (typeof response.data === 'object' && 'myCourses' in response.data) {
				const myConvertedCourses = await Promise.all(response.data.myCourses.map(course => courseToTravelCourse(course, t)))
				const savedConvertedCourses = await Promise.all(response.data.savedCourses.map(course => courseToTravelCourse(course, t)))
				
				// 광고 먼저, 그 다음 최신순 정렬
				const sortedMyCourses = myConvertedCourses.sort((a, b) => {
					if (a.isAdvertisement && !b.isAdvertisement) return -1
					if (!a.isAdvertisement && b.isAdvertisement) return 1
					return 0 // 기존 순서 유지 (이미 최신순)
				})
				
				const sortedSavedCourses = savedConvertedCourses.sort((a, b) => {
					if (a.isAdvertisement && !b.isAdvertisement) return -1
					if (!a.isAdvertisement && b.isAdvertisement) return 1
					return 0 // 기존 순서 유지 (이미 최신순)
				})
				
				setMyCourses(sortedMyCourses)
				setSavedCourses(sortedSavedCourses)
			} else {
				// 기존 배열 형식인 경우 (호환성)
				const convertedCourses = await Promise.all((response.data as Course[]).map(course => courseToTravelCourse(course, t)))
				const sortedCourses = convertedCourses.sort((a, b) => {
					if (a.isAdvertisement && !b.isAdvertisement) return -1
					if (!a.isAdvertisement && b.isAdvertisement) return 1
					return 0
				})
				setMyCourses(sortedCourses)
				setSavedCourses([])
			}
		} catch (error) {
			console.error('Failed to load my courses:', error)
			setMyCourses([])
			setSavedCourses([])
		} finally {
			setMyCoursesLoading(false)
		}
	}

	// 공개 코스 데이터 로드 (월별 Best 사용)
	const loadPublicCourses = async () => {
		try {
			setPublicCoursesLoading(true)
			// 임시로 getPublicCourses 사용 (monthly-best API 문제 해결까지)
			try {
				const response = await getMonthlyBestCourses(undefined, undefined, 12)
				const convertedCourses = await Promise.all((response.data as Course[]).map(course => courseToTravelCourse(course, t)))
				
				// 백엔드에서 이미 정렬된 상태로 오지만, 프론트엔드에서도 한번 더 정렬
				const sortedCourses = convertedCourses.sort((a, b) => {
					if (a.isAdvertisement && !b.isAdvertisement) return -1
					if (!a.isAdvertisement && b.isAdvertisement) return 1
					return 0 // 기존 순서 유지
				})
				
				setPublicCourses(sortedCourses)
			} catch (monthlyBestError) {
				console.warn('Monthly best API failed, falling back to public courses:', monthlyBestError)
				// Fallback: 일반 공개 코스 API 사용
				const response = await getPublicCourses(1, 12)
				const convertedCourses = await Promise.all((response.data as Course[]).map(course => courseToTravelCourse(course, t)))
				setPublicCourses(convertedCourses)
			}
		} catch (error) {
			console.error('Failed to load courses:', error)
			// 실패 시 빈 배열로 설정하여 기본 데이터가 표시되도록 함
			setPublicCourses([])
		} finally {
			setPublicCoursesLoading(false)
		}
	}

	// 컴포넌트 마운트 시 데이터 로드
	useEffect(() => {
		loadPublicCourses() // 공개 코스는 항상 로드
	}, [])

	// URL 파라미터 변경 감지하여 탭 상태 동기화
	useEffect(() => {
		const newTab = getInitialTab()
		if (newTab !== activeTab) {
			setActiveTab(newTab)
		}
	}, [searchParams])

	// 내 코스 탭을 선택했을 때 데이터 로드
	useEffect(() => {
		if (activeTab === 'my-course' && isAuthed) {
			loadMyCourses()
		}
	}, [activeTab, isAuthed])

	// URL 파라미터의 refresh 변경 감지
	useEffect(() => {
		const refreshParam = searchParams.get('refresh')
		if (refreshParam && refreshParam !== lastRefreshParam) {
			setLastRefreshParam(refreshParam)
			refreshAllData()
			// URL에서 refresh 파라미터 제거 (히스토리에 남지 않게)
			const newParams = new URLSearchParams(searchParams)
			newParams.delete('refresh')
			setSearchParams(newParams, { replace: true })
		}
	}, [searchParams, lastRefreshParam])

	// 페이지 가시성 변경 감지 (코스 수정 후 돌아왔을 때)
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				// 페이지가 다시 보이게 될 때 데이터 새로고침
				refreshAllData()
			}
		}

		document.addEventListener('visibilitychange', handleVisibilityChange)
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange)
		}
	}, [isAuthed, activeTab])

	return (
		<div className="min-h-[calc(100vh-64px)] bg-white">
			<HeroBanner activeTab={activeTab} onTabChange={handleTabChange} />
			{activeTab === 'my-course' ? (
				<MyTravelCourse 
					onCreate={goPlanner} 
					myCourses={myCourses}
					savedCourses={savedCourses}
					loading={myCoursesLoading}
					onUnsaveCourse={handleUnsaveCourse}
					onShareCourse={handleShareCourse}
					currentTab={activeTab}
				/>
			) : (
				<TravelCourseGrid 
					onCreate={goPlanner} 
					courses={publicCourses}
					loading={publicCoursesLoading}
					onShareCourse={handleShareCourse}
				/>
			)}
		</div>
	)
}
