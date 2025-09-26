import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { getMyComments } from '../api/mypage'
import type { MyCommentItem, PaginationQueryDto } from '../api/mypage'

export default function MyCommentsPage() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { isAuthed } = useAuth()
	const [comments, setComments] = useState<MyCommentItem[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		total: 0,
		page: 1,
		limit: 10
	})

	useEffect(() => {
		if (!isAuthed) {
			navigate('/login')
			return
		}
		loadComments()
	}, [isAuthed, navigate, pagination.page])

	const loadComments = async () => {
		try {
			setLoading(true)
			const query: PaginationQueryDto = {
				page: pagination.page,
				limit: pagination.limit
			}
			const data = await getMyComments(query)
			setComments(data.comments)
			setPagination(prev => ({
				...prev,
				total: data.total
			}))
			setError(null)
		} catch (error) {
			setError(t('mypage.messages.failed_to_load_comments'))
		} finally {
			setLoading(false)
		}
	}

	const handleCommentClick = (comment: MyCommentItem) => {
		// 게시물 타입에 따라 다른 경로로 이동
		if (comment.post.postType === 'community') {
			navigate(`/buzz/post/${comment.post.id}`)
		} else if (comment.post.postType === 'trend') {
			navigate(`/buzz/trend/${comment.post.id}`)
		}
	}

	const getPostTypeLabel = (postType: string) => {
		switch (postType) {
			case 'community':
				return 'K-Community'
			case 'trend':
				return 'K-Trend'
			default:
				return '게시글'
		}
	}

	const getPostTypeColor = (postType: string) => {
		switch (postType) {
			case 'community':
				return 'bg-blue-100 text-blue-800'
			case 'trend':
				return 'bg-purple-100 text-purple-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const totalPages = Math.ceil(pagination.total / pagination.limit)

	const handlePageChange = (newPage: number) => {
		setPagination(prev => ({ ...prev, page: newPage }))
	}

	if (loading && comments.length === 0) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">{t('mypage.messages.loading_comments')}</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center">
					<p className="text-red-600 mb-4">{error}</p>
					<button 
						onClick={loadComments} 
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						{t('mypage.buttons.retry')}
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-6xl mx-auto px-6 py-8">
				{/* 헤더 */}
				<div className="mb-8">
					<div className="flex items-center gap-3 mb-4">
						<button
							onClick={() => navigate('/mypage')}
							className="flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
						>
							<svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
						</button>
						<h1 className="text-2xl font-bold text-gray-900">{t('mypage.titles.comments')}</h1>
						<div className="px-3 py-1 bg-orange-500 text-white text-sm font-bold rounded-full">
							K-Buzz
						</div>
					</div>
					<p className="text-gray-600">{t('mypage.descriptions.comments')}</p>
				</div>

				{/* 통계 */}
				<div className="mb-6">
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="flex items-center gap-4">
							<div className="text-center">
								<div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
								<div className="text-sm text-gray-500">전체 댓글</div>
							</div>
							<div className="w-px h-12 bg-gray-200"></div>
							<div className="text-center">
								<div className="text-2xl font-bold text-blue-600">
									{comments.filter(c => c.post.postType === 'community').length}
								</div>
								<div className="text-sm text-gray-500">K-Community</div>
							</div>
							<div className="w-px h-12 bg-gray-200"></div>
							<div className="text-center">
								<div className="text-2xl font-bold text-purple-600">
									{comments.filter(c => c.post.postType === 'trend').length}
								</div>
								<div className="text-sm text-gray-500">K-Trend</div>
							</div>
						</div>
					</div>
				</div>

				{/* 댓글 목록 */}
				{comments.length === 0 ? (
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
						<div className="text-gray-400 mb-4">
							<svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
							</svg>
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">작성한 댓글이 없습니다</h3>
						<p className="text-gray-500 mb-6">K-Buzz에서 다른 사람들과 소통해보세요!</p>
						<button
							onClick={() => navigate('/buzz')}
							className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						>
							댓글 작성하러 가기
						</button>
					</div>
				) : (
					<div className="space-y-4">
						{comments.map((comment) => (
							<div
								key={comment.id}
								className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
								onClick={() => handleCommentClick(comment)}
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-3">
											<span className={`px-2 py-1 text-xs font-medium rounded-full ${getPostTypeColor(comment.post.postType)}`}>
												{getPostTypeLabel(comment.post.postType)}
											</span>
											<div className="flex items-center gap-1 text-xs text-gray-500">
												<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
												</svg>
												<span>댓글</span>
											</div>
										</div>
										
										{/* 원글 정보 */}
										<div className="bg-gray-50 rounded-lg p-3 mb-3">
											<div className="text-xs text-gray-500 mb-1">원글</div>
											<h3 className="text-sm font-medium text-gray-800 line-clamp-1">
												{comment.post.title}
											</h3>
										</div>
										
										{/* 댓글 내용 */}
										<div className="mb-3">
											<p className="text-gray-900 text-sm leading-relaxed">
												{comment.content}
											</p>
										</div>
										
										<div className="flex items-center justify-between text-sm text-gray-500">
											<div className="flex items-center gap-2">
												{comment.author.avatarUrl && (
													<img 
														src={comment.author.avatarUrl} 
														alt={comment.author.name}
														className="w-6 h-6 rounded-full"
													/>
												)}
												<span className="font-medium">{comment.author.name}</span>
											</div>
											<div className="flex items-center gap-4">
												<div className="flex items-center gap-1">
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
													<span>{new Date(comment.createdAt).toLocaleDateString('ko-KR')}</span>
												</div>
												{comment.updatedAt !== comment.createdAt && (
													<div className="flex items-center gap-1 text-xs text-gray-400">
														<span>수정됨</span>
													</div>
												)}
											</div>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}

				{/* 페이지네이션 */}
				{totalPages > 1 && (
					<div className="flex justify-center mt-8">
						<div className="flex items-center gap-2">
							<button
								onClick={() => handlePageChange(pagination.page - 1)}
								disabled={pagination.page === 1}
								className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								이전
							</button>
							
							{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
								const page = i + Math.max(1, pagination.page - 2)
								if (page > totalPages) return null
								
								return (
									<button
										key={page}
										onClick={() => handlePageChange(page)}
										className={`px-3 py-2 rounded-lg border ${
											pagination.page === page
												? 'bg-blue-600 text-white border-blue-600'
												: 'border-gray-200 text-gray-600 hover:bg-gray-50'
										}`}
									>
										{page}
									</button>
								)
							})}
							
							<button
								onClick={() => handlePageChange(pagination.page + 1)}
								disabled={pagination.page === totalPages}
								className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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