import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContentStore } from '../features/content/content.store'

/* ----------------------- Types ----------------------- */

/* ----------------------- Page ----------------------- */
export default function KBuzzPage() {
	const navigate = useNavigate()
	const railRef = useRef<HTMLDivElement>(null)

	// Use shared content store
	const {
		trendArticles,
		allContent,
		addCommunityPost,
		addTrendArticle
	} = useContentStore()

	// Convert store data to component format
	const activeCommunityPosts = allContent.filter(content => content.category === 'community' && content.status === 'active')
	const posts = activeCommunityPosts.map(post => ({
		id: post.id,
		title: post.title || '',
		author: post.author,
		createdAt: post.createdAt,
		replies: post.replies || 0,
		content: post.content
	}))

	/* ---- Pagination ---- */
	const PAGE_SIZE = 5
	const [page, setPage] = useState(1)
	const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE))
	const start = (page - 1) * PAGE_SIZE
	const pagedPosts = posts.slice(start, start + PAGE_SIZE)

	/* ---- 새 글 모달 (Community) ---- */
	const [open, setOpen] = useState(false)
	const [draft, setDraft] = useState<{ title: string; content: string; author: string }>({
		title: '',
		content: '',
		author: 'anonymous',
	})

	/* ---- 새 트렌드 모달 ---- */
	const [trendOpen, setTrendOpen] = useState(false)
	const [trendDraft, setTrendDraft] = useState<{ title: string; content: string; author: string }>({
		title: '',
		content: '',
		author: 'anonymous',
	})

	const resetDraft = () => setDraft({ title: '', content: '', author: 'anonymous' })
	const resetTrendDraft = () => setTrendDraft({ title: '', content: '', author: 'anonymous' })

	const handleCreate = () => setOpen(true)
	const handleClose = () => {
		setOpen(false)
		resetDraft()
	}

	const handleTrendCreate = () => setTrendOpen(true)
	const handleTrendClose = () => {
		setTrendOpen(false)
		resetTrendDraft()
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!draft.title.trim()) return

		// Use the store action to add the post
		addCommunityPost({
			type: 'post',
			title: draft.title.trim(),
			author: draft.author.trim() || 'anonymous',
			content: draft.content.trim(),
		})

		handleClose()
	}

	const handleTrendSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!trendDraft.title.trim()) return

		// Use the store action to add the trend
		addTrendArticle({
			title: trendDraft.title.trim(),
			author: trendDraft.author.trim() || 'anonymous',
			content: trendDraft.content.trim(),
			image: 'https://via.placeholder.com/400x240',
			aboutTitle: 'About K-Trend',
			aboutDescription: "Curated insights and guides for exploring Korea's latest trends — crafted by the K-Mate team."
		})

		handleTrendClose()
	}

	// ESC로 모달 닫기
	useEffect(() => {
		if (!open) return
		const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && handleClose()
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [open])

	useEffect(() => {
		if (!trendOpen) return
		const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && handleTrendClose()
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [trendOpen])

	/* ---- 캐러셀 스크롤 ---- */
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

	return (
		<div className="p-6 space-y-12">
			{/* ===== K-Trend ===== */}
			<section className="max-w-6xl px-10 mx-auto">
				<div className="flex items-center justify-between mb-4">
					<h2 className="pl-1 text-xl font-semibold text-gray-900">K-Trend</h2>
					<button
						onClick={handleTrendCreate}
						className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
					>
						Create New Trend
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
						<div className="flex justify-start gap-5">
							{trendArticles.map((article) => (
								<div
									key={article.id}
									data-card
									onClick={() => navigate(`/buzz/trend/${article.id}`)}
									className="relative shrink-0 w-[240px] rounded-xl overflow-hidden shadow hover:shadow-lg transition cursor-pointer"
								>
									<img
										src={article.image}
										alt={article.title}
										className="object-cover w-full h-40"
									/>
									<div className="flex flex-col justify-end h-24 p-3 text-white bg-gradient-to-b from-gray-800 to-gray-900">
										<h3 className="text-sm font-semibold leading-snug line-clamp-2">
											{article.title}
										</h3>
										<p className="mt-1 text-xs opacity-80">by {article.author}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ===== K-Community ===== */}
			<section className="max-w-6xl px-10 mx-auto">
				<div className="flex items-center justify-between mb-4">
					<h2 className="pl-1 text-xl font-semibold text-gray-900">K-Community</h2>
					<button
						onClick={handleCreate}
						className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
					>
						Create New Post
					</button>
				</div>

				{/* 게시글 리스트 (제목 왼쪽, 메타 오른쪽) */}
				<ul className="space-y-3">
					{pagedPosts.map((post) => (
						<li
							key={post.id}
							className="px-4 py-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
							onClick={() => navigate(`/buzz/post/${post.id}`)}
						>
							<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
								{/* 제목: 왼쪽, 한 줄 말줄임 */}
								<h3 className="font-medium text-base truncate sm:max-w-[60%]">{post.title}</h3>

								{/* 메타: 오른쪽, 한 줄 고정 */}
								<div className="flex-shrink-0 text-xs text-gray-500 whitespace-nowrap">
									<span>{post.author}</span>
									<span className="mx-1.5">·</span>
									<span>{post.createdAt}</span>
									<span className="mx-1.5">·</span>
									<span>{post.replies} replies</span>
								</div>
							</div>
						</li>
					))}
				</ul>

				{/* 페이지네이션 */}
				<nav className="flex items-center justify-center gap-1 pt-4">
					<button
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						className="px-3 border rounded-md h-9 hover:bg-gray-100 disabled:opacity-40"
						disabled={page === 1}
					>
						Prev
					</button>

					{Array.from({ length: totalPages }).map((_, i) => {
						const p = i + 1
						const active = p === page
						return (
							<button
								key={p}
								onClick={() => setPage(p)}
								className={`h-9 w-9 rounded-md border text-sm ${
									active ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-gray-100'
								}`}
							>
								{p}
							</button>
						)
					})}

					<button
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						className="px-3 border rounded-md h-9 hover:bg-gray-100 disabled:opacity-40"
						disabled={page === totalPages}
					>
						Next
					</button>
				</nav>
			</section>

			{/* ===== 새 글 모달 ===== */}
			{open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<div className="absolute inset-0 bg-black/40" onClick={handleClose} />
					<div className="relative z-10 w-[92vw] max-w-xl rounded-2xl bg-white shadow-2xl p-5">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-lg font-semibold">Create New Post</h3>
							<button
								onClick={handleClose}
								aria-label="close"
								className="w-8 h-8 text-gray-600 border rounded-full hover:bg-gray-50"
							>
								✕
							</button>
						</div>

						<form className="space-y-4" onSubmit={handleSubmit}>
							<div>
								<label className="block mb-1 text-sm font-medium">Title</label>
								<input
									type="text"
									value={draft.title}
									onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
									placeholder="Write a short, clear title"
									className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
									required
								/>
							</div>

							<div>
								<label className="block mb-1 text-sm font-medium">Content</label>
								<textarea
									value={draft.content}
									onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
									rows={6}
									placeholder="What do you want to share?"
									className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block mb-1 text-sm font-medium">Author</label>
									<input
										type="text"
										value={draft.author}
										onChange={(e) => setDraft((d) => ({ ...d, author: e.target.value }))}
										className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
										placeholder="your name (optional)"
									/>
								</div>
							</div>

							<div className="flex items-center justify-end gap-3 pt-2">
								<button
									type="button"
									onClick={handleClose}
									className="px-4 py-2 border rounded-lg hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
								>
									Post
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* ===== 새 트렌드 모달 ===== */}
			{trendOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<div className="absolute inset-0 bg-black/40" onClick={handleTrendClose} />
					<div className="relative z-10 w-[92vw] max-w-xl rounded-2xl bg-white shadow-2xl p-5">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-lg font-semibold">Create New Trend Post</h3>
							<button
								onClick={handleTrendClose}
								aria-label="close"
								className="w-8 h-8 text-gray-600 border rounded-full hover:bg-gray-50"
							>
								✕
							</button>
						</div>

						<form className="space-y-4" onSubmit={handleTrendSubmit}>
							<div>
								<label className="block mb-1 text-sm font-medium">Title</label>
								<input
									type="text"
									value={trendDraft.title}
									onChange={(e) => setTrendDraft((d) => ({ ...d, title: e.target.value }))}
									placeholder="Write a compelling trend title"
									className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
									required
								/>
							</div>

							<div>
								<label className="block mb-1 text-sm font-medium">Content</label>
								<textarea
									value={trendDraft.content}
									onChange={(e) => setTrendDraft((d) => ({ ...d, content: e.target.value }))}
									rows={6}
									placeholder="Share your trend analysis, insights, or observations..."
									className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block mb-1 text-sm font-medium">Author</label>
									<input
										type="text"
										value={trendDraft.author}
										onChange={(e) => setTrendDraft((d) => ({ ...d, author: e.target.value }))}
										className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
										placeholder="your name (optional)"
									/>
								</div>
							</div>

							<div className="flex items-center justify-end gap-3 pt-2">
								<button
									type="button"
									onClick={handleTrendClose}
									className="px-4 py-2 border rounded-lg hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
								>
									Post Trend
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

		</div>
	)
}