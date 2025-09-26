import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { getMyPosts } from '../api/mypage'
import type { MyPostItem, PaginationQueryDto } from '../api/mypage'

export default function MyPostsPage() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { isAuthed } = useAuth()
	const [posts, setPosts] = useState<MyPostItem[]>([])
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
		loadPosts()
	}, [isAuthed, navigate, pagination.page])

	const loadPosts = async () => {
		try {
			setLoading(true)
			const query: PaginationQueryDto = {
				page: pagination.page,
				limit: pagination.limit
			}
			const data = await getMyPosts(query)
			setPosts(data.posts)
			setPagination(prev => ({
				...prev,
				total: data.total
			}))
			setError(null)
		} catch (error) {
			console.error('내가 쓴 글 로드 실패:', error)
			setError(t('mypage.messages.failed_to_load_posts'))
		} finally {
			setLoading(false)
		}
	}

	const handlePostClick = (post: MyPostItem) => {
		// 게시물 타입에 따라 다른 경로로 이동
		if (post.postType === 'community') {
			navigate(`/buzz/post/${post.id}`)
		} else if (post.postType === 'trend') {
			navigate(`/buzz/trend/${post.id}`)
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

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'published':
				return 'bg-green-100 text-green-800'
			case 'draft':
				return 'bg-yellow-100 text-yellow-800'
			case 'hidden':
				return 'bg-red-100 text-red-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'published':
				return '게시됨'
			case 'draft':
				return '임시저장'
			case 'hidden':
				return '숨김'
			default:
				return status
		}
	}

	const totalPages = Math.ceil(pagination.total / pagination.limit)

	const handlePageChange = (newPage: number) => {
		setPagination(prev => ({ ...prev, page: newPage }))
	}

	if (loading && posts.length === 0) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center">
					<div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
					<p className="text-gray-600">{t('mypage.messages.loading_posts')}</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center">
					<p className="mb-4 text-red-600">{error}</p>
					<button 
						onClick={loadPosts} 
						className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
					>
						{t('mypage.buttons.retry')}
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-6xl px-6 py-8 mx-auto">
				{/* 헤더 */}
				<div className="mb-8">
					<div className="flex items-center gap-3 mb-4">
						<button
							onClick={() => navigate('/mypage')}
							className="flex items-center justify-center w-10 h-10 transition-colors bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
						>
							<svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
						</button>
						<h1 className="text-2xl font-bold text-gray-900">{t('mypage.titles.posts')}</h1>
						<div className="px-3 py-1 text-sm font-bold text-white bg-orange-500 rounded-full">
							K-Buzz
						</div>
					</div>
					<p className="text-gray-600">{t('mypage.descriptions.posts')}</p>
				</div>

				{/* 통계 */}
				<div className="mb-6">
					<div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
						<div className="flex items-center gap-4">
							<div className="text-center">
								<div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
								<div className="text-sm text-gray-500">전체 게시글</div>
							</div>
							<div className="w-px h-12 bg-gray-200"></div>
							<div className="text-center">
								<div className="text-2xl font-bold text-blue-600">
									{posts.filter(p => p.status === 'published').length}
								</div>
								<div className="text-sm text-gray-500">게시된 글</div>
							</div>
							<div className="w-px h-12 bg-gray-200"></div>
							<div className="text-center">
								<div className="text-2xl font-bold text-yellow-600">
									{posts.filter(p => p.status === 'draft').length}
								</div>
								<div className="text-sm text-gray-500">임시저장</div>
							</div>
						</div>
					</div>
				</div>

				{/* 게시글 목록 */}
				{posts.length === 0 ? (
					<div className="p-12 text-center bg-white border border-gray-200 rounded-lg shadow-sm">
						<div className="mb-4 text-gray-400">
							<svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
						<h3 className="mb-2 text-lg font-medium text-gray-900">{t('mypage.messages.no_posts')}</h3>
						<p className="mb-6 text-gray-500">{t('mypage.messages.post_message')}</p>
						<button
							onClick={() => navigate('/buzz')}
							className="px-6 py-3 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
						>
							{t('mypage.buttons.write_post')}
						</button>
					</div>
				) : (
					<div className="space-y-4">
						{posts.map((post) => (
							<div
								key={post.id}
								className="p-6 transition-all duration-200 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:shadow-md"
								onClick={() => handlePostClick(post)}
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-3">
											<span className={`px-2 py-1 text-xs font-medium rounded-full ${getPostTypeColor(post.postType)}`}>
												{getPostTypeLabel(post.postType)}
											</span>
											<span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(post.status)}`}>
												{getStatusLabel(post.status)}
											</span>
											{post.category && (
												<span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
													{post.category}
												</span>
											)}
										</div>
										<h2 className="mb-2 text-lg font-semibold text-gray-900 transition-colors hover:text-blue-600">
											{post.title}
										</h2>
										{post.content && (
											<p className="mb-3 text-sm text-gray-600 line-clamp-2">
												{post.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
											</p>
										)}
										<div className="flex items-center gap-4 text-sm text-gray-500">
											<div className="flex items-center gap-1">
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
												</svg>
												<span>{post.likeCount}</span>
											</div>
											<div className="flex items-center gap-1">
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
												</svg>
												<span>{post.commentCount}</span>
											</div>
											<div className="flex items-center gap-1">
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												<span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
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
								className="px-3 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{t('mypage.buttons.previous')}
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
								className="px-3 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{t('mypage.buttons.next')}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}