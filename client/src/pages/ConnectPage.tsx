import { useEffect, useState } from 'react'
import { useAuth } from '../features/auth/useAuth'
import { useContentStore } from '../features/content/content.store'
import { fetchPosts } from '../api/kbuzz'
import { toKmtFromUtcShort } from '../lib/date'

export default function ConnectPage() {
	const { refresh, ready, isAuthed } = useAuth()
	const [filter, setFilter] = useState<'all' | 'posts' | 'comments'>('all')
	const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden' | 'reported'>('all')

	// Real K-Community posts and comments state
	const [communityPosts, setCommunityPosts] = useState<any[]>([])
	const [communityComments, setCommunityComments] = useState<any[]>([])
	const [communityLoading, setCommunityLoading] = useState(false)


	// Use shared content store
	const {
		updateContentStatus,
		deleteContent,
	} = useContentStore()


	// Get all content - use real K-Community data instead of hardcoded store data
	const contents = [...communityPosts, ...communityComments]

	// Load real K-Community posts and comments
	const loadCommunityContent = async () => {
		setCommunityLoading(true)
		try {
			// Load K-Community posts
			const postsResponse = await fetchPosts({
				postType: 'community',
				status: 'published',
				page: 1,
				limit: 100, // Get all community posts
			})

			const posts = postsResponse.items.map((post) => ({
				id: post.id,
				type: 'post',
				category: 'community',
				title: post.title,
				content: post.content,
				author: post.author.name,
				createdAt: toKmtFromUtcShort(post.createdAt),
				status: 'active', // Real posts are published, so we treat them as active
				replies: post.commentCount,
			}))

			setCommunityPosts(posts)

			// TODO: Load K-Community comments when API is available
			// For now, we'll use empty array for comments
			setCommunityComments([])
		} catch (error) {
			console.error('Failed to load community content:', error)
		} finally {
			setCommunityLoading(false)
		}
	}

	useEffect(() => {
		refresh()
		// Load real K-Community content
		loadCommunityContent()
	}, [])


	if (!ready) return <div className="p-6">Loading...</div>

	if (!isAuthed) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
				<div className="text-center">
					<h1 className="mb-2 text-2xl font-bold text-gray-900">접근 권한이 없습니다</h1>
					<p className="text-gray-600">콘텐츠 관리 페이지에 접근하려면 로그인이 필요합니다.</p>
				</div>
			</div>
		)
	}

	const filteredContents = contents.filter((content) => {
		const categoryMatch = content.category === 'community'

		const typeMatch =
			filter === 'all' ||
			(filter === 'posts' && content.type === 'post') ||
			(filter === 'comments' && content.type === 'comment')

		const statusMatch = statusFilter === 'all' || content.status === statusFilter

		return categoryMatch && typeMatch && statusMatch
	})

	const getTabStats = (category: 'trend' | 'community') => {
		const categoryContents = contents.filter((c) => c.category === category)
		return {
			total: categoryContents.length,
			active: categoryContents.filter((c) => c.status === 'active').length,
			hidden: categoryContents.filter((c) => c.status === 'hidden').length,
			reported: categoryContents.filter((c) => c.status === 'reported').length,
		}
	}

	const handleStatusChange = (id: number, newStatus: 'active' | 'hidden' | 'reported') => {
		updateContentStatus(id, newStatus)
	}

	const handleDelete = (id: number) => {
		if (confirm('정말로 이 콘텐츠를 삭제하시겠습니까?')) {
			deleteContent(id)
		}
	}

	const getStatusBadge = (status: string) => {
		const colors = {
			active: 'bg-green-100 text-green-800',
			hidden: 'bg-yellow-100 text-yellow-800',
			reported: 'bg-red-100 text-red-800',
		}
		const labels = {
			active: '활성',
			hidden: '숨김',
			reported: '신고됨',
		}
		return (
			<span
				className={`px-2 py-1 text-xs font-medium rounded-full ${
					colors[status as keyof typeof colors]
				}`}
			>
				{labels[status as keyof typeof labels]}
			</span>
		)
	}

	return (
		<div className="min-h-[calc(100vh-3.5rem)] bg-gray-50">
			<div className="px-4 py-8 mx-auto max-w-7xl">
				<div className="mb-8">
					<h1 className="mb-2 text-3xl font-bold text-gray-900">콘텐츠 관리</h1>
					<p className="text-gray-600">K-Buzz 게시물과 댓글을 관리하고 모니터링할 수 있습니다.</p>
				</div>


				{/* 필터 섹션 */}
				<div className="p-6 mb-6 bg-white rounded-lg shadow">
					<div className="flex flex-wrap gap-4">
							<div>
								<label className="block mb-2 text-sm font-medium text-gray-700">콘텐츠 유형</label>
								<select
									value={filter}
									onChange={(e) => setFilter(e.target.value as any)}
									className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="all">전체</option>
									<option value="posts">게시물</option>
									<option value="comments">댓글</option>
								</select>
							</div>
							<div>
								<label className="block mb-2 text-sm font-medium text-gray-700">상태</label>
								<select
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value as any)}
									className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="all">전체</option>
									<option value="active">활성</option>
									<option value="hidden">숨김</option>
									<option value="reported">신고됨</option>
								</select>
							</div>
						</div>
					</div>

				{/* 통계 카드 */}
				<div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
						<div className="p-4 bg-white rounded-lg shadow">
							<h3 className="text-sm font-medium text-gray-500">전체 콘텐츠</h3>
							<p className="text-2xl font-bold text-gray-900">{getTabStats('community').total}</p>
						</div>
						<div className="p-4 bg-white rounded-lg shadow">
							<h3 className="text-sm font-medium text-gray-500">활성 콘텐츠</h3>
							<p className="text-2xl font-bold text-green-600">{getTabStats('community').active}</p>
						</div>
						<div className="p-4 bg-white rounded-lg shadow">
							<h3 className="text-sm font-medium text-gray-500">숨겨진 콘텐츠</h3>
							<p className="text-2xl font-bold text-yellow-600">{getTabStats('community').hidden}</p>
						</div>
						<div className="p-4 bg-white rounded-lg shadow">
							<h3 className="text-sm font-medium text-gray-500">신고된 콘텐츠</h3>
							<p className="text-2xl font-bold text-red-600">{getTabStats('community').reported}</p>
						</div>
					</div>

				{/* K-Community 콘텐츠 목록 */}
				<div className="overflow-hidden bg-white rounded-lg shadow">
						<div className="px-6 py-4 border-b border-gray-200">
							<h2 className="text-lg font-medium text-gray-900">K-Community 콘텐츠 목록</h2>
						</div>
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
											유형
										</th>
										<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
											제목/내용
										</th>
										<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
											작성자
										</th>
										<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
											작성일
										</th>
										<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
											상태
										</th>
										<th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
											작업
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{communityLoading ? (
										<tr>
											<td colSpan={6} className="px-6 py-12 text-center">
												<div className="flex flex-col items-center">
													<div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
													<p className="mt-2 text-gray-600">K-Community 콘텐츠를 불러오는 중...</p>
												</div>
											</td>
										</tr>
									) : filteredContents.map((content) => (
										<tr key={content.id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap">
												<span
													className={`px-2 py-1 text-xs font-medium rounded-full ${
														content.type === 'post'
															? 'bg-blue-100 text-blue-800'
															: 'bg-purple-100 text-purple-800'
													}`}
												>
													{content.type === 'post' ? '게시물' : '댓글'}
												</span>
											</td>
											<td className="px-6 py-4">
												<div className="max-w-xs">
													{content.title && (
														<div className="mb-1 text-sm font-medium text-gray-900 truncate">
															{content.title}
														</div>
													)}
													<div className="text-sm text-gray-500 truncate">{content.content}</div>
												</div>
											</td>
											<td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
												{content.author}
											</td>
											<td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
												{content.createdAt}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												{getStatusBadge(content.status)}
											</td>
											<td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
												<div className="flex space-x-2">
													<select
														value={content.status}
														onChange={(e) => handleStatusChange(content.id, e.target.value as any)}
														className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
													>
														<option value="active">활성</option>
														<option value="hidden">숨김</option>
														<option value="reported">신고됨</option>
													</select>
													<button
														onClick={() => handleDelete(content.id)}
														className="text-red-600 transition-colors hover:text-red-900"
													>
														삭제
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{!communityLoading && filteredContents.length === 0 && (
							<div className="py-12 text-center">
								<svg
									className="w-12 h-12 mx-auto text-gray-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
								<h3 className="mt-2 text-sm font-medium text-gray-900">콘텐츠가 없습니다</h3>
								<p className="mt-1 text-sm text-gray-500">
									현재 필터 조건에 맞는 콘텐츠가 없습니다.
								</p>
						</div>
					)}
				</div>

			</div>
		</div>
	)
}
