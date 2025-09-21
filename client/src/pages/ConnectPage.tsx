import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../features/auth/useAuth'
import { useContentStore } from '../features/content/content.store'

export default function ConnectPage() {
	const { refresh, ready, isAuthed } = useAuth()
	const [activeTab, setActiveTab] = useState<'trend' | 'community'>('community')
	const [filter, setFilter] = useState<'all' | 'posts' | 'comments'>('all')
	const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden' | 'reported'>('all')
	const railRef = useRef<HTMLDivElement>(null)

	// Edit modal state
	const [editModalOpen, setEditModalOpen] = useState(false)
	const [editingArticle, setEditingArticle] = useState<any>(null)
	const [editDraft, setEditDraft] = useState({ title: '', author: '', image: '', content: '', aboutTitle: '', aboutDescription: '' })

	// Create modal state
	const [createModalOpen, setCreateModalOpen] = useState(false)
	const [createDraft, setCreateDraft] = useState({ title: '', author: '', image: '', content: '', aboutTitle: '', aboutDescription: '' })

	// Use shared content store
	const {
		allContent,
		trendArticles,
		updateContentStatus,
		deleteContent,
		addTrendArticle,
		updateTrendArticle,
		deleteTrendArticle
	} = useContentStore()

	// Get all content from store
	const contents = allContent

	useEffect(() => {
		refresh()
	}, [])

	// ESC key handler for modals
	useEffect(() => {
		if (!editModalOpen && !createModalOpen) return
		const onKey = (ev: KeyboardEvent) => {
			if (ev.key === 'Escape') {
				if (editModalOpen) handleEditClose()
				if (createModalOpen) handleCreateClose()
			}
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [editModalOpen, createModalOpen])

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

	const filteredContents = contents.filter(content => {
		const categoryMatch = content.category === activeTab

		const typeMatch = filter === 'all' ||
			(filter === 'posts' && content.type === 'post') ||
			(filter === 'comments' && content.type === 'comment')

		const statusMatch = statusFilter === 'all' || content.status === statusFilter

		return categoryMatch && typeMatch && statusMatch
	})

	const getTabStats = (category: 'trend' | 'community') => {
		const categoryContents = contents.filter(c => c.category === category)
		return {
			total: categoryContents.length,
			active: categoryContents.filter(c => c.status === 'active').length,
			hidden: categoryContents.filter(c => c.status === 'hidden').length,
			reported: categoryContents.filter(c => c.status === 'reported').length
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

	const scrollByCard = (dir: 'left' | 'right') => {
		const rail = railRef.current
		if (!rail) return
		const first = rail.querySelector<HTMLElement>('[data-card]')
		const cardWidth = first ? first.offsetWidth : 240
		rail.scrollBy({
			left: dir === 'left' ? -(cardWidth + 20) : cardWidth + 20,
			behavior: 'smooth',
		})
	}

	// Edit modal handlers
	const handleEditArticle = (article: any) => {
		setEditingArticle(article)
		setEditDraft({
			title: article.title,
			author: article.author,
			image: article.image,
			content: article.content || '',
			aboutTitle: article.aboutTitle || '',
			aboutDescription: article.aboutDescription || ''
		})
		setEditModalOpen(true)
	}

	const handleEditClose = () => {
		setEditModalOpen(false)
		setEditingArticle(null)
		setEditDraft({ title: '', author: '', image: '', content: '', aboutTitle: '', aboutDescription: '' })
	}

	const handleEditSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!editingArticle || !editDraft.title.trim()) return

		updateTrendArticle(editingArticle.id, {
			title: editDraft.title.trim(),
			author: editDraft.author.trim(),
			image: editDraft.image.trim(),
			content: editDraft.content.trim(),
			aboutTitle: editDraft.aboutTitle.trim(),
			aboutDescription: editDraft.aboutDescription.trim()
		})

		handleEditClose()
	}

	const handleDeleteArticle = (article: any) => {
		if (confirm(`"${article.title}" 아티클을 삭제하시겠습니까?`)) {
			deleteTrendArticle(article.id)
		}
	}

	// Create modal handlers
	const handleCreateArticle = () => {
		setCreateDraft({ title: '', author: '', image: '', content: '', aboutTitle: 'About K-Trend', aboutDescription: 'Curated insights and guides for exploring Korea\'s latest trends — crafted by the K-Mate team.' })
		setCreateModalOpen(true)
	}

	const handleCreateClose = () => {
		setCreateModalOpen(false)
		setCreateDraft({ title: '', author: '', image: '', content: '', aboutTitle: '', aboutDescription: '' })
	}

	const handleCreateSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!createDraft.title.trim()) return

		addTrendArticle({
			title: createDraft.title.trim(),
			author: createDraft.author.trim(),
			image: createDraft.image.trim(),
			content: createDraft.content.trim(),
			aboutTitle: createDraft.aboutTitle.trim(),
			aboutDescription: createDraft.aboutDescription.trim()
		})

		handleCreateClose()
	}

	const getStatusBadge = (status: string) => {
		const colors = {
			active: 'bg-green-100 text-green-800',
			hidden: 'bg-yellow-100 text-yellow-800',
			reported: 'bg-red-100 text-red-800'
		}
		const labels = {
			active: '활성',
			hidden: '숨김',
			reported: '신고됨'
		}
		return (
			<span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
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

				{/* 탭 네비게이션 */}
				<div className="mb-6">
					<div className="border-b border-gray-200">
						<nav className="flex -mb-px space-x-8">
							<button
								onClick={() => setActiveTab('trend')}
								className={`py-2 px-1 border-b-2 font-medium text-sm ${
									activeTab === 'trend'
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								K-Trend 아티클 관리
							</button>
							<button
								onClick={() => setActiveTab('community')}
								className={`py-2 px-1 border-b-2 font-medium text-sm ${
									activeTab === 'community'
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}
							>
								K-Community
								<span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
									{getTabStats('community').total}
								</span>
							</button>
						</nav>
					</div>
				</div>

				{/* 필터 섹션 - K-Community에서만 표시 */}
				{activeTab === 'community' && (
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
				)}

				{/* K-Trend 아티클 관리 섹션 - K-Trend 탭에서만 표시 */}
				{activeTab === 'trend' && (
					<div className="p-6 mb-6 bg-white rounded-lg shadow">
						<div className="flex items-center justify-between mb-6">
							<div>
								<h3 className="text-lg font-semibold text-gray-900">트렌드 아티클 관리</h3>
								<p className="mt-1 text-sm text-gray-500">사용자에게 표시되는 트렌드 아티클을 관리합니다</p>
							</div>
							<button
								onClick={handleCreateArticle}
								className="px-4 py-2 text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700"
							>
								새 아티클 추가
							</button>
						</div>

						<div className="relative">
							<button
								aria-label="prev"
								onClick={() => scrollByCard('left')}
								className="absolute z-10 flex items-center justify-center w-10 h-10 -translate-y-1/2 rounded-full shadow left-4 top-1/2 bg-gray-200/90 hover:bg-gray-300"
							>
								‹
							</button>
							<button
								aria-label="next"
								onClick={() => scrollByCard('right')}
								className="absolute z-10 flex items-center justify-center w-10 h-10 -translate-y-1/2 rounded-full shadow right-4 top-1/2 bg-gray-200/90 hover:bg-gray-300"
							>
								›
							</button>

							<div ref={railRef} className="overflow-x-auto no-scrollbar scroll-smooth">
								<div className="flex justify-start gap-5 pb-4">
									{trendArticles.map((article) => (
										<div
											key={article.id}
											data-card
											className="relative shrink-0 w-[240px] rounded-xl overflow-hidden shadow hover:shadow-lg transition group"
										>
											<img
												src={article.image}
												alt={article.title}
												className="object-cover w-full h-40"
											/>
											<div className="flex flex-col justify-end h-24 p-3 text-white bg-gradient-to-b from-gray-800 to-gray-900">
												<h4 className="text-sm font-semibold leading-snug line-clamp-2">
													{article.title}
												</h4>
												<p className="mt-1 text-xs text-gray-300">by {article.author}</p>
											</div>

											{/* 관리 버튼들 */}
											<div className="absolute transition-opacity opacity-0 top-2 right-2 group-hover:opacity-100">
												<button
													title="수정"
													onClick={() => handleEditArticle(article)}
													className="flex items-center justify-center w-8 h-8 mr-1 rounded-full bg-white/90 hover:bg-white"
												>
													<svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
													</svg>
												</button>
											</div>
											<div className="absolute transition-opacity opacity-0 top-2 right-12 group-hover:opacity-100">
												<button
													title="삭제"
													onClick={() => handleDeleteArticle(article)}
													className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/90 hover:bg-red-500"
												>
													<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
													</svg>
												</button>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* 통계 카드 - K-Community에서만 표시 */}
				{activeTab === 'community' && (
					<div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
					<div className="p-4 bg-white rounded-lg shadow">
						<h3 className="text-sm font-medium text-gray-500">전체 콘텐츠</h3>
						<p className="text-2xl font-bold text-gray-900">{getTabStats(activeTab).total}</p>
					</div>
					<div className="p-4 bg-white rounded-lg shadow">
						<h3 className="text-sm font-medium text-gray-500">활성 콘텐츠</h3>
						<p className="text-2xl font-bold text-green-600">{getTabStats(activeTab).active}</p>
					</div>
					<div className="p-4 bg-white rounded-lg shadow">
						<h3 className="text-sm font-medium text-gray-500">숨겨진 콘텐츠</h3>
						<p className="text-2xl font-bold text-yellow-600">{getTabStats(activeTab).hidden}</p>
					</div>
					<div className="p-4 bg-white rounded-lg shadow">
						<h3 className="text-sm font-medium text-gray-500">신고된 콘텐츠</h3>
						<p className="text-2xl font-bold text-red-600">{getTabStats(activeTab).reported}</p>
					</div>
					</div>
				)}

				{/* 콘텐츠 목록 - K-Community에서만 표시 */}
				{activeTab === 'community' && (
				<div className="overflow-hidden bg-white rounded-lg shadow">
					<div className="px-6 py-4 border-b border-gray-200">
						<h2 className="text-lg font-medium text-gray-900">
							K-Community 콘텐츠 목록
						</h2>
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
								{filteredContents.map((content) => (
									<tr key={content.id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<span className={`px-2 py-1 text-xs font-medium rounded-full ${
												content.type === 'post' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
											}`}>
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
												<div className="text-sm text-gray-500 truncate">
													{content.content}
												</div>
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

					{filteredContents.length === 0 && (
						<div className="py-12 text-center">
							<svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							<h3 className="mt-2 text-sm font-medium text-gray-900">콘텐츠가 없습니다</h3>
							<p className="mt-1 text-sm text-gray-500">현재 필터 조건에 맞는 콘텐츠가 없습니다.</p>
						</div>
					)}
				</div>
				)}

				{/* Edit Modal */}
				{editModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center">
						<div className="absolute inset-0 bg-black/40" onClick={handleEditClose} />
						<div className="relative z-10 w-[92vw] max-w-xl rounded-2xl bg-white shadow-2xl p-5">
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-lg font-semibold">트렌드 아티클 수정</h3>
								<button
									onClick={handleEditClose}
									aria-label="close"
									className="w-8 h-8 text-gray-600 border rounded-full hover:bg-gray-50"
								>
									✕
								</button>
							</div>

							<form className="space-y-4" onSubmit={handleEditSubmit}>
								<div>
									<label className="block mb-1 text-sm font-medium">제목</label>
									<input
										type="text"
										value={editDraft.title}
										onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
										placeholder="아티클 제목을 입력하세요"
										className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
										required
									/>
								</div>

								<div>
									<label className="block mb-1 text-sm font-medium">작성자</label>
									<input
										type="text"
										value={editDraft.author}
										onChange={(e) => setEditDraft((d) => ({ ...d, author: e.target.value }))}
										placeholder="작성자명을 입력하세요"
										className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
										required
									/>
								</div>

								<div>
									<label className="block mb-1 text-sm font-medium">이미지 URL</label>
									<input
										type="url"
										value={editDraft.image}
										onChange={(e) => setEditDraft((d) => ({ ...d, image: e.target.value }))}
										placeholder="이미지 URL을 입력하세요"
										className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
										required
									/>
								</div>

								<div>
									<label className="block mb-1 text-sm font-medium">내용</label>
									<textarea
										value={editDraft.content}
										onChange={(e) => setEditDraft((d) => ({ ...d, content: e.target.value }))}
										rows={6}
										placeholder="아티클 내용을 입력하세요..."
										className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
									/>
								</div>

								<div>
									<label className="block mb-1 text-sm font-medium">About 섹션 제목</label>
									<input
										type="text"
										value={editDraft.aboutTitle}
										onChange={(e) => setEditDraft((d) => ({ ...d, aboutTitle: e.target.value }))}
										placeholder="About K-Trend"
										className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
									/>
								</div>

								<div>
									<label className="block mb-1 text-sm font-medium">About 섹션 설명</label>
									<textarea
										value={editDraft.aboutDescription}
										onChange={(e) => setEditDraft((d) => ({ ...d, aboutDescription: e.target.value }))}
										rows={3}
										placeholder="Curated insights and guides for exploring Korea's latest trends — crafted by the K-Mate team."
										className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
									/>
								</div>

								{editDraft.image && (
									<div>
										<label className="block mb-1 text-sm font-medium">미리보기</label>
										<img
											src={editDraft.image}
											alt="미리보기"
											className="object-cover w-full h-32 border rounded-lg"
											onError={(e) => {
												const target = e.target as HTMLImageElement
												target.style.display = 'none'
											}}
										/>
									</div>
								)}

								<div className="flex items-center justify-end gap-3 pt-2">
									<button
										type="button"
										onClick={handleEditClose}
										className="px-4 py-2 border rounded-lg hover:bg-gray-50"
									>
										취소
									</button>
									<button
										type="submit"
										className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
									>
										수정 완료
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* Create Modal */}
				{createModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center">
						<div className="absolute inset-0 bg-black/40" onClick={handleCreateClose} />
						<div className="relative z-10 w-[92vw] max-w-xl rounded-2xl bg-white shadow-2xl p-5">
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-lg font-semibold">새 트렌드 아티클 추가</h3>
								<button
									onClick={handleCreateClose}
									aria-label="close"
									className="w-8 h-8 text-gray-600 border rounded-full hover:bg-gray-50"
								>
									✕
								</button>
							</div>

							<form className="space-y-4" onSubmit={handleCreateSubmit}>
								<div>
									<label className="block mb-1 text-sm font-medium">제목</label>
									<input
										type="text"
										value={createDraft.title}
										onChange={(e) => setCreateDraft((d) => ({ ...d, title: e.target.value }))}
										placeholder="아티클 제목을 입력하세요"
										className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
										required
									/>
								</div>

								<div>
									<label className="block mb-1 text-sm font-medium">작성자</label>
									<input
										type="text"
										value={createDraft.author}
										onChange={(e) => setCreateDraft((d) => ({ ...d, author: e.target.value }))}
										placeholder="작성자명을 입력하세요"
										className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
										required
									/>
								</div>

								<div>
									<label className="block mb-1 text-sm font-medium">이미지 URL</label>
									<input
										type="url"
										value={createDraft.image}
										onChange={(e) => setCreateDraft((d) => ({ ...d, image: e.target.value }))}
										placeholder="이미지 URL을 입력하세요"
										className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
										required
									/>
								</div>

								<div>
									<label className="block mb-1 text-sm font-medium">내용</label>
									<textarea
										value={createDraft.content}
										onChange={(e) => setCreateDraft((d) => ({ ...d, content: e.target.value }))}
										rows={6}
										placeholder="아티클 내용을 입력하세요..."
										className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
									/>
								</div>

								<div>
									<label className="block mb-1 text-sm font-medium">About 섹션 제목</label>
									<input
										type="text"
										value={createDraft.aboutTitle}
										onChange={(e) => setCreateDraft((d) => ({ ...d, aboutTitle: e.target.value }))}
										placeholder="About K-Trend"
										className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
									/>
								</div>

								<div>
									<label className="block mb-1 text-sm font-medium">About 섹션 설명</label>
									<textarea
										value={createDraft.aboutDescription}
										onChange={(e) => setCreateDraft((d) => ({ ...d, aboutDescription: e.target.value }))}
										rows={3}
										placeholder="Curated insights and guides for exploring Korea's latest trends — crafted by the K-Mate team."
										className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
									/>
								</div>

								{createDraft.image && (
									<div>
										<label className="block mb-1 text-sm font-medium">미리보기</label>
										<img
											src={createDraft.image}
											alt="미리보기"
											className="object-cover w-full h-32 border rounded-lg"
											onError={(e) => {
												const target = e.target as HTMLImageElement
												target.style.display = 'none'
											}}
										/>
									</div>
								)}

								<div className="flex items-center justify-end gap-3 pt-2">
									<button
										type="button"
										onClick={handleCreateClose}
										className="px-4 py-2 border rounded-lg hover:bg-gray-50"
									>
										취소
									</button>
									<button
										type="submit"
										className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
									>
										아티클 추가
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}