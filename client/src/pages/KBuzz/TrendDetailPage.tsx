// src/pages/KBuzz/TrendDetailPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { fetchPostDetail, updatePost } from '../../api/kbuzz'

type ArticleView = {
	id: number
	title: string
	author: string
	image: string
	content: string
	aboutTitle?: string
	aboutDescription?: string
}

/* ---------- trend 카드용 임시 이미지 (하드코딩) ---------- */
// 🟢 KBuzzPage와 동일하게 ID별 매핑
const TREND_IMAGE_BY_ID: Record<number, string> = {
	38: 'https://s3.amazonaws.com/shecodesio-production/uploads/files/000/076/597/original/gimbap.jpg?1681263447', // Kimbap
	32: 'https://ik.imagekit.io/umhihello/Chuseok/Pages/Hanbok/hanbok-3.jpg?updatedAt=1740718178774', // Hanbok
	31: 'https://softervolumes.com/wp-content/uploads/2021/12/Dorrell-Coffee-6z4-Seoul-2.jpg', // Cafe
	30: 'https://blog.delivered.co.kr/wp-content/uploads/2025/01/featured-2025-drama.jpg', // Webtoons
	3: 'https://ychef.files.bbci.co.uk/1280x720/p0lq9155.jpg', // K-Pop
}

// ✨ 트렌드 카드 이미지 기본값 (없을 때 보이는 플레이스홀더)
const PLACEHOLDERS = [
	'https://picsum.photos/1200/700?blur=1&random=11',
	'https://picsum.photos/1200/700?blur=1&random=12',
	'https://picsum.photos/1200/700?blur=1&random=13',
	'https://picsum.photos/1200/700?blur=1&random=14',
	'https://picsum.photos/1200/700?blur=1&random=15',
]

// ✨ per-post 로컬 확장 필드 저장소 키
const lsKey = (id: number) => `kmate_trend_extra_${id}`

function loadExtras(id: number) {
	try {
		const raw = localStorage.getItem(lsKey(id))
		if (!raw) return {}
		return JSON.parse(raw) as Partial<
			Pick<ArticleView, 'image' | 'aboutTitle' | 'aboutDescription'>
		>
	} catch {
		return {}
	}
}
function saveExtras(
	id: number,
	extras: Partial<Pick<ArticleView, 'image' | 'aboutTitle' | 'aboutDescription'>>
) {
	try {
		localStorage.setItem(lsKey(id), JSON.stringify(extras))
	} catch {}
}

export default function TrendDetailPage() {
	const { id } = useParams()
	const navigate = useNavigate()
	const { isAuthed } = useAuth()
	const numericId = useMemo(() => parseInt(id || '0', 10), [id])

	// 화면에 그릴 아티클 상태
	const [article, setArticle] = useState<ArticleView | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// 좋아요/스크랩(로컬만)
	const [isLiked, setIsLiked] = useState(false)
	const [likeCount, setLikeCount] = useState(12)
	const [isScraped, setIsScraped] = useState(false)

	// ✏️ 수정 모달
	const [editModalOpen, setEditModalOpen] = useState(false)
	const [editDraft, setEditDraft] = useState({
		title: '',
		author: '',
		image: '',
		content: '',
		aboutTitle: '',
		aboutDescription: '',
	})
	const openEdit = () => {
		if (!article) return
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
	const closeEdit = () => {
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

	// 🔄 서버에서 상세 불러오기 + 로컬 확장 필드 합치기
	useEffect(() => {
		let alive = true
		async function run() {
			if (!numericId) return
			setLoading(true)
			setError(null)
			try {
				const data = await fetchPostDetail(numericId)
				if (!alive) return

				const extras = loadExtras(numericId)
				//const fallbackImage = PLACEHOLDERS[numericId % PLACEHOLDERS.length]

				// 하드코딩된 이미지 → 없으면 플레이스홀더
				const fallbackImage =
					TREND_IMAGE_BY_ID[numericId] ?? PLACEHOLDERS[numericId % PLACEHOLDERS.length]

				const mapped: ArticleView = {
					id: data.id,
					title: data.title,
					author: data.author?.name || 'K-Mate',
					content: data.content || '',
					image: extras.image || fallbackImage,
					aboutTitle: extras.aboutTitle || 'About K-Trend',
					aboutDescription:
						extras.aboutDescription ||
						"Curated insights and guides for exploring Korea's latest trends — crafted by the K-Mate team.",
				}

				setArticle(mapped)
			} catch (e: any) {
				setError(e?.message || 'Failed to load article')
			} finally {
				if (alive) setLoading(false)
			}
		}
		run()
		return () => {
			alive = false
		}
	}, [numericId])

	// ESC로 모달 닫기
	useEffect(() => {
		if (!editModalOpen) return
		const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && closeEdit()
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [editModalOpen])

	// ❤️ / ⭐️
	const toggleLike = () => {
		const next = !isLiked
		setIsLiked(next)
		setLikeCount((c) => (next ? c + 1 : Math.max(0, c - 1)))
		// TODO: 서버 반영이 필요하면 연결
	}
	const toggleScrap = () => setIsScraped((v) => !v)

	// ✅ 저장: 서버에는 title / content만 반영, 이미지·ABOUT은 로컬에 저장
	const onSubmitEdit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!article) return
		const title = editDraft.title.trim()
		const content = editDraft.content.trim()
		if (!title) return

		try {
			// 서버 반영
			await updatePost(article.id, { title, content })

			// 프론트 확장 필드 저장
			const extras = {
				image: editDraft.image.trim(),
				aboutTitle: editDraft.aboutTitle.trim(),
				aboutDescription: editDraft.aboutDescription.trim(),
			}
			saveExtras(article.id, extras)

			// 화면 동기화
			setArticle((prev) =>
				prev
					? {
							...prev,
							title,
							content,
							image: extras.image || prev.image,
							aboutTitle: extras.aboutTitle || prev.aboutTitle,
							aboutDescription: extras.aboutDescription || prev.aboutDescription,
					  }
					: prev
			)
			closeEdit()
		} catch (err: any) {
			alert(err?.response?.data?.message ?? '수정에 실패했어요.')
		}
	}

	if (loading) {
		return (
			<div className="px-6 py-10">
				<div className="max-w-6xl mx-auto text-gray-500">불러오는 중…</div>
			</div>
		)
	}
	if (error || !article) {
		return (
			<div className="px-6 py-10">
				<div className="max-w-6xl mx-auto text-red-500">로드 실패: {error || '데이터 없음'}</div>
			</div>
		)
	}

	return (
		<div className="px-6 py-10">
			<div className="max-w-6xl mx-auto">
				{/* 헤더 */}
				<section className="grid items-end gap-8 mb-10 md:mb-14 lg:grid-cols-3">
					<h1 className="text-3xl font-extrabold leading-tight tracking-tight lg:col-span-2 md:text-5xl">
						{article.title}
					</h1>
					<div className="space-y-3 text-sm text-gray-600 md:text-base">
						<p>
							by <span className="font-semibold">{article.author}</span>
						</p>
						{isAuthed && (
							<button
								onClick={openEdit}
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

				{/* 히어로 이미지 + 우측 정보 카드 */}
				<section className="relative mb-16">
					<div className="overflow-hidden border rounded-2xl">
						<img
							src={article.image}
							alt={article.title}
							className="w-full h-[320px] md:h-[440px] object-cover"
						/>
					</div>

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

				{/* 본문 */}
				<section className="mb-10 md:mb-12">
					<div className="max-w-4xl mx-auto">
						<div className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap md:text-xl">
							{article.content}
						</div>
					</div>
				</section>

				{/* 액션 */}
				<div className="flex items-center justify-end gap-3 mt-10">
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

					<button
						onClick={() => setIsScraped((v) => !v)}
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

					<button
						onClick={() => navigate('/buzz')}
						className="px-4 py-2 border rounded-lg hover:bg-gray-50"
					>
						목록
					</button>
				</div>

				{/* ✏️ 수정 모달 */}
				{editModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center">
						<div className="absolute inset-0 bg-black/40" onClick={closeEdit} />
						<div className="relative z-10 w-[92vw] max-w-xl rounded-2xl bg-white shadow-2xl p-5">
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-lg font-semibold">트렌드 아티클 수정</h3>
								<button
									onClick={closeEdit}
									aria-label="close"
									className="w-8 h-8 text-gray-600 border rounded-full hover:bg-gray-50"
								>
									✕
								</button>
							</div>

							<form className="space-y-4" onSubmit={onSubmitEdit}>
								{/* 제목 */}
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

								{/* 작성자 (UI만, 서버 반영X) */}
								<div>
									<label className="block mb-1 text-sm font-medium">작성자 (화면 표시용)</label>
									<input
										type="text"
										value={editDraft.author}
										onChange={(e) => setEditDraft((d) => ({ ...d, author: e.target.value }))}
										placeholder="작성자명을 입력하세요"
										className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
									/>
								</div>

								{/* 이미지 URL (UI만, 서버 반영X) */}
								<div>
									<label className="block mb-1 text-sm font-medium">이미지 URL (화면 표시용)</label>
									<input
										type="url"
										value={editDraft.image}
										onChange={(e) => setEditDraft((d) => ({ ...d, image: e.target.value }))}
										placeholder="https://…"
										className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
									/>
								</div>

								{/* 내용 */}
								<div>
									<label className="block mb-1 text-sm font-medium">내용</label>
									<textarea
										value={editDraft.content}
										onChange={(e) => setEditDraft((d) => ({ ...d, content: e.target.value }))}
										rows={8}
										placeholder="아티클 내용을 입력하세요…"
										className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 resize-y min-h-[200px]"
									/>
									<div className="mt-1 text-xs text-right text-gray-500">
										{editDraft.content.length.toLocaleString()} chars
									</div>
								</div>

								{/* About 섹션 (UI만, 서버 반영X) */}
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

								{/* 미리보기 */}
								{editDraft.image && (
									<div>
										<label className="block mb-1 text-sm font-medium">이미지 미리보기</label>
										<img
											src={editDraft.image}
											alt="preview"
											className="object-cover w-full h-40 border rounded-lg"
											onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
										/>
									</div>
								)}

								<div className="flex items-center justify-end gap-3 pt-2">
									<button
										type="button"
										onClick={closeEdit}
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
