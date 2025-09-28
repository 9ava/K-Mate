// src/api/admin.ts

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

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

interface SystemStats {
	totals: {
		users: number
		posts: number
		comments: number
		courses: number
		pageViews: number
	}
	period: {
		users: number
		posts: number
		comments: number
		days: number
	}
	previous: {
		users: number
		posts: number
		comments: number
		pageViews: number
	}
	realtime: {
		activeUsers: number
		onlineAdmins: number
		todayNewUsers: number
		todayNewPosts: number
		todayNewComments: number
		serverStatus: string
		dbConnections: number
		avgResponseTime: string
	}
}

interface TopPost {
	id: number
	title: string
	author: string
	views: number
	likes: number
	comments: number
}

interface TopCourse {
	id: string
	title: string
	author: string
	shares: number
	saves: number
	total: number
}

interface TopContent {
	topPosts: TopPost[]
	topCourses: TopCourse[]
}

interface CategoryResponse {
	postCategories: CategoryStats[]
	courseCategories: CategoryStats[]
}

/**
 * 시스템 통계 조회
 * @param period 조회 기간 ('7days' | '30days' | '3months')
 * @returns 시스템 전체 통계
 */
export async function getSystemStatistics(period?: string): Promise<SystemStats> {
	const params = period ? `?period=${period}` : ''
	const response = await fetch(`${API_BASE}/admin/statistics${params}`, {
		method: 'GET',
		credentials: 'include', // 관리자 권한 확인을 위해 필수
	})

	if (!response.ok) {
		const errorText = await response.text().catch(() => '')
		throw new Error(errorText || `Failed to fetch system statistics: ${response.status}`)
	}

	return response.json()
}

/**
 * 일별 통계 조회
 * @param period 조회 기간 ('7days' | '30days' | '3months')
 * @returns 일별 활동 통계
 */
export async function getDailyStatistics(period?: string): Promise<DailyStats[]> {
	const params = period ? `?period=${period}` : ''
	const response = await fetch(`${API_BASE}/admin/statistics/daily${params}`, {
		method: 'GET',
		credentials: 'include',
	})

	if (!response.ok) {
		const errorText = await response.text().catch(() => '')
		throw new Error(errorText || `Failed to fetch daily statistics: ${response.status}`)
	}

	return response.json()
}

/**
 * 카테고리별 통계 조회
 * @returns 게시물 및 코스 카테고리별 분포
 */
export async function getCategoryStatistics(): Promise<CategoryResponse> {
	const response = await fetch(`${API_BASE}/admin/statistics/categories`, {
		method: 'GET',
		credentials: 'include',
	})

	if (!response.ok) {
		const errorText = await response.text().catch(() => '')
		throw new Error(errorText || `Failed to fetch category statistics: ${response.status}`)
	}

	return response.json()
}

/**
 * 인기 콘텐츠 조회
 * @returns 인기 게시물 및 코스 목록
 */
export async function getTopContent(): Promise<TopContent> {
	const response = await fetch(`${API_BASE}/admin/statistics/top-content`, {
		method: 'GET',
		credentials: 'include',
	})

	if (!response.ok) {
		const errorText = await response.text().catch(() => '')
		throw new Error(errorText || `Failed to fetch top content: ${response.status}`)
	}

	return response.json()
}