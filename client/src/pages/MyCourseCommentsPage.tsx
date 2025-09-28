// src/pages/MyCourseCommentsPage.tsx
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getMyCourseComments, type MyCourseCommentItem } from '../api/mypage'

export default function MyCourseCommentsPage() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [comments, setComments] = useState<MyCourseCommentItem[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [page, setPage] = useState(1)
	const [hasMore, setHasMore] = useState(false)

	const loadComments = async (pageNum: number = 1) => {
		try {
			setLoading(true)
			const response = await getMyCourseComments({ page: pageNum, limit: 10 })

			if (pageNum === 1) {
				setComments(response.comments)
			} else {
				setComments(prev => [...prev, ...response.comments])
			}

			setHasMore(pageNum < Math.ceil(response.total / response.limit))
			setPage(pageNum)
		} catch (err) {
			console.error('Failed to load course comments:', err)
			setError('댓글을 불러오는데 실패했습니다.')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadComments()
	}, [])

	const handleLoadMore = () => {
		if (hasMore && !loading) {
			loadComments(page + 1)
		}
	}

	const handleCommentClick = (courseId: string) => {
		navigate(`/kcourse/${courseId}#comments`)
	}

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	if (loading && comments.length === 0) {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="max-w-4xl mx-auto px-4 py-8">
					<div className="flex items-center justify-center py-20">
						<div className="text-center">
							<div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
							<p className="text-gray-600">댓글을 불러오는 중...</p>
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="max-w-4xl mx-auto px-4 py-8">
					<div className="flex items-center justify-center py-20">
						<div className="text-center">
							<p className="mb-4 text-red-600">{error}</p>
							<button
								onClick={() => loadComments()}
								className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
							>
								다시 시도
							</button>
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-4xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">{t('mypage.titles.course_comments')}</h1>
						<p className="mt-1 text-sm text-gray-600">내가 작성한 K-코스 댓글 목록입니다.</p>
					</div>
					<button
						onClick={() => navigate('/mypage')}
						className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
					>
						{t('mypage.buttons.back_to_mypage')}
					</button>
				</div>

				{/* Comments List */}
				{comments.length === 0 ? (
					<div className="bg-white rounded-lg shadow-sm p-8 text-center">
						<div className="text-4xl mb-4">💬</div>
						<div className="text-lg font-semibold text-gray-700 mb-2">
							작성한 K-코스 댓글이 없습니다
						</div>
						<div className="text-sm text-gray-500 mb-6">
							K-코스에서 댓글을 작성해보세요!
						</div>
						<button
							onClick={() => navigate('/kcourse')}
							className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
						>
							K-코스 둘러보기
						</button>
					</div>
				) : (
					<div className="space-y-4">
						{comments.map((comment) => (
							<div
								key={comment.id}
								className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
								onClick={() => handleCommentClick(comment.course.id)}
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										{/* Course Info */}
										<div className="flex items-center gap-2 mb-3">
											<span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
												K-Course
											</span>
											<h3 className="font-semibold text-gray-900 truncate">
												{comment.course.title}
											</h3>
											<span className="text-sm text-gray-500">
												by {comment.course.author.name}
											</span>
										</div>

										{/* Comment Content */}
										<div className="mb-3">
											<p className="text-gray-700 line-clamp-3">
												{comment.content}
											</p>
										</div>

										{/* Meta Info */}
										<div className="flex items-center justify-between text-sm text-gray-500">
											<span>작성일: {formatDate(comment.createdAt)}</span>
											{comment.updatedAt !== comment.createdAt && (
												<span>수정됨</span>
											)}
										</div>
									</div>

									{/* Arrow Icon */}
									<div className="ml-4 flex-shrink-0">
										<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
										</svg>
									</div>
								</div>
							</div>
						))}

						{/* Load More Button */}
						{hasMore && (
							<div className="flex justify-center pt-6">
								<button
									onClick={handleLoadMore}
									disabled={loading}
									className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
								>
									{loading ? '로딩 중...' : '더 보기'}
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	)
}