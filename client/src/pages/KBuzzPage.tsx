import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/* ----------------------- Types ----------------------- */
interface Article {
	id: number
	title: string
	author: string
	image: string
}

interface Post {
	id: number
	title: string
	author: string
	createdAt: string
	replies: number
	content?: string
}

/* ----------------------- Page ----------------------- */
export default function KBuzzPage() {
	const navigate = useNavigate()
	const railRef = useRef<HTMLDivElement>(null)

	/* ---- K-Trend 더미 데이터 ---- */
	const [articles] = useState<Article[]>([
		{
			id: 1,
			title: 'The Beautiful Art of Photomontage with Katrina Yu',
			author: 'Pawel Kadysz',
			image: 'https://picsum.photos/800/500?1',
		},
		{
			id: 2,
			title: '5 things I learned during my year-long photography adventure',
			author: 'Michal Kubalczyk',
			image: 'https://picsum.photos/800/500?2',
		},
		{
			id: 3,
			title: 'How D. Vader project kicked me out of my comfort zone',
			author: 'Pawel Kadysz',
			image: 'https://picsum.photos/800/500?3',
		},
		{
			id: 4,
			title: 'Vacation photos – why you should take fewer of them',
			author: 'Pawel Kadysz',
			image: 'https://picsum.photos/800/500?4',
		},
		{
			id: 5,
			title: 'Street color grading that actually works',
			author: 'Jane Doe',
			image: 'https://picsum.photos/800/500?5',
		},
	])

	/* ---- Community 게시글 ---- */
	const [posts, setPosts] = useState<Post[]>([
		{
			id: 1,
			title: 'Photo correlations',
			author: 'Marta Tomaszewska',
			createdAt: '3 hours ago',
			replies: 26,
		},
		{
			id: 2,
			title: 'The only thing worse than being a GWoC is being a GWoC: Guy Without a Camera',
			author: 'ponzu',
			createdAt: '3 hours ago',
			replies: 26,
		},
		{
			id: 3,
			title: 'Lightroom - Server NAS',
			author: 'Tomasz Fiema',
			createdAt: '3 hours ago',
			replies: 26,
		},
		{
			id: 4,
			title: 'Community UX 개선 아이디어',
			author: '지영',
			createdAt: '1 hour ago',
			replies: 3,
		},
		{
			id: 5,
			title: 'Next.js vs Vite 경험담',
			author: '익명',
			createdAt: '30 mins ago',
			replies: 5,
		},
		{
			id: 6,
			title: '오늘의 사진 공유해요 📸',
			author: '민수',
			createdAt: '10 mins ago',
			replies: 2,
		},
	])

	/* ---- Pagination ---- */
	const PAGE_SIZE = 5
	const [page, setPage] = useState(1)
	const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE))
	const start = (page - 1) * PAGE_SIZE
	const pagedPosts = posts.slice(start, start + PAGE_SIZE)

	/* ---- 새 글 모달 ---- */
	const [open, setOpen] = useState(false)
	const [draft, setDraft] = useState<{ title: string; content: string; author: string }>({
		title: '',
		content: '',
		author: 'anonymous',
	})

	const resetDraft = () => setDraft({ title: '', content: '', author: 'anonymous' })
	const handleCreate = () => setOpen(true)
	const handleClose = () => {
		setOpen(false)
		resetDraft()
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!draft.title.trim()) return

		const newPost: Post = {
			id: Date.now(),
			title: draft.title.trim(),
			author: draft.author.trim() || 'anonymous',
			createdAt: 'just now',
			replies: 0,
			content: draft.content.trim(),
		}
		setPosts((prev) => [newPost, ...prev])
		handleClose()
	}

	// ESC로 모달 닫기
	useEffect(() => {
		if (!open) return
		const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && handleClose()
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [open])

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
			<section className="mx-auto max-w-6xl px-10">
				<div className="flex items-center justify-start mb-4">
					<h2 className="text-xl font-semibold text-gray-900 pl-1">K-Trend</h2>
				</div>

				<div className="relative">
					<button
						aria-label="prev"
						onClick={() => scrollByCard('left')}
						className="flex items-center justify-center absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-gray-200/90 hover:bg-gray-300 shadow z-10"
					>
						‹
					</button>
					<button
						aria-label="next"
						onClick={() => scrollByCard('right')}
						className="flex items-center justify-center absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-gray-200/90 hover:bg-gray-300 shadow z-10"
					>
						›
					</button>

					<div ref={railRef} className="overflow-x-auto no-scrollbar scroll-smooth">
						<div className="flex gap-5 justify-start">
							{articles.map((article) => (
								<div
									key={article.id}
									data-card
									onClick={() => navigate(`/buzz/trend/${article.id}`)}
									className="relative shrink-0 w-[240px] rounded-xl overflow-hidden shadow hover:shadow-lg transition"
								>
									<img
										src={article.image}
										alt={article.title}
										className="w-full h-40 object-cover"
									/>
									<div className="p-3 bg-gradient-to-b from-gray-800 to-gray-900 text-white h-24 flex flex-col justify-end">
										<h3 className="font-semibold text-sm leading-snug line-clamp-2">
											{article.title}
										</h3>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ===== K-Community ===== */}
			<section className="mx-auto max-w-6xl px-10">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold text-gray-900 pl-1">K-Community</h2>
					<button
						onClick={handleCreate}
						className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
					>
						Create New Post
					</button>
				</div>

				{/* 게시글 리스트 (제목 왼쪽, 메타 오른쪽) */}
				<ul className="space-y-3">
					{pagedPosts.map((post) => (
						<li
							key={post.id}
							className="py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
							onClick={() => navigate(`/buzz/post/${post.id}`)}
						>
							<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
								{/* 제목: 왼쪽, 한 줄 말줄임 */}
								<h3 className="font-medium text-base truncate sm:max-w-[60%]">{post.title}</h3>

								{/* 메타: 오른쪽, 한 줄 고정 */}
								<div className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">
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
						className="h-9 px-3 rounded-md border hover:bg-gray-100 disabled:opacity-40"
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
						className="h-9 px-3 rounded-md border hover:bg-gray-100 disabled:opacity-40"
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
								className="h-8 w-8 rounded-full border text-gray-600 hover:bg-gray-50"
							>
								✕
							</button>
						</div>

						<form className="space-y-4" onSubmit={handleSubmit}>
							<div>
								<label className="block text-sm font-medium mb-1">Title</label>
								<input
									type="text"
									value={draft.title}
									onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
									placeholder="Write a short, clear title"
									className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1">Content</label>
								<textarea
									value={draft.content}
									onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
									rows={6}
									placeholder="What do you want to share?"
									className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block text-sm font-medium mb-1">Author</label>
									<input
										type="text"
										value={draft.author}
										onChange={(e) => setDraft((d) => ({ ...d, author: e.target.value }))}
										className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
										placeholder="your name (optional)"
									/>
								</div>
							</div>

							<div className="flex items-center justify-end gap-3 pt-2">
								<button
									type="button"
									onClick={handleClose}
									className="px-4 py-2 rounded-lg border hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
								>
									Post
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}
