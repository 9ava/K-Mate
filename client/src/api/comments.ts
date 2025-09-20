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
