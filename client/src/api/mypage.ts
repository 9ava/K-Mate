// MyPage API 클라이언트
import { api } from './client'

// === Types ===
export interface UserActivityStats {
	bookmarkCount: number
	scrapCount: number
	postCount: number
	commentCount: number
	courseCount: number
	savedCourseCount: number
}

export interface UserProfile {
	id: number
	name: string
	email: string
	avatarUrl: string | null
	role: string
	emailVerified: boolean
	createdAt: string
	updatedAt: string
}

export interface PaginationQueryDto {
	page?: number
	limit?: number
}

export interface BookmarkItem {
	id: number
	placeId: string
	name: string
	address: string
	lat: number
	lng: number
	googleMapsUrl: string
	type: string
	photoUrl?: string | null
	createdAt: string
}

export interface ScrapItem {
	id: number
	postId: number
	title: string
	content: string
	postType: string
	category: string
	author: {
		id: number
		name: string
		avatarUrl: string | null
	}
	createdAt: string
}

export interface MyPostItem {
	id: number
	title: string
	content: string
	postType: string
	category: string
	status: string
	likeCount: number
	commentCount: number
	createdAt: string
	updatedAt: string
}

export interface MyCommentItem {
	id: number
	content: string
	post: {
		id: number
		title: string
		postType: string
	}
	author: {
		id: number
		name: string
		avatarUrl: string | null
	}
	createdAt: string
	updatedAt: string
}

export interface MyCourseItem {
	id: string
	title: string
	visibility: string
	author: {
		id: number
		name: string
		avatarUrl: string | null
	}
	createdAt: string
	updatedAt: string
}

export interface SavedCourseItem {
	id: number
	course: {
		id: string
		title: string
		visibility: string
		author: {
			id: number
			name: string
			avatarUrl: string | null
		}
		createdAt: string
		updatedAt: string
	}
	savedAt: string
}

export interface BookmarkListResponseDto {
	bookmarks: BookmarkItem[]
	total: number
	page: number
	limit: number
}

export interface ScrapListResponseDto {
	scraps: ScrapItem[]
	total: number
	page: number
	limit: number
}

export interface MyPostListResponseDto {
	posts: MyPostItem[]
	total: number
	page: number
	limit: number
}

export interface MyCommentListResponseDto {
	comments: MyCommentItem[]
	total: number
	page: number
	limit: number
}

export interface MyCourseListResponseDto {
	courses: MyCourseItem[]
	total: number
	page: number
	limit: number
}

export interface SavedCourseListResponseDto {
	savedCourses: SavedCourseItem[]
	total: number
	page: number
	limit: number
}

// === API Functions ===

/**
 * 사용자 활동 통계 조회
 */
export const getUserActivityStats = async (): Promise<UserActivityStats> => {
	const response = await api.get<{ success: boolean; data: UserActivityStats }>('/mypage/stats')
	return response.data.data
}

/**
 * 사용자 프로필 조회
 */
export const getUserProfile = async (): Promise<UserProfile> => {
	const response = await api.get<{ success: boolean; data: UserProfile }>('/mypage/profile')
	return response.data.data
}

/**
 * 내 북마크 목록 조회
 */
export const getMyBookmarks = async (query?: PaginationQueryDto): Promise<BookmarkListResponseDto> => {
	const params = new URLSearchParams()
	if (query?.page) params.append('page', query.page.toString())
	if (query?.limit) params.append('limit', query.limit.toString())
	
	const response = await api.get<{ success: boolean; data: BookmarkListResponseDto }>(`/mypage/bookmarks?${params}`)
	return response.data.data
}

/**
 * 내 스크랩 목록 조회
 */
export const getMyScraps = async (query?: PaginationQueryDto): Promise<ScrapListResponseDto> => {
	const params = new URLSearchParams()
	if (query?.page) params.append('page', query.page.toString())
	if (query?.limit) params.append('limit', query.limit.toString())
	
	const response = await api.get<{ success: boolean; data: ScrapListResponseDto }>(`/mypage/scraps?${params}`)
	return response.data.data
}

/**
 * 내가 쓴 글 목록 조회
 */
export const getMyPosts = async (query?: PaginationQueryDto): Promise<MyPostListResponseDto> => {
	const params = new URLSearchParams()
	if (query?.page) params.append('page', query.page.toString())
	if (query?.limit) params.append('limit', query.limit.toString())
	
	const response = await api.get<{ success: boolean; data: MyPostListResponseDto }>(`/mypage/posts?${params}`)
	return response.data.data
}

/**
 * 내가 쓴 댓글 목록 조회
 */
export const getMyComments = async (query?: PaginationQueryDto): Promise<MyCommentListResponseDto> => {
	const params = new URLSearchParams()
	if (query?.page) params.append('page', query.page.toString())
	if (query?.limit) params.append('limit', query.limit.toString())
	
	const response = await api.get<{ success: boolean; data: MyCommentListResponseDto }>(`/mypage/comments?${params}`)
	return response.data.data
}

/**
 * 내가 만든 코스 목록 조회
 */
export const getMyCourses = async (query?: PaginationQueryDto): Promise<MyCourseListResponseDto> => {
	const params = new URLSearchParams()
	if (query?.page) params.append('page', query.page.toString())
	if (query?.limit) params.append('limit', query.limit.toString())
	
	const response = await api.get<{ success: boolean; data: MyCourseListResponseDto }>(`/mypage/courses?${params}`)
	return response.data.data
}

/**
 * 저장한 코스 목록 조회
 */
export const getSavedCourses = async (query?: PaginationQueryDto): Promise<SavedCourseListResponseDto> => {
	const params = new URLSearchParams()
	if (query?.page) params.append('page', query.page.toString())
	if (query?.limit) params.append('limit', query.limit.toString())
	
	const response = await api.get<{ success: boolean; data: SavedCourseListResponseDto }>(`/mypage/saved-courses?${params}`)
	return response.data.data
}