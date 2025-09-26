import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { getMyBookmarks } from '../api/mypage'
import { getPlaceDetail } from '../api/places'
import type { BookmarkItem, PaginationQueryDto } from '../api/mypage'
import type { Place } from '../types/place'

export default function MyBookmarksPage() {
	const navigate = useNavigate()
	const { isAuthed } = useAuth()
	const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
	const [bookmarkPhotos, setBookmarkPhotos] = useState<Record<string, string>>({})
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')
	const [pagination, setPagination] = useState({
		total: 0,
		page: 1,
		limit: 12
	})

	useEffect(() => {
		if (!isAuthed) {
			navigate('/login')
			return
		}
		loadBookmarks()
	}, [isAuthed, navigate, pagination.page])

	const loadBookmarks = async () => {
		try {
			setLoading(true)
			const query: PaginationQueryDto = {
				page: pagination.page,
				limit: pagination.limit
			}
			const data = await getMyBookmarks(query)
			setBookmarks(data.bookmarks)
			setPagination(prev => ({
				...prev,
				total: data.total
			}))

			// 각 북마크의 사진을 가져오기
			const photoPromises = data.bookmarks.map(async (bookmark) => {
				try {
					const placeDetail = await getPlaceDetail(bookmark.placeId)
					return {
						placeId: bookmark.placeId,
						photoUrl: placeDetail.photoUrl || null
					}
				} catch (error) {
					console.warn(`Failed to load photo for ${bookmark.name}:`, error)
					return {
						placeId: bookmark.placeId,
						photoUrl: null
					}
				}
			})

			const photoResults = await Promise.all(photoPromises)
			const photoMap: Record<string, string> = {}
			photoResults.forEach(result => {
				if (result.photoUrl) {
					photoMap[result.placeId] = result.photoUrl
				}
			})
			setBookmarkPhotos(photoMap)

			setError(null)
		} catch (error) {
			console.error('북마크 로드 실패:', error)
			setError('북마크를 불러오는데 실패했습니다.')
		} finally {
			setLoading(false)
		}
	}

	const handleBookmarkClick = (bookmark: BookmarkItem) => {
		// Google Maps URL로 이동
		window.open(bookmark.googleMapsUrl, '_blank')
	}

	const getTypeColor = (type: string) => {
		switch (type) {
			case 'travel':
				return 'bg-blue-100 text-blue-800'
			case 'food':
				return 'bg-red-100 text-red-800'
			case 'cafe':
				return 'bg-yellow-100 text-yellow-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const getTypeLabel = (type: string) => {
		switch (type) {
			case 'travel':
				return '관광지'
			case 'food':
				return '음식점'
			case 'cafe':
				return '카페'
			default:
				return type
		}
	}

	const totalPages = Math.ceil(pagination.total / pagination.limit)

	const handlePageChange = (newPage: number) => {
		setPagination(prev => ({ ...prev, page: newPage }))
	}

	if (loading && bookmarks.length === 0) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">북마크를 불러오는 중...</p>
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
						onClick={loadBookmarks} 
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
			<div className="max-w-7xl mx-auto px-6 py-8">
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
						<h1 className="text-2xl font-bold text-gray-900">북마크한 장소</h1>
						<div className="px-3 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">
							K-Map
						</div>
					</div>
					<p className="text-gray-600">내가 저장한 장소 목록입니다.</p>
				</div>

				{/* 통계 및 뷰 모드 */}
				<div className="flex items-center justify-between mb-6">
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
						<div className="flex items-center gap-4">
							<div className="text-center">
								<div className="text-xl font-bold text-gray-900">{pagination.total}</div>
								<div className="text-sm text-gray-500">전체 장소</div>
							</div>
							<div className="w-px h-8 bg-gray-200"></div>
							<div className="text-center">
								<div className="text-xl font-bold text-blue-600">
									{bookmarks.filter(b => b.type === 'travel').length}
								</div>
								<div className="text-sm text-gray-500">관광지</div>
							</div>
							<div className="w-px h-8 bg-gray-200"></div>
							<div className="text-center">
								<div className="text-xl font-bold text-red-600">
									{bookmarks.filter(b => b.type === 'food').length}
								</div>
								<div className="text-sm text-gray-500">음식점</div>
							</div>
							<div className="w-px h-8 bg-gray-200"></div>
							<div className="text-center">
								<div className="text-xl font-bold text-yellow-600">
									{bookmarks.filter(b => b.type === 'cafe').length}
								</div>
								<div className="text-sm text-gray-500">카페</div>
							</div>
						</div>
					</div>

					{/* 뷰 모드 토글 */}
					<div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
						<button
							onClick={() => setViewMode('grid')}
							className={`p-2 rounded-md transition-colors ${
								viewMode === 'grid'
									? 'bg-blue-600 text-white'
									: 'text-gray-400 hover:text-gray-600'
							}`}
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
							</svg>
						</button>
						<button
							onClick={() => setViewMode('list')}
							className={`p-2 rounded-md transition-colors ${
								viewMode === 'list'
									? 'bg-blue-600 text-white'
									: 'text-gray-400 hover:text-gray-600'
							}`}
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
							</svg>
						</button>
					</div>
				</div>

				{/* 북마크 목록 */}
				{bookmarks.length === 0 ? (
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
						<div className="text-gray-400 mb-4">
							<svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
							</svg>
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">북마크한 장소가 없습니다</h3>
						<p className="text-gray-500 mb-6">K-Map에서 마음에 드는 장소를 북마크해보세요!</p>
						<button
							onClick={() => navigate('/kmap')}
							className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						>
							장소 찾아보기
						</button>
					</div>
				) : viewMode === 'grid' ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{bookmarks.map((bookmark) => (
							<div
								key={bookmark.id}
								className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
								onClick={() => handleBookmarkClick(bookmark)}
							>
								<div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
									<div className="absolute top-4 left-4 z-10">
										<span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(bookmark.type)}`}>
											{getTypeLabel(bookmark.type)}
										</span>
									</div>
									{bookmarkPhotos[bookmark.placeId] ? (
										<img
											src={bookmarkPhotos[bookmark.placeId]}
											alt={bookmark.name}
											className="w-full h-full object-cover"
											onError={(e) => {
												// 이미지 로드 실패 시 기본 아이콘 표시
												const target = e.target as HTMLImageElement
												target.style.display = 'none'
												const parent = target.parentElement
												if (parent) {
													const fallback = parent.querySelector('.fallback-icon') as HTMLElement
													if (fallback) fallback.style.display = 'flex'
												}
											}}
										/>
									) : null}
									<div className={`fallback-icon absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 ${bookmarkPhotos[bookmark.placeId] ? 'hidden' : ''}`}>
										<svg className="w-16 h-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
										</svg>
									</div>
								</div>
								<div className="p-4">
									<h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
										{bookmark.name}
									</h3>
									<p className="text-gray-600 text-sm mb-3 line-clamp-2">
										{bookmark.address}
									</p>
									<div className="flex items-center justify-between text-sm text-gray-500">
										<div className="flex items-center gap-1">
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<span>{new Date(bookmark.createdAt).toLocaleDateString('ko-KR')}</span>
										</div>
										<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
										</svg>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="space-y-4">
						{bookmarks.map((bookmark) => (
							<div
								key={bookmark.id}
								className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
								onClick={() => handleBookmarkClick(bookmark)}
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-3">
											<span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(bookmark.type)}`}>
												{getTypeLabel(bookmark.type)}
											</span>
											<div className="flex items-center gap-1 text-xs text-gray-500">
												<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
												</svg>
												<span>북마크</span>
											</div>
										</div>
										<h2 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
											{bookmark.name}
										</h2>
										<p className="text-gray-600 text-sm mb-3">
											{bookmark.address}
										</p>
										<div className="flex items-center justify-between text-sm text-gray-500">
											<div className="flex items-center gap-4">
												<div className="flex items-center gap-1">
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
													</svg>
													<span>{bookmark.lat.toFixed(4)}, {bookmark.lng.toFixed(4)}</span>
												</div>
											</div>
											<div className="flex items-center gap-1">
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												<span>{new Date(bookmark.createdAt).toLocaleDateString('ko-KR')}</span>
											</div>
										</div>
									</div>
									<div className="ml-4">
										<svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
										</svg>
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