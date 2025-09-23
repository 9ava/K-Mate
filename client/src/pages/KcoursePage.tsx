// src/pages/KCoursePage.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getMyCourses, getPublicCourses, unsaveCourse } from '../api/courses'
import type { Course } from '../types/course'
import { useAuth } from '../features/auth/useAuth'
import { getPlaceDetails } from '../lib/kakao'

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
	let category: 'cultural' | 'cafe' | 'food' | 'nature' = 'cultural' // 기본 카테고리
	
	// 첫 번째 장소의 카카오맵 정보 가져오기
	const firstStop = course.stops[0]
	if (firstStop?.externalId) {
		try {
			const placeDetails = await getPlaceDetails(firstStop.externalId, firstStop.name)
			if (placeDetails) {
				image = placeDetails.image
				category = placeDetails.category
			}
		} catch (error) {
			console.warn('Failed to get place details for course:', course.id, error)
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
	category: 'cultural' | 'cafe' | 'food' | 'nature'
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
	onUnsaveCourse
}: { 
	onCreate: () => void
	myCourses: TravelCourse[]
	savedCourses: TravelCourse[]
	loading: boolean
	onUnsaveCourse: (courseId: number) => Promise<void>
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
								<TravelCourseCard key={`my-${course.id}`} course={course} isOwned={true} />
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
	onUnsave 
}: { 
	course: TravelCourse
	isOwned?: boolean
	onUnsave?: (courseId: number) => Promise<void>
}) {
	const { t } = useTranslation()
	const navigate = useNavigate()

	const handleClick = () => {
		navigate(`/kcourse/${course.id}`)
	}

	const handleUnsave = async (e: React.MouseEvent) => {
		e.stopPropagation() // 카드 클릭 이벤트 방지
		if (onUnsave) {
			await onUnsave(course.id)
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

				{/* 소유 여부 표시 */}
				{isOwned !== undefined && (
					<div className="absolute top-3 left-3">
						<span className={`px-2 py-1 text-xs font-medium rounded-full ${
							isOwned 
								? 'bg-blue-100 text-blue-800' 
								: 'bg-green-100 text-green-800'
						}`}>
							{isOwned ? t('kcourse.labels.my_course') : t('kcourse.labels.saved')}
						</span>
					</div>
				)}

				{/* 저장된 코스 삭제 버튼 */}
				{isOwned === false && onUnsave && (
					<div className="absolute top-3 right-3">
						<button
							onClick={handleUnsave}
							className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-all duration-200 flex items-center justify-center group"
							title={t('kcourse.buttons.unsave_course')}
						>
							<svg 
								className="w-4 h-4" 
								fill="none" 
								stroke="currentColor" 
								viewBox="0 0 24 24"
							>
								<path 
									strokeLinecap="round" 
									strokeLinejoin="round" 
									strokeWidth={2} 
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
								/>
							</svg>
						</button>
					</div>
				)}

				{course.category === 'cultural' && (
					<div className="absolute flex items-center justify-center w-8 h-8 rounded-full bottom-3 right-3 bg-white/80">
						<div className="w-4 h-4 bg-blue-400 rounded-full" />
					</div>
				)}
				{course.category === 'cafe' && (
					<div className="absolute flex items-center justify-center w-8 h-8 rounded-full bottom-3 right-3 bg-white/80">
						<div className="w-4 h-4 rounded-full bg-amber-400" />
					</div>
				)}
				{course.category === 'food' && (
					<div className="absolute flex items-center justify-center w-8 h-8 rounded-full bottom-3 right-3 bg-white/80">
						<div className="w-4 h-4 bg-red-400 rounded-full" />
					</div>
				)}
				{course.category === 'nature' && (
					<div className="absolute flex items-center justify-center w-8 h-8 rounded-full bottom-3 right-3 bg-white/80">
						<div className="w-4 h-4 bg-green-400 rounded-full" />
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
			</div>
		</div>
	)
}

/* --- TravelCourseGrid (월간 Best 또는 공개 코스) --- */
// 임시 하드코딩 데이터 (공개 코스가 없을 때 사용)
const getDefaultTravelCourses = (t: any): TravelCourse[] => [
	{
		id: 1,
		title: '서울 궁궐 투어 코스',
		location: '서울 종로구',
		date: '2024. 2. 21.',
		author: t('kcourse.labels.created_date'),
		image: 'https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=1d0f0330-cfb2-4a40-82ce-37c02fb61768',
		category: 'cultural',
	},
	{
		id: 2,
		title: '홍대 카페 투어',
		location: '서울 마포구',
		date: '2024. 2. 12.',
		author: t('kcourse.labels.created_date'),
		image: 'https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=1c256b80-a500-4556-b7f9-08a94e389cbf',
		category: 'cafe',
	},
	{
		id: 3,
		title: '명동 맛집 투어',
		location: '서울 중구',
		date: '2025. 6. 10.',
		author: t('kcourse.labels.created_date'),
		image: 'https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=b8b85fc6-5719-473d-90d4-74efe761319a',
		category: 'food',
	},
	{
		id: 4,
		title: '한강공원 피크닉 코스',
		location: '서울 영등포구',
		date: '2024. 1. 25.',
		author: t('kcourse.labels.created_date'),
		image: 'https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=c25671f8-f713-4b60-96b4-caf3950a8bd4',
		category: 'nature',
	},
]

function TravelCourseGrid({ 
	onCreate, 
	courses, 
	loading 
}: { 
	onCreate: () => void
	courses: TravelCourse[]
	loading: boolean
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

	// 공개 코스가 없으면 기본 데이터 사용
	const displayCourses = courses.length > 0 ? courses : getDefaultTravelCourses(t)

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
					{displayCourses.map((course: TravelCourse) => (
						<TravelCourseCard key={course.id} course={course} />
					))}
				</div>
			</div>
		</section>
	)
}


export default function KCoursePage() {
	const { t } = useTranslation()
	const [activeTab, setActiveTab] = useState<Tab>('monthly-best')
	const [myCourses, setMyCourses] = useState<TravelCourse[]>([])
	const [savedCourses, setSavedCourses] = useState<TravelCourse[]>([])
	const [publicCourses, setPublicCourses] = useState<TravelCourse[]>([])
	const [myCoursesLoading, setMyCoursesLoading] = useState(false)
	const [publicCoursesLoading, setPublicCoursesLoading] = useState(false)
	
	const navigate = useNavigate()
	const { isAuthed } = useAuth()
	const goPlanner = () => navigate('/planner')

	// 저장한 코스 삭제 핸들러
	const handleUnsaveCourse = async (courseId: number) => {
		// 삭제 확인
		const confirmed = window.confirm(t('kcourse.messages.confirm_unsave'))
		if (!confirmed) return

		try {
			await unsaveCourse(courseId.toString())
			// 저장한 코스 목록에서 해당 코스 제거
			setSavedCourses(prev => prev.filter(course => course.id !== courseId))
			console.log(`Course ${courseId} unsaved successfully`)
			
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
				setMyCourses(myConvertedCourses)
				setSavedCourses(savedConvertedCourses)
			} else {
				// 기존 배열 형식인 경우 (호환성)
				const convertedCourses = await Promise.all((response.data as Course[]).map(course => courseToTravelCourse(course, t)))
				setMyCourses(convertedCourses)
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

	// 공개 코스 데이터 로드
	const loadPublicCourses = async () => {
		try {
			setPublicCoursesLoading(true)
			const response = await getPublicCourses(1, 12) // 첫 페이지에서 12개 가져오기
			const convertedCourses = await Promise.all((response.data as Course[]).map(course => courseToTravelCourse(course, t)))
			setPublicCourses(convertedCourses)
		} catch (error) {
			console.error('Failed to load public courses:', error)
			setPublicCourses([])
		} finally {
			setPublicCoursesLoading(false)
		}
	}

	// 컴포넌트 마운트 시 데이터 로드
	useEffect(() => {
		loadPublicCourses() // 공개 코스는 항상 로드
	}, [])

	// 내 코스 탭을 선택했을 때 데이터 로드
	useEffect(() => {
		if (activeTab === 'my-course' && isAuthed) {
			loadMyCourses()
		}
	}, [activeTab, isAuthed])

	return (
		<div className="min-h-[calc(100vh-64px)] bg-white">
			<HeroBanner activeTab={activeTab} onTabChange={setActiveTab} />
			{activeTab === 'my-course' ? (
				<MyTravelCourse 
					onCreate={goPlanner} 
					myCourses={myCourses}
					savedCourses={savedCourses}
					loading={myCoursesLoading}
					onUnsaveCourse={handleUnsaveCourse}
				/>
			) : (
				<TravelCourseGrid 
					onCreate={goPlanner} 
					courses={publicCourses}
					loading={publicCoursesLoading}
				/>
			)}
		</div>
	)
}
