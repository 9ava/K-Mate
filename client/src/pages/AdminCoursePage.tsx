import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { getPublicCourses, deleteCourse, toggleCourseAdvertisement } from '../api/courses'
import type { Course } from '../types/course'

export default function AdminCoursePage() {
	const { refresh, ready, isAuthed, role } = useAuth()
	const [courses, setCourses] = useState<Course[]>([])
	const [loading, setLoading] = useState(true)
	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [searchTerm, setSearchTerm] = useState('')

	useEffect(() => {
		refresh()
	}, [])

	useEffect(() => {
		if (ready && isAuthed && role === 'admin') {
			loadCourses()
		}
	}, [ready, isAuthed, role, currentPage])

	const loadCourses = async () => {
		try {
			setLoading(true)
			const response = await getPublicCourses(currentPage, 20)
			setCourses(response.data as Course[])
			if (response.pagination) {
				setTotalPages(response.pagination.totalPages)
			}
		} catch (error) {
			console.error('Failed to load courses:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleDeleteCourse = async (courseId: string) => {
		if (!confirm('정말로 이 코스를 삭제하시겠습니까?')) return

		try {
			await deleteCourse(courseId)
			await loadCourses() // 목록 새로고침
		} catch (error) {
			console.error('Failed to delete course:', error)
			alert('코스 삭제에 실패했습니다.')
		}
	}

	const handleToggleAdvertisement = async (courseId: string, isAdvertisement: boolean) => {
		try {
			await toggleCourseAdvertisement(courseId, !isAdvertisement)
			await loadCourses() // 목록 새로고침
		} catch (error) {
			console.error('Failed to toggle advertisement:', error)
			alert('광고 설정 변경에 실패했습니다.')
		}
	}

	// 검색 필터링
	const filteredCourses = courses.filter(course =>
		course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
		course.author?.name?.toLowerCase().includes(searchTerm.toLowerCase())
	)

	if (!ready) return <div className="p-6">Loading...</div>

	if (!isAuthed) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
				<div className="text-center">
					<h1 className="mb-2 text-2xl font-bold text-gray-900">접근 권한이 없습니다</h1>
					<p className="text-gray-600">관리자 페이지에 접근하려면 로그인이 필요합니다.</p>
				</div>
			</div>
		)
	}

	if (role !== 'admin') {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
				<div className="text-center">
					<h1 className="mb-2 text-2xl font-bold text-gray-900">관리자 권한이 필요합니다</h1>
					<p className="text-gray-600">이 페이지는 관리자만 접근할 수 있습니다.</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-[calc(100vh-3.5rem)] bg-gray-50">
			<div className="px-4 py-8 mx-auto max-w-7xl">
				{/* 헤더 */}
				<div className="mb-8">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="mb-2 text-3xl font-bold text-gray-900">K-Course 관리</h1>
							<p className="text-gray-600">여행 코스를 관리하고 광고를 설정할 수 있습니다.</p>
						</div>
						<Link
							to="/admin"
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
						>
							← 관리자 메인으로
						</Link>
					</div>
				</div>

				{/* 검색 및 필터 */}
				<div className="mb-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex-1 max-w-md">
							<input
								type="text"
								placeholder="코스 제목 또는 작성자로 검색..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
							/>
						</div>
						<div className="flex items-center gap-4">
							<span className="text-sm text-gray-500">
								전체 {courses.length}개의 코스
							</span>
						</div>
					</div>
				</div>

				{/* 코스 목록 테이블 */}
				<div className="overflow-hidden bg-white rounded-lg shadow">
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
										코스 정보
									</th>
									<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
										작성자
									</th>
									<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
										생성일
									</th>
									<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
										공개 설정
									</th>
									<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
										광고
									</th>
									<th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
										작업
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{loading ? (
									<tr>
										<td colSpan={6} className="px-6 py-8 text-center text-gray-500">
											로딩 중...
										</td>
									</tr>
								) : filteredCourses.length === 0 ? (
									<tr>
										<td colSpan={6} className="px-6 py-8 text-center text-gray-500">
											{searchTerm ? '검색 결과가 없습니다.' : '등록된 코스가 없습니다.'}
										</td>
									</tr>
								) : (
									filteredCourses.map((course) => (
										<tr key={course.id} className="hover:bg-gray-50">
											<td className="px-6 py-4">
												<div className="flex items-start">
													<div className="flex-1">
														<div className="flex items-center gap-2">
															<p className="text-sm font-medium text-gray-900">
																{course.title}
															</p>
															{course.isAdvertisement && (
																<span className="px-2 py-1 text-xs font-medium text-orange-800 bg-orange-100 rounded-full">
																	광고
																</span>
															)}
														</div>
														<p className="mt-1 text-sm text-gray-500">
															경유지 {course.stops?.length || 0}개
														</p>
													</div>
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="text-sm text-gray-900">
													{course.author?.name || '알 수 없음'}
												</div>
												<div className="text-sm text-gray-500">
													{course.author?.email}
												</div>
											</td>
											<td className="px-6 py-4 text-sm text-gray-500">
												{new Date(course.created_at).toLocaleDateString('ko-KR')}
											</td>
											<td className="px-6 py-4">
												<span className={`px-2 py-1 text-xs font-medium rounded-full ${
													course.visibility === 'public' 
														? 'bg-green-100 text-green-800' 
														: 'bg-gray-100 text-gray-800'
												}`}>
													{course.visibility === 'public' ? '공개' : '비공개'}
												</span>
											</td>
											<td className="px-6 py-4">
												<button
													onClick={() => handleToggleAdvertisement(course.id, course.isAdvertisement)}
													className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
														course.isAdvertisement
															? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
															: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
													}`}
												>
													{course.isAdvertisement ? '광고 해제' : '광고 설정'}
												</button>
											</td>
											<td className="px-6 py-4 text-right">
												<div className="flex justify-end gap-2">
													<Link
														to={`/kcourse/${course.id}`}
														className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200"
													>
														보기
													</Link>
													<button
														onClick={() => handleDeleteCourse(course.id)}
														className="px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200"
													>
														삭제
													</button>
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* 페이지네이션 */}
				{totalPages > 1 && (
					<div className="flex justify-center mt-8">
						<div className="flex gap-2">
							<button
								onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
								disabled={currentPage === 1}
								className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								이전
							</button>
							
							{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
								const pageNum = i + 1
								return (
									<button
										key={pageNum}
										onClick={() => setCurrentPage(pageNum)}
										className={`px-3 py-2 text-sm font-medium rounded-md ${
											currentPage === pageNum
												? 'bg-orange-600 text-white'
												: 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
										}`}
									>
										{pageNum}
									</button>
								)
							})}
							
							<button
								onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
								disabled={currentPage === totalPages}
								className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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