// src/pages/KCoursePage.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyCourses, getPublicCourses } from '../api/courses'
import type { Course } from '../types/course'
import { useAuth } from '../features/auth/useAuth'

type Tab = 'my-course' | 'monthly-best'

// Course 타입을 TravelCourse 형태로 변환하는 헬퍼 함수
function courseToTravelCourse(course: Course): TravelCourse {
	return {
		id: parseInt(course.id),
		title: course.title,
		location: course.stops[0]?.name || '알 수 없는 위치',
		date: new Date(course.created_at).toLocaleDateString('ko-KR'),
		author: course.author?.name || '작성자',
		image: 'https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=1d0f0330-cfb2-4a40-82ce-37c02fb61768', // 기본 이미지
		category: 'cultural' as const, // 임시로 cultural로 설정
	}
}

type TravelCourse = {
	id: number
	title: string
	location: string
	date: string
	author: string
	image: string
	category: 'cultural' | 'coastal' | 'exhibition' | 'nature'
}

/* --- HeroBanner --- */
function HeroBanner({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (t: Tab) => void }) {
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
							<span className="text-lg">나의 여행코스</span>
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
							<span className="text-lg">월간Best</span>
						</button>
					</div>
				</div>
			</div>
		</section>
	)
}

/* --- MyTravelCourse (실제 데이터) --- */
function MyTravelCourse({ onCreate, myCourses, savedCourses, loading }: { 
	onCreate: () => void
	myCourses: TravelCourse[]
	savedCourses: TravelCourse[]
	loading: boolean
}) {
	if (loading) {
		return (
			<section className="py-12 bg-white">
				<div className="container px-4 mx-auto">
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-3xl font-bold text-gray-900">나의 여행코스</h2>
						<button
							onClick={onCreate}
							className="px-6 py-2 font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
						>
							코스만들기 →
						</button>
					</div>
					<div className="py-20 text-center">
						<div className="text-lg text-gray-500">로딩중...</div>
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
						<h2 className="text-3xl font-bold text-gray-900">나의 여행코스</h2>
						<button
							onClick={onCreate}
							className="px-6 py-2 font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
						>
							코스만들기 →
						</button>
					</div>

					<div className="py-20 text-center">
						<div className="text-lg text-gray-500">아직 만든 여행코스가 없습니다.</div>
						<div className="mt-2 text-sm text-gray-500">나만의 여행코스를 만들어보세요!</div>
						<button
							onClick={onCreate}
							className="px-8 py-3 mt-6 font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
						>
							첫 번째 코스 만들기
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
					<h2 className="text-3xl font-bold text-gray-900">나의 여행코스</h2>
					<button
						onClick={onCreate}
						className="px-6 py-2 font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
					>
						코스만들기 →
					</button>
				</div>

				{/* 내가 만든 코스 섹션 */}
				{myCourses.length > 0 && (
					<div className="mb-12">
						<div className="flex items-center gap-2 mb-4">
							<h3 className="text-xl font-semibold text-gray-800">내가 만든 코스</h3>
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
							<h3 className="text-xl font-semibold text-gray-800">저장한 코스</h3>
							<span className="text-sm text-gray-500">({savedCourses.length}개)</span>
						</div>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
							{savedCourses.map((course) => (
								<TravelCourseCard key={`saved-${course.id}`} course={course} isOwned={false} />
							))}
						</div>
					</div>
				)}
			</div>
		</section>
	)
}

/* --- TravelCourseCard --- */
function TravelCourseCard({ course, isOwned }: { course: TravelCourse; isOwned?: boolean }) {
	const navigate = useNavigate()

	const handleClick = () => {
		navigate(`/kcourse/${course.id}`)
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
							{isOwned ? '내 코스' : '저장됨'}
						</span>
					</div>
				)}

				{course.category === 'cultural' && (
					<div className="absolute flex items-center justify-center w-8 h-8 rounded-full bottom-3 right-3 bg-white/80">
						<div className="w-4 h-4 bg-blue-400 rounded-full" />
					</div>
				)}
				{course.category === 'coastal' && (
					<div className="absolute flex items-center justify-center w-8 h-8 rounded-full bottom-3 right-3 bg-white/80">
						<div className="w-4 h-4 bg-gray-400 rounded-full" />
					</div>
				)}
				{course.category === 'exhibition' && (
					<div className="absolute flex items-center justify-center w-8 h-8 rounded-full bottom-3 right-3 bg-white/80">
						<div className="w-4 h-4 bg-orange-400 rounded-full" />
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
const defaultTravelCourses: TravelCourse[] = [
	{
		id: 1,
		title: '전북 고창군 여행코스',
		location: '전북 고창',
		date: '2024. 2. 21.',
		author: '만든날짜',
		image: 'https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=1d0f0330-cfb2-4a40-82ce-37c02fb61768',
		category: 'cultural',
	},
	{
		id: 2,
		title: '제주도 여행코스',
		location: '제주',
		date: '2024. 2. 12.',
		author: '만든날짜',
		image: 'https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=1c256b80-a500-4556-b7f9-08a94e389cbf',
		category: 'coastal',
	},
	{
		id: 3,
		title: '2025 대한민국 정원산업박람회 1박2일',
		location: '경남 진주시',
		date: '2025. 6. 10.',
		author: '만든날짜',
		image: 'https://cdn.visitkorea.or.kr/img/call?cmd=VIEW&id=b8b85fc6-5719-473d-90d4-74efe761319a',
		category: 'exhibition',
	},
	{
		id: 4,
		title: '충남 금산군 여행코스',
		location: '충남 금산',
		date: '2024. 1. 25.',
		author: '만든날짜',
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
	if (loading) {
		return (
			<section className="py-12 bg-white">
				<div className="container px-4 mx-auto">
					<div className="py-20 text-center">
						<div className="text-lg text-gray-500">로딩중...</div>
					</div>
				</div>
			</section>
		)
	}

	// 공개 코스가 없으면 기본 데이터 사용
	const displayCourses = courses.length > 0 ? courses : defaultTravelCourses

	return (
		<section className="py-12 bg-white">
			<div className="container px-4 mx-auto">
				<div className="flex items-center justify-between mb-8">
					<div className="flex items-center gap-2">
						<h2 className="text-3xl font-bold text-gray-900">월간 Best 9</h2>
						<div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
							<span className="text-xs text-gray-500">i</span>
						</div>
					</div>
					<button
						onClick={onCreate}
						className="px-6 py-2 font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
					>
						코스만들기 →
					</button>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					{displayCourses.map((course) => (
						<TravelCourseCard key={course.id} course={course} />
					))}
				</div>
			</div>
		</section>
	)
}


export default function KCoursePage() {
	const [activeTab, setActiveTab] = useState<Tab>('monthly-best')
	const [myCourses, setMyCourses] = useState<TravelCourse[]>([])
	const [savedCourses, setSavedCourses] = useState<TravelCourse[]>([])
	const [publicCourses, setPublicCourses] = useState<TravelCourse[]>([])
	const [myCoursesLoading, setMyCoursesLoading] = useState(false)
	const [publicCoursesLoading, setPublicCoursesLoading] = useState(false)
	
	const navigate = useNavigate()
	const { isAuthed } = useAuth()
	const goPlanner = () => navigate('/planner')

	// 내 코스 데이터 로드
	const loadMyCourses = async () => {
		if (!isAuthed) return
		
		try {
			setMyCoursesLoading(true)
			const response = await getMyCourses()
			
			// 새로운 API 응답 구조에 맞게 처리
			if (typeof response.data === 'object' && 'myCourses' in response.data) {
				const myConvertedCourses = response.data.myCourses.map(courseToTravelCourse)
				const savedConvertedCourses = response.data.savedCourses.map(courseToTravelCourse)
				setMyCourses(myConvertedCourses)
				setSavedCourses(savedConvertedCourses)
			} else {
				// 기존 배열 형식인 경우 (호환성)
				const convertedCourses = (response.data as Course[]).map(courseToTravelCourse)
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
			const convertedCourses = (response.data as Course[]).map(courseToTravelCourse)
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
