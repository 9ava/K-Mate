// src/pages/KBuzzPage.tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../features/auth/auth.store'
import { fetchPosts, createPost, type KBuzzList } from '../api/kbuzz'
import { toKstShort } from '../lib/date'
import { toKstFromUtcShort } from '../lib/date'

/* ----------------------- Types ----------------------- */
interface Article {
	id: number
	title: string
	author: string
	image?: string
}

interface Post {
	id: number
	title: string
	author: string
	createdAt: string
	replies: number
	content?: string
	imageUrl?: string
}

/* ---------- trend 카드용 임시 이미지 플레이스홀더 ---------- */
const TREND_PLACEHOLDERS = [
	'https://picsum.photos/800/500?1',
	'https://picsum.photos/800/500?2',
	'https://picsum.photos/800/500?3',
	'https://picsum.photos/800/500?4',
	'https://picsum.photos/800/500?5',
	'https://picsum.photos/800/500?6',
	'https://picsum.photos/800/500?7',
	'https://picsum.photos/800/500?8',
	'https://picsum.photos/800/500?9',
	'https://picsum.photos/800/500?10',
]

/* ---------- trend 카드용 임시 이미지 (하드코딩) ---------- */
// 🟢 각 게시글의 실제 ID에 맞춰 URL을 넣어 주세요.
const TREND_IMAGE_BY_ID: Record<number, string> = {
	38: 'https://s3.amazonaws.com/shecodesio-production/uploads/files/000/076/597/original/gimbap.jpg?1681263447', // Kimbap
	32: 'https://ik.imagekit.io/umhihello/Chuseok/Pages/Hanbok/hanbok-3.jpg?updatedAt=1740718178774', // Hanbok
	31: 'https://softervolumes.com/wp-content/uploads/2021/12/Dorrell-Coffee-6z4-Seoul-2.jpg', // Cafe
	30: 'https://blog.delivered.co.kr/wp-content/uploads/2025/01/featured-2025-drama.jpg', // Webtoons
	3: 'https://ychef.files.bbci.co.uk/1280x720/p0lq9155.jpg', // K-Pop
}

export default function KBuzzPage() {
	const navigate = useNavigate()
	const railRef = useRef<HTMLDivElement>(null)

	// 🔐 인증 스토어
	const user = useAuthStore((s) => s.user)
	const ready = useAuthStore((s) => s.ready)
	const bootstrap = useAuthStore((s) => s.bootstrap)
	const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)

	// 최초 진입 시 세션 동기화
	useEffect(() => {
		if (!ready) bootstrap()
	}, [ready, bootstrap])

	const userDisplayName = user?.name || (user?.email ? user.email.split('@')[0] : '') || 'anonymous'

	/* ---- K-Trend: 서버에서 trend 목록 불러오기 ---- */
	const [articles, setArticles] = useState<Article[]>([])
	const [trendLoading, setTrendLoading] = useState(false)
	useEffect(() => {
		let alive = true
		setTrendLoading(true)
		fetchPosts({ postType: 'trend', status: 'published', page: 1, limit: 10 })
			.then((res) => {
				if (!alive) return

				const mapped = res.items.map((t, idx) => ({
					id: t.id,
					title: t.title,
					author: t.author.name,
					// 발표용: DB에 imageUrl 없어도 내가 넣은 고정 이미지 쓰기
					// 서버가 주는 이미지가 있으면 우선 사용
					image:
						(t as any).imageUrl ??
						// 하드코딩 맵에서 찾아보기
						TREND_IMAGE_BY_ID[t.id] ??
						// 없으면 플레이스홀더
						TREND_PLACEHOLDERS[idx % TREND_PLACEHOLDERS.length],
					//image: (t as any).imageUrl ?? TREND_PLACEHOLDERS[idx % TREND_PLACEHOLDERS.length],
				}))
				setArticles(mapped)
			})
			.finally(() => alive && setTrendLoading(false))
		return () => {
			alive = false
		}
	}, [])

	/* ---- Community: 서버에서 community 목록 + 페이지네이션 ---- */
	const PAGE_SIZE = 5
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [posts, setPosts] = useState<Post[]>([])
	const [commLoading, setCommLoading] = useState(false)

	const loadCommunity = (p: number) => {
		setCommLoading(true)
		fetchPosts({
			postType: 'community',
			status: 'published',
			page: p,
			limit: PAGE_SIZE,
		})
			.then((res: KBuzzList) => {
				// 서버 응답을 화면 리스트 타입에 맞게 매핑
				setPosts(
					res.items.map((it) => ({
						id: it.id,
						title: it.title,
						author: it.author.name,
						createdAt: toKstFromUtcShort(it.createdAt),
						replies: it.commentCount,
					}))
				)
				setTotalPages(res.totalPages)
			})
			.finally(() => setCommLoading(false))
	}

	useEffect(() => {
		loadCommunity(page)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page])

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

	/* ---- 새 글 모달 ---- */
	const [open, setOpen] = useState(false)
	const [draft, setDraft] = useState<{ title: string; content: string }>({
		title: '',
		content: '',
	})

	// 이미지 업로드 UI는 그대로 두되, 서버는 아직 이미지 저장 안 하므로 미리보기만
	const [imageFile, setImageFile] = useState<File | null>(null)
	const [imagePreview, setImagePreview] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const MAX_MB = 5
	const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

	function handlePickClick() {
		fileInputRef.current?.click()
	}
	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0]
		if (!f) return
		if (!ALLOWED.includes(f.type)) {
			alert('이미지는 JPG/PNG/WebP만 업로드할 수 있어요.')
			e.target.value = ''
			return
		}
		if (f.size > MAX_MB * 1024 * 1024) {
			alert(`파일 용량은 최대 ${MAX_MB}MB까지 가능해요.`)
			e.target.value = ''
			return
		}
		setImageFile(f)
		setImagePreview(URL.createObjectURL(f))
	}
	function clearImage() {
		setImageFile(null)
		setImagePreview(null)
		if (fileInputRef.current) fileInputRef.current.value = ''
	}

	const resetDraft = () => {
		setDraft({ title: '', content: '' })
		clearImage()
	}
	const handleCreate = () => {
		if (!user) {
			loginWithGoogle()
			return
		}
		setOpen(true)
	}
	const handleClose = () => {
		setOpen(false)
		resetDraft()
	}

	// 🔗 여기서 실제 DB에 글 생성(community) 호출
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		const title = draft.title.trim()
		const content = draft.content.trim()
		if (!title) return
		if (!user) {
			alert('로그인 후 작성할 수 있어요.')
			return
		}

		try {
			await createPost({
				title,
				content,
				postType: 'community', // 커뮤니티에만 사용자 작성 허용
				status: 'published',
			})
			// 생성 후 현재 페이지 목록 새로 고침
			loadCommunity(page)
			handleClose()
		} catch (err: any) {
			alert(err?.response?.data?.message ?? '작성 실패')
		}
	}

	// ESC로 모달 닫기
	useEffect(() => {
		if (!open) return
		const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && handleClose()
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [open])

	return (
		<div className="p-6 space-y-12">
			{/* ===== K-Trend ===== */}
			<section className="mx-auto max-w-6xl px-10">
				<div className="flex items-center justify-start mb-4">
					<h2 className="text-xl font-semibold text-gray-900 pl-1">K-Trend</h2>
				</div>

				{trendLoading && <div className="px-2 py-6 text-sm text-gray-500">불러오는 중…</div>}
				{!trendLoading && (
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
				)}
			</section>

			{/* ===== K-Community ===== */}
			<section className="mx-auto max-w-6xl px-10">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold text-gray-900 pl-1">K-Community</h2>
					<button
						onClick={handleCreate}
						className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
						disabled={!ready}
						title={!ready ? '로그인 상태 확인 중…' : undefined}
					>
						Create New Post
					</button>
				</div>

				{commLoading && <div className="px-2 py-6 text-sm text-gray-500">불러오는 중…</div>}
				{!commLoading && (
					<>
						<ul className="space-y-3">
							{posts.map((post) => (
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
					</>
				)}
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

							{/* Image (optional) — 현재는 미리보기 전용 */}
							<div className="mt-2">
								<label className="block text-sm font-medium mb-1">Image (optional)</label>

								{!imagePreview ? (
									<div className="rounded-lg border border-dashed px-4 py-6">
										<p className="text-sm text-gray-500 text-left">첨부할 이미지를 선택해 주세요</p>
										<div className="mt-3 flex items-center justify-start gap-3">
											<button
												type="button"
												onClick={handlePickClick}
												className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50 text-left"
											>
												파일 선택
											</button>
											<span className="text-xs text-gray-400">JPG/PNG/WebP · 최대 5MB</span>
										</div>
										<input
											ref={fileInputRef}
											type="file"
											accept="image/png,image/jpeg,image/webp"
											onChange={handleFileChange}
											className="hidden"
										/>
									</div>
								) : (
									<div className="rounded-lg border p-3 flex items-center gap-3">
										<img
											src={imagePreview}
											alt="preview"
											className="h-16 w-16 rounded object-cover border"
										/>
										<div className="flex-1">
											<div className="text-sm font-medium truncate">
												{imageFile?.name ?? '이미지'}
											</div>
											{imageFile && (
												<div className="text-xs text-gray-500">
													{(imageFile.size / 1024 / 1024).toFixed(2)} MB
												</div>
											)}
										</div>
										<button
											type="button"
											onClick={clearImage}
											className="px-2.5 py-1 text-sm rounded border hover:bg-gray-50"
										>
											제거
										</button>
									</div>
								)}
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
									disabled={!user}
									title={!user ? '로그인 후 작성할 수 있어요' : undefined}
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
