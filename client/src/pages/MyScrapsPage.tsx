import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { getMyScraps } from '../api/mypage'
import type { ScrapItem, PaginationQueryDto } from '../api/mypage'

export default function MyScrapsPage() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { isAuthed } = useAuth()
	const [scraps, setScraps] = useState<ScrapItem[]>([])
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
		loadScraps()
	}, [isAuthed, navigate, pagination.page])

	const loadScraps = async () => {
		try {
			setLoading(true)
			const query: PaginationQueryDto = {
				page: pagination.page,
				limit: pagination.limit
			}
			const data = await getMyScraps(query)
			setScraps(data.scraps)
			setPagination(prev => ({
				...prev,
				total: data.total
			}))
			setError(null)
		} catch (error) {
			console.error('스크랩한 글 로드 실패:', error)
			setError(t('mypage.messages.failed_to_load_scraps'))
		} finally {
			setLoading(false)
		}
	}

	const handleScrapClick = (scrap: ScrapItem) => {
		// 게시물 타입에 따라 다른 경로로 이동
		if (scrap.postType === 'community') {
			navigate(`/buzz/post/${scrap.postId}`)
		} else if (scrap.postType === 'trend') {
			navigate(`/buzz/trend/${scrap.postId}`)
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

	if (loading && scraps.length === 0) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">{t('mypage.messages.loading_scraps')}</p>
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
						onClick={loadScraps} 
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						다시 시도
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
						<h1 className="text-2xl font-bold text-gray-900">스크랩한 글</h1>
						<div className="px-3 py-1 bg-orange-500 text-white text-sm font-bold rounded-full">
							K-Buzz
						</div>
					</div>
					<p className="text-gray-600">내가 스크랩한 게시글 목록입니다.</p>
				</div>

				{/* 통계 */}
				<div className="mb-6">
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="flex items-center gap-4">
							<div className="text-center">
								<div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
								<div className="text-sm text-gray-500">전체 스크랩</div>
							</div>
							<div className="w-px h-12 bg-gray-200"></div>
							<div className="text-center">
								<div className="text-2xl font-bold text-blue-600">
									{scraps.filter(s => s.postType === 'community').length}
								</div>
								<div className="text-sm text-gray-500">K-Community</div>
							</div>
							<div className="w-px h-12 bg-gray-200"></div>
							<div className="text-center">
								<div className="text-2xl font-bold text-purple-600">
									{scraps.filter(s => s.postType === 'trend').length}
								</div>
								<div className="text-sm text-gray-500">K-Trend</div>
							</div>
						</div>
					</div>
				</div>

				{/* 스크랩 목록 */}
				{scraps.length === 0 ? (
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
						<div className="text-gray-400 mb-4">
							<svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">스크랩한 글이 없습니다</h3>
						<p className="text-gray-500 mb-6">K-Buzz에서 마음에 드는 글을 스크랩해보세요!</p>
						<button
							onClick={() => navigate('/buzz')}
							className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						>
							글 둘러보기
						</button>
					</div>
				) : (
					<div className="space-y-4">
						{scraps.map((scrap) => (
							<div
								key={scrap.id}
								className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
								onClick={() => handleScrapClick(scrap)}
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-3">
											<span className={`px-2 py-1 text-xs font-medium rounded-full ${getPostTypeColor(scrap.postType)}`}>
												{getPostTypeLabel(scrap.postType)}
											</span>
											{scrap.category && (
												<span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
													{scrap.category}
												</span>
											)}
											<div className="flex items-center gap-1 text-xs text-gray-500">
												<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
												</svg>
												<span>스크랩</span>
											</div>
										</div>
										
										<h2 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
											{scrap.title}
										</h2>
										
										{scrap.content && (
											<p className="text-gray-600 text-sm line-clamp-2 mb-3">
												{scrap.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
											</p>
										)}
										
										<div className="flex items-center justify-between text-sm text-gray-500">
											<div className="flex items-center gap-2">
												{scrap.author.avatarUrl && (
													<img 
														src={scrap.author.avatarUrl} 
														alt={scrap.author.name}
														className="w-6 h-6 rounded-full"
													/>
												)}
												<span className="font-medium">{scrap.author.name}</span>
											</div>
											<div className="flex items-center gap-1">
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												<span>{new Date(scrap.createdAt).toLocaleDateString('ko-KR')}</span>
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