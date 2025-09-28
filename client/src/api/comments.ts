// client/src/api/comments.ts
import { api } from './client'

export type CommentItem = {
	id: number
	content: string
	createdAt: string
	author: { id: number; name: string; avatarUrl: string | null }
}

export type CommentList = {
	items: CommentItem[]
	total: number
	page: number
	limit: number
}

// 서버 응답 → 프론트 형태로 매핑
function mapOne(row: any): CommentItem {
	return {
		id: row.id,
		content: row.content,
		createdAt: row.createdAt ?? row.created_at,
		author: {
			id: row.user?.id ?? row.author?.id ?? 0,
			name: row.user?.name ?? row.author?.name ?? 'User',
			avatarUrl: row.user?.avatarUrl ?? row.user?.avatar_url ?? row.author?.avatarUrl ?? null,
		},
	}
}

// 목록: GET /comments/post/:postId?page=&limit=
export async function fetchComments(
	postId: number | string,
	page = 1,
	limit = 10
): Promise<CommentList> {
	const { data } = await api.get(`/comments/post/${postId}`, { params: { page, limit } })
	const rows = data?.data?.comments ?? data?.data ?? []
	const total = data?.data?.total ?? rows.length
	return {
		items: rows.map(mapOne),
		total,
		page,
		limit,
	}
}

// 생성: POST /comments/post/:postId  (쿠키 인증 필요)
export async function createComment(
	postId: number | string,
	content: string
): Promise<CommentItem> {
	const { data } = await api.post(`/comments/post/${postId}`, { content })
	return mapOne(data.data)
}

// 삭제: DELETE /comments/:id  (쿠키 인증 필요)
export async function deleteComment(commentId: number | string) {
	await api.delete(`/comments/${commentId}`)
}

// ========== 코스 댓글 API ==========

// 코스 댓글 목록: GET /comments/course/:courseId?page=&limit=
export async function fetchCourseComments(
	courseId: number | string,
	page = 1,
	limit = 10
): Promise<CommentList> {
	const { data } = await api.get(`/comments/course/${courseId}`, { params: { page, limit } })
	const rows = data?.data?.comments ?? data?.data ?? []
	const total = data?.data?.total ?? rows.length
	return {
		items: rows.map(mapOne),
		total,
		page,
		limit,
	}
}

// 코스 댓글 생성: POST /comments/course/:courseId  (쿠키 인증 필요)
export async function createCourseComment(
	courseId: number | string,
	content: string
): Promise<CommentItem> {
	const { data } = await api.post(`/comments/course/${courseId}`, { content })
	return mapOne(data.data)
}

// 댓글 수정: PUT /comments/:id  (쿠키 인증 필요)
export async function updateComment(
	commentId: number | string,
	content: string
): Promise<CommentItem> {
	const { data } = await api.put(`/comments/${commentId}`, { content })
	return mapOne(data.data)
}

// 코스 댓글 수정: PUT /comments/course-comment/:id  (쿠키 인증 필요)
export async function updateCourseComment(
	commentId: number | string,
	content: string
): Promise<CommentItem> {
	const { data } = await api.put(`/comments/course-comment/${commentId}`, { content })
	return mapOne(data.data)
}

// 코스 댓글 삭제: DELETE /comments/course-comment/:id  (쿠키 인증 필요)
export async function deleteCourseComment(commentId: number | string) {
	await api.delete(`/comments/course-comment/${commentId}`)
}
