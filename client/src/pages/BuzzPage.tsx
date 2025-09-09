import { useState, useEffect } from 'react'
import { useAuth } from '../features/auth/useAuth'
import { api } from '../api/client'

// Buzz 타입 정의
interface Buzz {
	id: number
	title: string
	content: string
	category: string
	image_url?: string
	latitude?: number
	longitude?: number
	location_name?: string
	like_count: number
	comment_count: number
	view_count: number
	status: string
	user_id: number
	user: {
		id: number
		name: string
		email: string
		avatar_url?: string
	}
	created_at: string
	updated_at: string
}

// Buzz 목록 응답 타입
interface BuzzListResponse {
	buzzes: Buzz[]
	total: number
	page: number
	limit: number
}

// 카테고리 목록
const CATEGORIES = [
	{ value: '', label: '전체' },
	{ value: 'travel', label: '여행' },
	{ value: 'food', label: '맛집' },
	{ value: 'cafe', label: '카페' },
	{ value: 'culture', label: '문화' },
	{ value: 'shopping', label: '쇼핑' },
	{ value: 'nature', label: '자연' },
	{ value: 'activity', label: '액티비티' },
	{ value: 'other', label: '기타' },
]

export default function BuzzPage() {
	const { isAuthed, user } = useAuth()
	const [buzzes, setBuzzes] = useState<Buzz[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [page, setPage] = useState(1)
	const [total, setTotal] = useState(0)
	const [selectedCategory, setSelectedCategory] = useState('')
	const [searchTerm, setSearchTerm] = useState('')

	// Buzz 목록 조회
	const fetchBuzzes = async (pageNum: number = 1, category: string = '', search: string = '') => {
		try {
			setLoading(true)
			setError(null)

			const params = new URLSearchParams({
				page: pageNum.toString(),
				limit: '10',
			})

			if (category) params.append('category', category)
			if (search) params.append('search', search)

			const response = await api.get<BuzzListResponse>(`/buzz?${params}`)
			setBuzzes(response.data.buzzes)
			setTotal(response.data.total)
			setPage(response.data.page)
		} catch (err) {
			setError('Buzz 목록을 불러오는데 실패했습니다.')
			console.error('Error fetching buzzes:', err)
		} finally {
			setLoading(false)
		}
	}

	// 초기 로드
	useEffect(() => {
		fetchBuzzes()
	}, [])

	// 카테고리 변경
	const handleCategoryChange = (category: string) => {
		setSelectedCategory(category)
		setPage(1)
		fetchBuzzes(1, category, searchTerm)
	}

	// 검색
	const handleSearch = (search: string) => {
		setSearchTerm(search)
		setPage(1)
		fetchBuzzes(1, selectedCategory, search)
	}

	// 페이지 변경
	const handlePageChange = (newPage: number) => {
		setPage(newPage)
		fetchBuzzes(newPage, selectedCategory, searchTerm)
	}

	// 좋아요 토글
	const handleLike = async (buzzId: number) => {
		if (!isAuthed) {
			alert('로그인이 필요합니다.')
			return
		}

		try {
			await api.post(`/buzz/${buzzId}/like`)
			// 목록 새로고침
			fetchBuzzes(page, selectedCategory, searchTerm)
		} catch (err) {
			console.error('Error liking buzz:', err)
		}
	}

	// 날짜 포맷팅
	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		const now = new Date()
		const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

		if (diffInHours < 1) return '방금 전'
		if (diffInHours < 24) return `${diffInHours}시간 전`
		if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}일 전`
		return date.toLocaleDateString('ko-KR')
	}

	// 페이지네이션 계산
	const totalPages = Math.ceil(total / 10)
	const startPage = Math.max(1, page - 2)
	const endPage = Math.min(totalPages, page + 2)

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-4xl mx-auto px-4 py-8">
				{/* 헤더 */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">K-Buzz</h1>
					<p className="text-gray-600">한국의 다양한 매력을 공유해보세요!</p>
				</div>

				{/* 검색 및 필터 */}
				<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
					<div className="flex flex-col md:flex-row gap-4">
						{/* 검색 입력 */}
						<div className="flex-1">
							<input
								type="text"
								placeholder="제목이나 내용으로 검색..."
								value={searchTerm}
								onChange={(e) => handleSearch(e.target.value)}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						{/* 카테고리 선택 */}
						<div className="md:w-48">
							<select
								value={selectedCategory}
								onChange={(e) => handleCategoryChange(e.target.value)}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								{CATEGORIES.map((category) => (
									<option key={category.value} value={category.value}>
										{category.label}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

				{/* 로딩 상태 */}
				{loading && (
					<div className="flex justify-center items-center py-12">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
					</div>
				)}

				{/* 에러 상태 */}
				{error && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
						<p className="text-red-600">{error}</p>
					</div>
				)}

				{/* Buzz 목록 */}
				{!loading && !error && (
					<div className="space-y-6">
						{buzzes.length === 0 ? (
							<div className="text-center py-12">
								<p className="text-gray-500">아직 작성된 Buzz가 없습니다.</p>
							</div>
						) : (
							buzzes.map((buzz) => (
								<div key={buzz.id} className="bg-white rounded-lg shadow-sm p-6">
									{/* 작성자 정보 */}
									<div className="flex items-center mb-4">
										<div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
											{buzz.user.name.charAt(0).toUpperCase()}
										</div>
										<div className="ml-3">
											<p className="font-semibold text-gray-900">{buzz.user.name}</p>
											<p className="text-sm text-gray-500">{formatDate(buzz.created_at)}</p>
										</div>
										<div className="ml-auto">
											<span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
												{CATEGORIES.find(c => c.value === buzz.category)?.label || buzz.category}
											</span>
										</div>
									</div>

									{/* 제목 */}
									<h3 className="text-xl font-semibold text-gray-900 mb-2">{buzz.title}</h3>

									{/* 내용 */}
									<p className="text-gray-700 mb-4 whitespace-pre-wrap">{buzz.content}</p>

									{/* 이미지 */}
									{buzz.image_url && (
										<div className="mb-4">
											<img
												src={buzz.image_url}
												alt={buzz.title}
												className="w-full h-64 object-cover rounded-lg"
											/>
										</div>
									)}

									{/* 위치 정보 */}
									{buzz.location_name && (
										<div className="mb-4">
											<p className="text-sm text-gray-600 flex items-center">
												<span className="mr-1">📍</span>
												{buzz.location_name}
											</p>
										</div>
									)}

									{/* 통계 및 액션 */}
									<div className="flex items-center justify-between pt-4 border-t border-gray-100">
										<div className="flex items-center space-x-6 text-sm text-gray-500">
											<span>👀 {buzz.view_count}</span>
											<span>💬 {buzz.comment_count}</span>
											<button
												onClick={() => handleLike(buzz.id)}
												className="flex items-center space-x-1 hover:text-red-500 transition-colors"
											>
												<span>❤️</span>
												<span>{buzz.like_count}</span>
											</button>
										</div>
									</div>
								</div>
							))
						)}
					</div>
				)}

				{/* 페이지네이션 */}
				{!loading && !error && totalPages > 1 && (
					<div className="flex justify-center items-center space-x-2 mt-8">
						<button
							onClick={() => handlePageChange(page - 1)}
							disabled={page === 1}
							className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							이전
						</button>

						{Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((pageNum) => (
							<button
								key={pageNum}
								onClick={() => handlePageChange(pageNum)}
								className={`px-3 py-2 text-sm font-medium rounded-lg ${
									pageNum === page
										? 'bg-blue-500 text-white'
										: 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
								}`}
							>
								{pageNum}
							</button>
						))}

						<button
							onClick={() => handlePageChange(page + 1)}
							disabled={page === totalPages}
							className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							다음
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
