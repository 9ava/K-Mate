// src/pages/KBuzzPage.tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../features/auth/auth.store'
import { useContentStore } from '../features/content/content.store'
import { fetchPosts, createPost, type KBuzzList } from '../api/kbuzz'
import { toKmtFromUtcShort } from '../lib/date'
import { uploadToS3, generateCommunityImageKey, validateImageFile } from '../api/s3'
import LoginRequiredModal from '../components/common/LoginRequiredModal'

/* ----------------------- Types ----------------------- */
interface Article {
	id: number
	title: string
	author: string
	image?: string | null
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



export default function KBuzzPage() {
	const navigate = useNavigate()
	const railRef = useRef<HTMLDivElement>(null)

	// 🔐 인증 스토어
	const user = useAuthStore((s) => s.user)
	const ready = useAuthStore((s) => s.ready)
	const bootstrap = useAuthStore((s) => s.bootstrap)

	// 📰 콘텐츠 스토어 (트렌드 아티클용)
	const { trendArticles, loadTrendArticles } = useContentStore()

	// 최초 진입 시 세션 동기화
	useEffect(() => {
		if (!ready) bootstrap()
	}, [ready, bootstrap])


	/* ---- K-Trend: 콘텐츠 스토어에서 순서가 적용된 trend 목록 불러오기 ---- */
	const [trendLoading, setTrendLoading] = useState(false)

	// 트렌드 아티클 로드
	useEffect(() => {
		const loadData = async () => {
			setTrendLoading(true)
			try {
				await loadTrendArticles()
			} catch (error) {
				console.error('Failed to load trend articles:', error)
			} finally {
				setTrendLoading(false)
			}
		}
		loadData()
	}, [loadTrendArticles])

	// 트렌드 아티클을 Article 형태로 매핑 (데이터베이스 이미지만 사용)
	const articles: Article[] = trendArticles.map((article) => ({
		id: article.id,
		title: article.title,
		author: article.author,
		// 데이터베이스에 저장된 이미지만 사용
		image: article.image,
	}))

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
						createdAt: toKmtFromUtcShort(it.createdAt),
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
	const [showLoginModal, setShowLoginModal] = useState(false)
	const [draft, setDraft] = useState<{ title: string; content: string }>({
		title: '',
		content: '',
	})

	// 이미지 업로드 (S3 사용)
	const [imageFile, setImageFile] = useState<File | null>(null)
	const [imagePreview, setImagePreview] = useState<string | null>(null)
	const [imageUrl, setImageUrl] = useState<string | null>(null)
	const [uploading, setUploading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const MAX_MB = 5

	function handlePickClick() {
		fileInputRef.current?.click()
	}
	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0]
		if (!f) return

		const validation = validateImageFile(f, MAX_MB)
		if (!validation.isValid) {
			alert(validation.error)
			e.target.value = ''
			return
		}

		setImageFile(f)
		setImagePreview(URL.createObjectURL(f))
		setImageUrl(null) // Reset uploaded URL
	}
	function clearImage() {
		setImageFile(null)
		setImagePreview(null)
		setImageUrl(null)
		if (fileInputRef.current) fileInputRef.current.value = ''
	}

	const resetDraft = () => {
		setDraft({ title: '', content: '' })
		clearImage()
	}

	// Upload image to S3
	const uploadImageToS3 = async (): Promise<string | null> => {
		if (!imageFile || !user) return null

		try {
			setUploading(true)
			const userId = typeof user.id === 'number' ? user.id : parseInt(user.id as string, 10)
			const key = generateCommunityImageKey(userId, imageFile.name)
			const uploadedUrl = await uploadToS3(imageFile, key)
			setImageUrl(uploadedUrl)
			return uploadedUrl
		} catch (error) {
			console.error('Image upload failed:', error)
			alert('이미지 업로드에 실패했습니다.')
			return null
		} finally {
			setUploading(false)
		}
	}
	const handleCreate = () => {
		if (!user) {
			setShowLoginModal(true)
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
			// Upload image to S3 if present
			let finalImageUrl = imageUrl
			if (imageFile && !finalImageUrl) {
				finalImageUrl = await uploadImageToS3()
				if (!finalImageUrl) return // Upload failed
			}

			// Create post with optional image URL
			const postData: any = {
				title,
				content,
				postType: 'community',
				status: 'published',
			}

			// Add image URL if available
			if (finalImageUrl) {
				postData.imageUrl = finalImageUrl
			}

			await createPost(postData)
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
										className="relative shrink-0 w-[240px] rounded-xl overflow-hidden shadow hover:shadow-lg transition cursor-pointer"
									>
										{article.image ? (
											<img
												src={article.image}
												alt={article.title}
												className="w-full h-40 object-cover cursor-pointer"
											/>
										) : (
											<div className="w-full h-40 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
												<div className="text-center">
													<svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
													</svg>
													<span className="text-xs text-gray-500">K-Trend</span>
												</div>
											</div>
										)}
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
						className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
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
								className="h-8 w-8 rounded-full border text-gray-600 hover:bg-gray-50 cursor-pointer"
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
												className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50 text-left cursor-pointer"
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
									<div className="rounded-lg border p-3">
										<div className="flex items-center gap-3 mb-2">
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
												{imageUrl && (
													<div className="text-xs text-green-600 flex items-center gap-1">
														<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
															<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
														</svg>
														업로드 완료
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
										{!imageUrl && (
											<div className="flex gap-2">
												<button
													type="button"
													onClick={uploadImageToS3}
													disabled={uploading}
													className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
												>
													{uploading ? (
														<>
															<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
																<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
																<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
															</svg>
															업로드 중...
														</>
													) : (
														'S3에 업로드'
													)}
												</button>
												<span className="text-xs text-gray-400 self-center">게시 전 미리 업로드하거나 게시할 때 자동 업로드됩니다</span>
											</div>
										)}
									</div>
								)}
							</div>

							<div className="flex items-center justify-end gap-3 pt-2">
								<button
									type="button"
									onClick={handleClose}
									className="px-4 py-2 rounded-lg border hover:bg-gray-50 cursor-pointer"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
									disabled={!user || uploading}
									title={!user ? '로그인 후 작성할 수 있어요' : uploading ? '업로드 중...' : undefined}
								>
									{uploading && (
										<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
									)}
									{uploading ? 'Uploading...' : 'Post'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* ===== 로그인 필요 모달 ===== */}
			<LoginRequiredModal
				isOpen={showLoginModal}
				onClose={() => setShowLoginModal(false)}
				message="게시글을 작성하려면 로그인이 필요합니다."
			/>
		</div>
	)
}
