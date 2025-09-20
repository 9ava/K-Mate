// src/api/kbuzz.ts
import { api } from './client'

/** ---------- Types (서버 스키마에 맞춤) ---------- */
export type PostType = 'community' | 'tips' | 'trend'
export type PostStatus = 'published' | 'draft' | 'hidden'
export type PostCategory = 'travel_tip' | 'food_review' | 'cafe_review' | 'general' | null

export type KBuzzItem = {
	id: number
	title: string
	content: string
	postType: PostType
	category: PostCategory
	status: PostStatus
	viewCount: number
	likeCount: number
	scrapCount: number
	commentCount: number
	createdAt: string
	updatedAt: string
	author: {
		id: number
		name: string
		avatarUrl: string | null
		role: string
	}
}

export type KBuzzList = {
	items: KBuzzItem[]
	total: number
	page: number
	totalPages: number
}

type ListParams = {
	postType: PostType
	page?: number
	limit?: number
	status?: PostStatus
	category?: Exclude<PostCategory, null>
	search?: string
}

/** ---------- List / Detail / Like ---------- */

// 목록: GET /posts?postType=&status=&page=&limit=&category=&search=
export async function fetchPosts(params: ListParams): Promise<KBuzzList> {
	const { page = 1, limit = 10, ...rest } = params
	const { data } = await api.get('/posts', { params: { page, limit, ...rest } })
	const posts: KBuzzItem[] = data.data.posts
	const total: number = data.data.total
	return {
		items: posts,
		total,
		page,
		totalPages: Math.max(1, Math.ceil(total / limit)),
	}
}

// 상세: GET /posts/:id
export async function fetchPostDetail(id: number | string): Promise<KBuzzItem> {
	const { data } = await api.get(`/posts/${id}`)
	return data.data as KBuzzItem
}

// 좋아요(토글): POST /posts/buzz/:id/like  (쿠키 인증 필요)
export async function likePost(id: number | string) {
	return api.post(`/posts/buzz/${id}/like`)
}

/** ---------- Create / Update / Delete ---------- */

// 생성: POST /posts  (community는 user/admin, tips/trend는 admin만)
export async function createPost(input: {
	title: string
	content: string
	postType: PostType
	category?: Exclude<PostCategory, null>
	status?: PostStatus
}) {
	const { data } = await api.post('/posts', input)
	return data.data as KBuzzItem
}

// 수정: PUT /posts/:id  (작성자 or admin)
export async function updatePost(
	id: number | string,
	input: {
		title?: string
		content?: string
		category?: Exclude<PostCategory, null>
		status?: PostStatus
	}
) {
	const { data } = await api.put(`/posts/${id}`, input)
	return data.data as KBuzzItem
}

// 삭제: DELETE /posts/:id  (작성자 or admin)
export async function deletePost(id: number | string) {
	await api.delete(`/posts/${id}`)
}

/** ---------- (옵션) K-Buzz 전용 목록 API 사용 시 ----------
 * 서버에 /posts/buzz 가 따로 있으니, 이걸 쓰고 싶을 때 아래 함수 사용하세요.
 * 응답 형태가 다르므로 별도 타입을 둡니다. (필요 없으면 삭제해도 됨)
 */
export type BuzzCard = {
	id: number
	title: string
	content: string
	category: string
	image_url: string | null
	latitude: number | null
	longitude: number | null
	location_name: string | null
	like_count: number
	comment_count: number
	view_count: number
	status: PostStatus
	user_id: number
	user: { id: number; name: string; email: string; avatar_url: string | null }
	created_at: string
	updated_at: string
}

export type BuzzList = {
	items: BuzzCard[]
	total: number
	page: number
	totalPages: number
}

export async function fetchBuzzList(params: {
	category?: 'travel' | 'food' | 'cafe' | 'culture' | 'shopping' | 'nature' | 'activity' | 'other'
	page?: number
	limit?: number
	search?: string
}): Promise<BuzzList> {
	const { page = 1, limit = 10, ...rest } = params
	const { data } = await api.get('/posts/buzz', { params: { page, limit, ...rest } })
	const buzzes: BuzzCard[] = data.buzzes
	const total: number = data.total
	return {
		items: buzzes,
		total,
		page,
		totalPages: Math.max(1, Math.ceil(total / limit)),
	}
}
