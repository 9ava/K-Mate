// src/mocks/api.ts
// Mock API - 백엔드 없이 동작하는 가짜 API

import {
	mockUsers,
	mockPlaces,
	mockPosts,
	mockComments,
	mockBookmarks,
} from './data'
import type { Place, PlaceListResponse, PlaceType } from '../types/place'
import type {
	KBuzzItem,
	KBuzzList,
	PostType,
	PostCategory,
	PostStatus,
} from '../api/kbuzz'
import type { CommentItem, CommentList } from '../api/comments'

// 네트워크 지연 시뮬레이션
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ========== Auth API ==========
export const mockAuthApi = {
	async getMe() {
		await delay(300)
		// Mock에서는 데모 유저로 로그인된 상태
		return { data: mockUsers.user1 }
	},

	async logout() {
		await delay(200)
		return { success: true }
	},
}

// ========== Places API (K-Map) ==========
export const mockPlacesApi = {
	async listPlaces(params: {
		type?: PlaceType
		q?: string
		page?: number
		pageSize?: number
	}): Promise<PlaceListResponse> {
		await delay(400)

		let filtered = [...mockPlaces]

		if (params.type) {
			filtered = filtered.filter((p) => p.type === params.type)
		}

		if (params.q) {
			const query = params.q.toLowerCase()
			filtered = filtered.filter(
				(p) =>
					p.name.toLowerCase().includes(query) ||
					p.address?.toLowerCase().includes(query) ||
					p.description?.toLowerCase().includes(query)
			)
		}

		const page = params.page ?? 1
		const pageSize = params.pageSize ?? 10
		const start = (page - 1) * pageSize
		const items = filtered.slice(start, start + pageSize)

		return {
			items,
			total: filtered.length,
			page,
			pageSize,
			totalPages: Math.ceil(filtered.length / pageSize),
		}
	},

	async getPlaceDetail(googlePlaceId: string): Promise<Place> {
		await delay(300)

		const place = mockPlaces.find((p) => p.googlePlaceId === googlePlaceId)
		if (!place) {
			throw new Error('Place not found')
		}
		return place
	},

	async listMyBookmarks() {
		await delay(300)
		return mockBookmarks
	},

	async addBookmark(_placeId: string) {
		await delay(200)
		return { success: true }
	},

	async removeBookmark(_placeId: string) {
		await delay(200)
		return { success: true }
	},
}

// ========== Posts API (K-Buzz) ==========
export const mockPostsApi = {
	async fetchPosts(params: {
		postType: PostType
		page?: number
		limit?: number
		status?: PostStatus
		category?: Exclude<PostCategory, null>
		search?: string
	}): Promise<KBuzzList> {
		await delay(400)

		let filtered = mockPosts.filter((p) => p.postType === params.postType)

		if (params.status) {
			filtered = filtered.filter((p) => p.status === params.status)
		}

		if (params.category) {
			filtered = filtered.filter((p) => p.category === params.category)
		}

		if (params.search) {
			const query = params.search.toLowerCase()
			filtered = filtered.filter(
				(p) =>
					p.title.toLowerCase().includes(query) ||
					p.content.toLowerCase().includes(query)
			)
		}

		const page = params.page ?? 1
		const limit = params.limit ?? 10
		const start = (page - 1) * limit
		const items = filtered.slice(start, start + limit)

		return {
			items,
			total: filtered.length,
			page,
			totalPages: Math.ceil(filtered.length / limit),
		}
	},

	async fetchPostDetail(id: number | string): Promise<KBuzzItem> {
		await delay(300)

		const post = mockPosts.find((p) => p.id === Number(id))
		if (!post) {
			throw new Error('Post not found')
		}
		// 조회수 증가 시뮬레이션
		return { ...post, viewCount: post.viewCount + 1 }
	},

	async likePost(_id: number | string) {
		await delay(200)
		return { success: true }
	},

	async createPost(input: {
		title: string
		content: string
		postType: PostType
		category?: Exclude<PostCategory, null>
		status?: PostStatus
	}): Promise<KBuzzItem> {
		await delay(300)

		const newPost: KBuzzItem = {
			id: mockPosts.length + 1,
			...input,
			category: input.category ?? null,
			status: input.status ?? 'published',
			viewCount: 0,
			likeCount: 0,
			scrapCount: 0,
			commentCount: 0,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			author: {
				id: mockUsers.user1.id,
				name: mockUsers.user1.name,
				avatarUrl: mockUsers.user1.avatar_url,
				role: mockUsers.user1.role,
			},
			isLiked: false,
		}

		return newPost
	},

	async updatePost(
		id: number | string,
		input: {
			title?: string
			content?: string
			category?: Exclude<PostCategory, null>
			status?: PostStatus
		}
	): Promise<KBuzzItem> {
		await delay(300)

		const post = mockPosts.find((p) => p.id === Number(id))
		if (!post) {
			throw new Error('Post not found')
		}

		return {
			...post,
			...input,
			updatedAt: new Date().toISOString(),
		}
	},

	async deletePost(_id: number | string) {
		await delay(200)
		return { success: true }
	},
}

// ========== Comments API ==========
export const mockCommentsApi = {
	async fetchComments(
		postId: number | string,
		page = 1,
		limit = 10
	): Promise<CommentList> {
		await delay(300)

		const comments = mockComments[Number(postId)] ?? []
		const start = (page - 1) * limit
		const items = comments.slice(start, start + limit)

		return {
			items,
			total: comments.length,
			page,
			limit,
		}
	},

	async createComment(
		_postId: number | string,
		content: string
	): Promise<CommentItem> {
		await delay(300)

		const newComment: CommentItem = {
			id: Date.now(),
			content,
			createdAt: new Date().toISOString(),
			author: {
				id: mockUsers.user1.id,
				name: mockUsers.user1.name,
				avatarUrl: mockUsers.user1.avatar_url,
			},
		}

		return newComment
	},

	async deleteComment(_commentId: number | string) {
		await delay(200)
		return { success: true }
	},
}

// ========== Interactions API ==========
export const mockInteractionsApi = {
	async toggleLike(_targetType: string, _targetId: number | string) {
		await delay(200)
		return { liked: true }
	},

	async toggleScrap(_targetType: string, _targetId: number | string) {
		await delay(200)
		return { scraped: true }
	},
}
