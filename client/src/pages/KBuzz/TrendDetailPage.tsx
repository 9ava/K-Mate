// src/pages/KBuzz/TrendDetailPage.tsx
import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { useContentStore } from '../../features/content/content.store'

export default function TrendDetailPage() {
	const { id } = useParams()
	const navigate = useNavigate()
	const { isAuthed } = useAuth()
	const { trendArticles, updateTrendArticle } = useContentStore()

	// Find the actual article from the store
	const article = useMemo(() => {
		const articleId = parseInt(id || '1', 10)
		return trendArticles.find((a) => a.id === articleId) || trendArticles[0]
	}, [id, trendArticles])

	// Edit modal state
	const [editModalOpen, setEditModalOpen] = useState(false)
	const [editDraft, setEditDraft] = useState({
		title: '',
		author: '',
		image: '',
		content: '',
		aboutTitle: '',
		aboutDescription: '',
	})

	// ▼ 좋아요/스크랩 상태 (초기값은 원하는 숫자로)
	const [isLiked, setIsLiked] = useState(false)
	const [likeCount, setLikeCount] = useState(12)
	const [isScraped, setIsScraped] = useState(false)

	const toggleLike = () => {
		const next = !isLiked
		setIsLiked(next)
		setLikeCount((c) => (next ? c + 1 : Math.max(0, c - 1)))
		// TODO: 서버 반영
	}

	const toggleScrap = () => {
		const next = !isScraped
		setIsScraped(next)
		// TODO: 서버 반영
	}

	// Edit modal handlers
	const handleEdit = () => {
		setEditDraft({
			title: article.title,
			author: article.author,
			image: article.image,
			content: article.content,
			aboutTitle: article.aboutTitle || '',
			aboutDescription: article.aboutDescription || '',
		})
		setEditModalOpen(true)
	}

	const handleEditClose = () => {
		setEditModalOpen(false)
		setEditDraft({
			title: '',
			author: '',
			image: '',
			content: '',
			aboutTitle: '',
			aboutDescription: '',
		})
	}

	const handleEditSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!editDraft.title.trim()) return

		updateTrendArticle(article.id, {
			title: editDraft.title.trim(),
			author: editDraft.author.trim(),
			image: editDraft.image.trim(),
			content: editDraft.content.trim(),
			aboutTitle: editDraft.aboutTitle.trim(),
			aboutDescription: editDraft.aboutDescription.trim(),
		})

		handleEditClose()
	}

	// ESC key handler for edit modal
	useEffect(() => {
		if (!editModalOpen) return
		const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && handleEditClose()
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [editModalOpen])

	return (
		<div className="px-6 py-10">
			<div className="max-w-6xl mx-auto">
				{/* Top section: 큰 헤드라인(좌), 작성자 정보(우) */}
				<section className="grid items-end gap-8 mb-10 md:mb-14 lg:grid-cols-3">
					<h1 className="text-3xl font-extrabold leading-tight tracking-tight lg:col-span-2 md:text-5xl">
						{article.title}
					</h1>
					<div className="space-y-3 text-sm text-gray-600 md:text-base">
						<p>
							by <span className="font-semibold">{article.author}</span>
						</p>
						{/* Admin Edit Button */}
						{isAuthed && (
							<button
								onClick={handleEdit}
								className="inline-flex items-center gap-2 px-3 py-1 text-sm text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
								수정
							</button>
						)}
					</div>
				</section>

				{/* Hero 이미지 + 우측 플로팅 인포 카드 */}
				<section className="relative mb-16">
					<div className="overflow-hidden border rounded-2xl">
						<img
							src={article.image}
							alt={article.title}
							className="w-full h-[320px] md:h-[440px] object-cover"
						/>
					</div>

					{/* 화면 오른쪽 겹쳐지는 작은 카드 (모바일에서는 숨김) */}
					<aside className="absolute hidden md:block right-6 -bottom-10">
						<div className="w-[260px] rounded-2xl bg-white shadow-xl border">
							<div className="p-5">
								<div className="text-xs tracking-wide text-gray-400 uppercase">01</div>
								<div className="mt-3 text-lg font-semibold leading-snug">
									{article.aboutTitle || 'About K-Trend'}
								</div>
								<p className="mt-2 text-sm text-gray-600">
									{article.aboutDescription ||
										"Curated insights and guides for exploring Korea's latest trends — crafted by the K-Mate team."}
								</p>
							</div>
						</div>
					</aside>
				</section>

				{/* Article Content */}
				<section className="mb-10 md:mb-12">
					<div className="max-w-4xl mx-auto">
						<div className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap md:text-xl">
							{article.content}
						</div>
					</div>
				</section>

				{/* 우측 하단 목록 + 액션 버튼들 */}
				<div className="flex items-center justify-end gap-3 mt-10">
					{/* Like */}
					<button
						onClick={toggleLike}
						className="inline-flex items-center gap-2 select-none focus:outline-none"
						aria-pressed={isLiked}
						aria-label={isLiked ? 'Unlike' : 'Like'}
						title="Like"
					>
						<svg
							viewBox="0 0 24 24"
							className={`w-6 h-6 transition-transform active:scale-95 ${
								isLiked ? 'text-rose-500' : 'text-black'
							}`}
							fill={isLiked ? 'currentColor' : 'none'}
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M21 8.25c0-2.485-2.239-4.5-5-4.5-1.747 0-3.298.802-4 2.163C11.298 4.552 9.747 3.75 8 3.75 5.239 3.75 3 5.765 3 8.25c0 7.22 9 11.25 9 11.25s9-4.03 9-11.25z" />
						</svg>
						<span className={`text-sm ${isLiked ? 'font-semibold' : ''}`}>{likeCount}</span>
					</button>

					{/* Scrap */}
					<button
						onClick={toggleScrap}
						className="inline-flex items-center gap-2 select-none focus:outline-none"
						aria-pressed={isScraped}
						aria-label={isScraped ? 'Unsave' : 'Save'}
						title="Save"
					>
						<svg
							viewBox="0 0 24 24"
							className={`w-6 h-6 transition-transform active:scale-95 ${
								isScraped ? 'text-amber-500' : 'text-black'
							}`}
							fill={isScraped ? 'currentColor' : 'none'}
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
						</svg>
						<span className={`text-sm ${isScraped ? 'text-amber-700 font-semibold' : ''}`}>
							{isScraped ? 'Saved' : 'Save'}
						</span>
					</button>

					{/* 목록 버튼 */}
					<button
						onClick={() => navigate('/buzz')}
						className="px-4 py-2 border rounded-lg hover:bg-gray-50"
					>
						목록
					</button>
				</div>

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
										onChange={(e) =>
											setEditDraft((d) => ({ ...d, aboutDescription: e.target.value }))
										}
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
			</div>
		</div>
	)
}
