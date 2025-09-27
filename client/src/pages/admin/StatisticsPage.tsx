import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface DailyStats {
	date: string
	users: number
	posts: number
	comments: number
	pageViews: number
}

interface CategoryStats {
	name: string
	count: number
	percentage: number
	color: string
}

export default function StatisticsPage() {
	const navigate = useNavigate()
	const [selectedPeriod, setSelectedPeriod] = useState<string>('7days')

	// Mock daily statistics data
	const dailyStats: DailyStats[] = [
		{ date: '2024-01-14', users: 45, posts: 12, comments: 34, pageViews: 1234 },
		{ date: '2024-01-15', users: 52, posts: 18, comments: 41, pageViews: 1456 },
		{ date: '2024-01-16', users: 38, posts: 9, comments: 28, pageViews: 987 },
		{ date: '2024-01-17', users: 67, posts: 23, comments: 55, pageViews: 1678 },
		{ date: '2024-01-18', users: 71, posts: 26, comments: 62, pageViews: 1823 },
		{ date: '2024-01-19', users: 84, posts: 31, comments: 78, pageViews: 2134 },
		{ date: '2024-01-20', users: 92, posts: 35, comments: 89, pageViews: 2456 },
	]

	// Mock category statistics
	const postCategories: CategoryStats[] = [
		{ name: '관광지', count: 45, percentage: 35, color: 'bg-blue-500' },
		{ name: '맛집', count: 38, percentage: 30, color: 'bg-orange-500' },
		{ name: '문화', count: 25, percentage: 20, color: 'bg-green-500' },
		{ name: '쇼핑', count: 19, percentage: 15, color: 'bg-purple-500' },
	]

	const userSources: CategoryStats[] = [
		{ name: 'Google', count: 156, percentage: 45, color: 'bg-red-500' },
		{ name: 'Kakao', count: 124, percentage: 35, color: 'bg-yellow-500' },
		{ name: 'Naver', count: 89, percentage: 25, color: 'bg-green-500' },
		{ name: 'Direct', count: 45, percentage: 15, color: 'bg-gray-500' },
	]

	// Calculate totals and averages
	const totalUsers = dailyStats.reduce((sum, day) => sum + day.users, 0)
	const totalPosts = dailyStats.reduce((sum, day) => sum + day.posts, 0)
	const totalComments = dailyStats.reduce((sum, day) => sum + day.comments, 0)
	const totalPageViews = dailyStats.reduce((sum, day) => sum + day.pageViews, 0)
	const avgDaily = {
		users: Math.round(totalUsers / dailyStats.length),
		posts: Math.round(totalPosts / dailyStats.length),
		comments: Math.round(totalComments / dailyStats.length),
		pageViews: Math.round(totalPageViews / dailyStats.length),
	}

	// Mock real-time stats
	const realtimeStats = {
		activeUsers: 23,
		onlineAdmins: 2,
		todayNewUsers: 8,
		todayNewPosts: 12,
		todayNewComments: 34,
		serverStatus: 'healthy',
		dbConnections: 45,
		avgResponseTime: '124ms',
	}

	// Top content
	const topPosts = [
		{ id: 1, title: '경복궁 야경 촬영 스팟 추천', author: '사진작가김', views: 1234, likes: 89 },
		{ id: 2, title: '홍대 핫플레이스 맛집 리스트', author: '맛집탐험가', views: 987, likes: 76 },
		{ id: 3, title: '강남 쇼핑 완전정복 가이드', author: '쇼핑러버', views: 756, likes: 54 },
		{ id: 4, title: '한강 피크닉 명소 BEST 5', author: '아웃도어맨', views: 634, likes: 43 },
		{ id: 5, title: '서울 카페 투어 추천코스', author: '카페호핑', views: 512, likes: 38 },
	]

	const getStatusColor = (status: string) => {
		return status === 'healthy' ? 'text-green-600' : 'text-red-600'
	}

	const formatNumber = (num: number) => {
		return num.toLocaleString()
	}

	const getGrowthIndicator = (current: number, previous: number) => {
		const growth = ((current - previous) / previous) * 100
		const isPositive = growth > 0
		return {
			percentage: Math.abs(growth).toFixed(1),
			isPositive,
			color: isPositive ? 'text-green-600' : 'text-red-600',
			icon: isPositive ? '↗' : '↘',
		}
	}

	// Mock previous period data for growth calculation
	const previousStats = {
		users: totalUsers - 50,
		posts: totalPosts - 15,
		comments: totalComments - 45,
		pageViews: totalPageViews - 1200,
	}

	return (
		<div className="min-h-[calc(100vh-3.5rem)] bg-gray-50">
			<div className="px-4 py-8 mx-auto max-w-7xl">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="mb-2 text-3xl font-bold text-gray-900">시스템 통계</h1>
						<p className="text-gray-600">사용자 활동 및 시스템 현황을 확인합니다</p>
					</div>
					<div className="flex gap-3">
						<select
							value={selectedPeriod}
							onChange={(e) => setSelectedPeriod(e.target.value)}
							className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
						>
							<option value="7days">최근 7일</option>
							<option value="30days">최근 30일</option>
							<option value="3months">최근 3개월</option>
						</select>
						<button
							onClick={() => navigate('/admin')}
							className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
						>
							돌아가기
						</button>
					</div>
				</div>

				{/* Real-time Status Cards */}
				<div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-4">
					<div className="p-4 bg-white rounded-lg shadow">
						<div className="flex items-center justify-between">
							<div>
								<div className="text-2xl font-bold text-blue-600">{realtimeStats.activeUsers}</div>
								<div className="text-sm text-gray-500">현재 접속자</div>
							</div>
							<div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
								<svg
									className="w-6 h-6 text-blue-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
									/>
								</svg>
							</div>
						</div>
						<div className="mt-2 text-xs text-gray-400">
							관리자 {realtimeStats.onlineAdmins}명 온라인
						</div>
					</div>

					<div className="p-4 bg-white rounded-lg shadow">
						<div className="flex items-center justify-between">
							<div>
								<div className="text-2xl font-bold text-green-600">
									{realtimeStats.todayNewUsers}
								</div>
								<div className="text-sm text-gray-500">오늘 신규 가입</div>
							</div>
							<div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
								<svg
									className="w-6 h-6 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
									/>
								</svg>
							</div>
						</div>
					</div>

					<div className="p-4 bg-white rounded-lg shadow">
						<div className="flex items-center justify-between">
							<div>
								<div className={`text-2xl font-bold ${getStatusColor(realtimeStats.serverStatus)}`}>
									{realtimeStats.serverStatus === 'healthy' ? '정상' : '오류'}
								</div>
								<div className="text-sm text-gray-500">서버 상태</div>
							</div>
							<div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full">
								<svg
									className="w-6 h-6 text-purple-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
									/>
								</svg>
							</div>
						</div>
						<div className="mt-2 text-xs text-gray-400">
							{realtimeStats.avgResponseTime} 평균 응답시간
						</div>
					</div>

					<div className="p-4 bg-white rounded-lg shadow">
						<div className="flex items-center justify-between">
							<div>
								<div className="text-2xl font-bold text-orange-600">
									{realtimeStats.dbConnections}
								</div>
								<div className="text-sm text-gray-500">DB 연결</div>
							</div>
							<div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full">
								<svg
									className="w-6 h-6 text-orange-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
									/>
								</svg>
							</div>
						</div>
					</div>
				</div>

				{/* Main Statistics Cards */}
				<div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-4">
					<div className="p-6 bg-white rounded-lg shadow">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-gray-900">총 사용자</h3>
							<div
								className={`text-sm ${getGrowthIndicator(totalUsers, previousStats.users).color}`}
							>
								{getGrowthIndicator(totalUsers, previousStats.users).icon}{' '}
								{getGrowthIndicator(totalUsers, previousStats.users).percentage}%
							</div>
						</div>
						<div className="mb-2 text-3xl font-bold text-blue-600">{formatNumber(totalUsers)}</div>
						<div className="text-sm text-gray-500">일평균 {avgDaily.users}명</div>
					</div>

					<div className="p-6 bg-white rounded-lg shadow">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-gray-900">총 게시물</h3>
							<div
								className={`text-sm ${getGrowthIndicator(totalPosts, previousStats.posts).color}`}
							>
								{getGrowthIndicator(totalPosts, previousStats.posts).icon}{' '}
								{getGrowthIndicator(totalPosts, previousStats.posts).percentage}%
							</div>
						</div>
						<div className="mb-2 text-3xl font-bold text-green-600">{formatNumber(totalPosts)}</div>
						<div className="text-sm text-gray-500">일평균 {avgDaily.posts}개</div>
					</div>

					<div className="p-6 bg-white rounded-lg shadow">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-gray-900">총 댓글</h3>
							<div
								className={`text-sm ${
									getGrowthIndicator(totalComments, previousStats.comments).color
								}`}
							>
								{getGrowthIndicator(totalComments, previousStats.comments).icon}{' '}
								{getGrowthIndicator(totalComments, previousStats.comments).percentage}%
							</div>
						</div>
						<div className="mb-2 text-3xl font-bold text-purple-600">
							{formatNumber(totalComments)}
						</div>
						<div className="text-sm text-gray-500">일평균 {avgDaily.comments}개</div>
					</div>

					<div className="p-6 bg-white rounded-lg shadow">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-gray-900">페이지뷰</h3>
							<div
								className={`text-sm ${
									getGrowthIndicator(totalPageViews, previousStats.pageViews).color
								}`}
							>
								{getGrowthIndicator(totalPageViews, previousStats.pageViews).icon}{' '}
								{getGrowthIndicator(totalPageViews, previousStats.pageViews).percentage}%
							</div>
						</div>
						<div className="mb-2 text-3xl font-bold text-orange-600">
							{formatNumber(totalPageViews)}
						</div>
						<div className="text-sm text-gray-500">일평균 {formatNumber(avgDaily.pageViews)}회</div>
					</div>
				</div>

				{/* Charts Row */}
				<div className="grid grid-cols-1 gap-8 mb-8 lg:grid-cols-2">
					{/* Daily Activity Chart */}
					<div className="p-6 bg-white rounded-lg shadow">
						<h3 className="mb-4 text-lg font-semibold text-gray-900">일별 활동 현황</h3>
						<div className="space-y-4">
							{dailyStats.slice(-5).map((day) => (
								<div key={day.date} className="flex items-center justify-between">
									<div className="w-20 text-sm text-gray-600">{day.date.slice(5)}</div>
									<div className="flex-1 mx-4">
										<div className="flex space-x-2">
											<div className="flex-1 h-2 bg-gray-200 rounded-full">
												<div
													className="h-2 bg-blue-500 rounded-full"
													style={{
														width: `${
															(day.users / Math.max(...dailyStats.map((d) => d.users))) * 100
														}%`,
													}}
												></div>
											</div>
											<div className="flex-1 h-2 bg-gray-200 rounded-full">
												<div
													className="h-2 bg-green-500 rounded-full"
													style={{
														width: `${
															(day.posts / Math.max(...dailyStats.map((d) => d.posts))) * 100
														}%`,
													}}
												></div>
											</div>
											<div className="flex-1 h-2 bg-gray-200 rounded-full">
												<div
													className="h-2 bg-purple-500 rounded-full"
													style={{
														width: `${
															(day.comments / Math.max(...dailyStats.map((d) => d.comments))) * 100
														}%`,
													}}
												></div>
											</div>
										</div>
									</div>
									<div className="w-16 text-sm text-right text-gray-600">{day.users}</div>
								</div>
							))}
						</div>
						<div className="flex justify-center mt-4 space-x-4 text-xs">
							<div className="flex items-center">
								<div className="w-3 h-3 mr-1 bg-blue-500 rounded"></div>사용자
							</div>
							<div className="flex items-center">
								<div className="w-3 h-3 mr-1 bg-green-500 rounded"></div>게시물
							</div>
							<div className="flex items-center">
								<div className="w-3 h-3 mr-1 bg-purple-500 rounded"></div>댓글
							</div>
						</div>
					</div>

					{/* Category Distribution */}
					<div className="p-6 bg-white rounded-lg shadow">
						<h3 className="mb-4 text-lg font-semibold text-gray-900">카테고리별 게시물 분포</h3>
						<div className="space-y-4">
							{postCategories.map((category) => (
								<div key={category.name} className="flex items-center">
									<div className="w-20 text-sm text-gray-600">{category.name}</div>
									<div className="flex-1 mx-4">
										<div className="h-4 bg-gray-200 rounded-full">
											<div
												className={`${category.color} h-4 rounded-full flex items-center justify-end pr-2`}
												style={{ width: `${category.percentage}%` }}
											>
												<span className="text-xs font-medium text-white">
													{category.percentage}%
												</span>
											</div>
										</div>
									</div>
									<div className="w-12 text-sm text-right text-gray-600">{category.count}</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Bottom Row */}
				<div className="grid grid-cols-1 gap-8 xl:grid-cols-3 lg:grid-cols-2">
					{/* Popular Courses */}
					<div className="p-6 bg-white rounded-lg shadow">
						<h3 className="mb-4 text-lg font-semibold text-gray-900">월별 인기 코스 TOP 5</h3>
						<div className="space-y-4">
							{[
								{ id: 1, title: '서울 궁궐 투어', author: '김관광', shares: 45, saves: 38, total: 83 },
								{ id: 2, title: '홍대 카페 투어', author: '이카페', shares: 32, saves: 41, total: 73 },
								{ id: 3, title: '명동 맛집 투어', author: '박맛집', shares: 28, saves: 35, total: 63 },
								{ id: 4, title: '한강 피크닉 코스', author: '최자연', shares: 24, saves: 29, total: 53 },
								{ id: 5, title: '경복궁 문화탐방', author: '정문화', shares: 19, saves: 26, total: 45 },
							].map((course, index) => (
								<div key={course.id} className="flex items-center space-x-4">
									<div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-bold text-white rounded-full bg-gradient-to-r from-orange-500 to-red-500">
										{index + 1}
									</div>
									<div className="flex-1 min-w-0">
										<div className="text-sm font-medium text-gray-900 truncate">{course.title}</div>
										<div className="text-xs text-gray-500">by {course.author}</div>
									</div>
									<div className="flex space-x-2 text-xs text-gray-500">
										<span title="공유">🔗 {course.shares}</span>
										<span title="저장">⭐ {course.saves}</span>
										<span className="font-medium text-orange-600">총 {course.total}</span>
									</div>
								</div>
							))}
						</div>
						<div className="pt-4 mt-4 text-xs text-gray-500 border-t border-gray-200">
							💡 공유 횟수 + 저장 횟수로 인기도를 측정합니다
						</div>
					</div>

					{/* Top Posts */}
					<div className="p-6 bg-white rounded-lg shadow">
						<h3 className="mb-4 text-lg font-semibold text-gray-900">인기 게시물 TOP 5</h3>
						<div className="space-y-4">
							{topPosts.map((post, index) => (
								<div key={post.id} className="flex items-center space-x-4">
									<div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-bold text-white rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
										{index + 1}
									</div>
									<div className="flex-1 min-w-0">
										<div className="text-sm font-medium text-gray-900 truncate">{post.title}</div>
										<div className="text-xs text-gray-500">by {post.author}</div>
									</div>
									<div className="flex space-x-4 text-xs text-gray-500">
										<span>👁 {formatNumber(post.views)}</span>
										<span>❤️ {post.likes}</span>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* User Sources */}
					<div className="p-6 bg-white rounded-lg shadow">
						<h3 className="mb-4 text-lg font-semibold text-gray-900">사용자 유입 경로</h3>
						<div className="space-y-4">
							{userSources.map((source) => (
								<div key={source.name} className="flex items-center">
									<div className="w-16 text-sm text-gray-600">{source.name}</div>
									<div className="flex-1 mx-4">
										<div className="h-4 bg-gray-200 rounded-full">
											<div
												className={`${source.color} h-4 rounded-full flex items-center justify-end pr-2`}
												style={{ width: `${source.percentage}%` }}
											>
												<span className="text-xs font-medium text-white">{source.percentage}%</span>
											</div>
										</div>
									</div>
									<div className="w-12 text-sm text-right text-gray-600">{source.count}</div>
								</div>
							))}
						</div>
						<div className="pt-4 mt-4 border-t border-gray-200">
							<div className="text-sm text-gray-500">
								총 {formatNumber(userSources.reduce((sum, s) => sum + s.count, 0))}명의 사용자
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
