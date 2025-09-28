import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSystemStatistics, getDailyStatistics, getCategoryStatistics, getTopContent } from '../../api/admin'

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
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// State for real data
	const [systemStats, setSystemStats] = useState<any>(null)
	const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
	const [categoryStats, setCategoryStats] = useState<any>(null)
	const [topContent, setTopContent] = useState<any>(null)

	// Load data
	useEffect(() => {
		loadStatistics()
	}, [selectedPeriod])

	const loadStatistics = async () => {
		try {
			setLoading(true)
			setError(null)

			const [systemData, dailyData, categoryData, topData] = await Promise.all([
				getSystemStatistics(selectedPeriod),
				getDailyStatistics(selectedPeriod),
				getCategoryStatistics(),
				getTopContent(),
			])

			setSystemStats(systemData)
			setDailyStats(dailyData)
			setCategoryStats(categoryData)
			setTopContent(topData)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load statistics')
			console.error('Failed to load statistics:', err)
		} finally {
			setLoading(false)
		}
	}

	if (loading) {
		return (
			<div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">통계를 불러오는 중...</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600 mb-4">{error}</p>
					<button
						onClick={loadStatistics}
						className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
					>
						다시 시도
					</button>
				</div>
			</div>
		)
	}

	if (!systemStats || !categoryStats || !topContent) {
		return (
			<div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 flex items-center justify-center">
				<p className="text-gray-600">데이터를 불러올 수 없습니다.</p>
			</div>
		)
	}

	// Calculate totals and averages from real data
	const totalUsers = systemStats.totals.users
	const totalPosts = systemStats.totals.posts
	const totalComments = systemStats.totals.comments
	const totalPageViews = systemStats.totals.pageViews
	const avgDaily = {
		users: dailyStats.length > 0 ? Math.round(systemStats.period.users / dailyStats.length) : 0,
		posts: dailyStats.length > 0 ? Math.round(systemStats.period.posts / dailyStats.length) : 0,
		comments: dailyStats.length > 0 ? Math.round(systemStats.period.comments / dailyStats.length) : 0,
		pageViews: dailyStats.length > 0 ? Math.round(totalPageViews / dailyStats.length) : 0,
	}

	const realtimeStats = systemStats.realtime
	const postCategories = categoryStats.postCategories || []
	const topPosts = topContent.topPosts || []

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

	// Previous period data for growth calculation
	const previousStats = systemStats.previous

	return (
		<div className="min-h-[calc(100vh-3.5rem)] bg-gray-50">
			<div className="px-4 py-8 mx-auto max-w-7xl">
				{/* Header */}
				<div className="relative mb-8">
					<div className="text-center">
						<h1 className="mb-2 text-3xl font-bold text-gray-900">시스템 통계</h1>
						<p className="text-gray-600">사용자 활동 및 시스템 현황을 확인합니다</p>
					</div>
					<div className="absolute top-0 right-0 flex gap-3">
						<select
							value={selectedPeriod}
							onChange={(e) => setSelectedPeriod(e.target.value)}
							className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
							disabled={loading}
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
						<div className="text-center">
							<div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full">
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
							<div className="text-2xl font-bold text-blue-600">{realtimeStats.activeUsers}</div>
							<div className="text-sm text-gray-500">현재 접속자</div>
							<div className="mt-2 text-xs text-gray-400">
								관리자 {realtimeStats.onlineAdmins}명 온라인
							</div>
						</div>
					</div>

					<div className="p-4 bg-white rounded-lg shadow">
						<div className="text-center">
							<div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full">
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
							<div className="text-2xl font-bold text-green-600">
								{realtimeStats.todayNewUsers}
							</div>
							<div className="text-sm text-gray-500">오늘 신규 가입</div>
						</div>
					</div>

					<div className="p-4 bg-white rounded-lg shadow">
						<div className="text-center">
							<div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-full">
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
							<div className={`text-2xl font-bold ${getStatusColor(realtimeStats.serverStatus)}`}>
								{realtimeStats.serverStatus === 'healthy' ? '정상' : '오류'}
							</div>
							<div className="text-sm text-gray-500">서버 상태</div>
							<div className="mt-2 text-xs text-gray-400">
								{realtimeStats.avgResponseTime} 평균 응답시간
							</div>
						</div>
					</div>

					<div className="p-4 bg-white rounded-lg shadow">
						<div className="text-center">
							<div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-orange-100 rounded-full">
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
							<div className="text-2xl font-bold text-orange-600">
								{realtimeStats.dbConnections}
							</div>
							<div className="text-sm text-gray-500">DB 연결</div>
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
							{postCategories.map((category: CategoryStats) => (
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
							{topContent.topCourses && topContent.topCourses.length > 0 ? (
								topContent.topCourses.map((course: any, index: number) => (
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
								))
							) : (
								<div className="text-center text-gray-500 py-8">
									데이터가 없습니다
								</div>
							)}
						</div>
						<div className="pt-4 mt-4 text-xs text-gray-500 border-t border-gray-200">
							💡 공유 횟수 + 저장 횟수로 인기도를 측정합니다
						</div>
					</div>

					{/* Top Posts */}
					<div className="p-6 bg-white rounded-lg shadow">
						<h3 className="mb-4 text-lg font-semibold text-gray-900">인기 게시물 TOP 5</h3>
						<div className="space-y-4">
							{topPosts && topPosts.length > 0 ? (
								topPosts.map((post: any, index: number) => (
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
											<span>💬 {post.comments}</span>
										</div>
									</div>
								))
							) : (
								<div className="text-center text-gray-500 py-8">
									데이터가 없습니다
								</div>
							)}
						</div>
					</div>

					{/* Course Categories */}
					<div className="p-6 bg-white rounded-lg shadow">
						<h3 className="mb-4 text-lg font-semibold text-gray-900">코스 카테고리 분포</h3>
						<div className="space-y-4">
							{categoryStats.courseCategories && categoryStats.courseCategories.length > 0 ? (
								categoryStats.courseCategories.map((category: CategoryStats) => (
									<div key={category.name} className="flex items-center">
										<div className="w-16 text-sm text-gray-600">{category.name}</div>
										<div className="flex-1 mx-4">
											<div className="h-4 bg-gray-200 rounded-full">
												<div
													className={`${category.color} h-4 rounded-full flex items-center justify-end pr-2`}
													style={{ width: `${category.percentage}%` }}
												>
													<span className="text-xs font-medium text-white">{category.percentage}%</span>
												</div>
											</div>
										</div>
										<div className="w-12 text-sm text-right text-gray-600">{category.count}</div>
									</div>
								))
							) : (
								<div className="text-center text-gray-500 py-8">
									데이터가 없습니다
								</div>
							)}
						</div>
						{categoryStats.courseCategories && categoryStats.courseCategories.length > 0 && (
							<div className="pt-4 mt-4 border-t border-gray-200">
								<div className="text-sm text-gray-500">
									총 {formatNumber(categoryStats.courseCategories.reduce((sum: number, c: CategoryStats) => sum + c.count, 0))}개의 코스
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
