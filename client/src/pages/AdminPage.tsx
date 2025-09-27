import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'

export default function AdminPage() {
	const { refresh, ready, isAuthed, role } = useAuth()

	useEffect(() => {
		refresh()
	}, [])

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
				<div className="mb-8">
					<h1 className="mb-2 text-3xl font-bold text-gray-900">관리자 페이지</h1>
					<p className="text-gray-600">시스템 관리 및 설정을 관리할 수 있습니다.</p>
				</div>

				<div className="grid max-w-6xl grid-cols-1 gap-6 mx-auto md:grid-cols-2 lg:grid-cols-3">
					{/* K-Map 관리 */}
					<div className="p-6 text-center bg-white rounded-lg shadow">
						<div className="flex justify-center mb-4">
							<div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
								<svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
							</div>
						</div>
						<h3 className="mb-3 text-lg font-semibold text-gray-900">K-Map 관리</h3>
						<p className="mb-4 text-gray-600">지도 마커와 위치 정보를 관리합니다.</p>
						<Link
							to="/admin/map"
							className="block w-full px-4 py-2 text-center text-white transition-colors bg-red-600 rounded-md hover:bg-red-700"
						>
							지도 관리하기
						</Link>
					</div>

					{/* K-Course 관리 */}
					<div className="p-6 text-center bg-white rounded-lg shadow">
						<div className="flex justify-center mb-4">
							<div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
								<svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
								</svg>
							</div>
						</div>
						<h3 className="mb-3 text-lg font-semibold text-gray-900">K-Course 관리</h3>
						<p className="mb-4 text-gray-600">여행 코스를 관리하고 광고를 설정합니다.</p>
						<Link
							to="/admin/courses"
							className="block w-full px-4 py-2 text-center text-white transition-colors bg-orange-600 rounded-md hover:bg-orange-700"
						>
							코스 관리하기
						</Link>
					</div>

					{/* 콘텐츠 관리 */}
					<div className="p-6 text-center bg-white rounded-lg shadow">
						<div className="flex justify-center mb-4">
							<div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
								<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
							</div>
						</div>
						<h3 className="mb-3 text-lg font-semibold text-gray-900">콘텐츠 관리</h3>
						<p className="mb-4 text-gray-600">K-Buzz 게시물과 댓글을 관리합니다.</p>
						<Link
							to="/admin/connect"
							className="block w-full px-4 py-2 text-center text-white transition-colors bg-green-600 rounded-md hover:bg-green-700"
						>
							콘텐츠 관리하기
						</Link>
					</div>

					{/* 사용자 관리 */}
					<div className="p-6 text-center bg-white rounded-lg shadow">
						<div className="flex justify-center mb-4">
							<div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
								<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
								</svg>
							</div>
						</div>
						<h3 className="mb-3 text-lg font-semibold text-gray-900">사용자 관리</h3>
						<p className="mb-4 text-gray-600">등록된 사용자를 관리하고 권한을 설정합니다.</p>
						<Link
							to="/admin/users"
							className="block w-full px-4 py-2 text-center text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
						>
							사용자 목록 보기
						</Link>
					</div>

					{/* 시스템 통계 */}
					<div className="p-6 text-center bg-white rounded-lg shadow">
						<div className="flex justify-center mb-4">
							<div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
								<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
								</svg>
							</div>
						</div>
						<h3 className="mb-3 text-lg font-semibold text-gray-900">시스템 통계</h3>
						<p className="mb-4 text-gray-600">사용자 활동 및 시스템 현황을 확인합니다.</p>
						<Link
							to="/admin/statistics"
							className="block w-full px-4 py-2 text-center text-white transition-colors bg-purple-600 rounded-md hover:bg-purple-700"
						>
							통계 보기
						</Link>
					</div>

				</div>
			</div>
		</div>
	)
}