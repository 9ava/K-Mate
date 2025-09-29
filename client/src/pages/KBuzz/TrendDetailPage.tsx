// src/pages/KBuzz/TrendDetailPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { fetchPostDetail, updatePost } from '../../api/kbuzz'
import { uploadToS3, generateTrendImageKey, validateImageFile } from '../../api/s3'

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

	// S3 이미지 업로드
	const [imageFile, setImageFile] = useState<File | null>(null)
	const [imagePreview, setImagePreview] = useState<string | null>(null)
	const [uploading, setUploading] = useState(false)
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
		// Reset upload states but keep existing image
		setImageFile(null)
		setImagePreview(null)
		setUploading(false)
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
		// Reset image upload states
		setImageFile(null)
		setImagePreview(null)
		setUploading(false)
	}

	// 이미지 파일 선택 처리
	const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		const validation = validateImageFile(file, 5)
		if (!validation.isValid) {
			alert(validation.error)
			e.target.value = ''
			return
		}

		setImageFile(file)
		setImagePreview(URL.createObjectURL(file))
	}


	// 이미지 선택 초기화
	const clearImageSelection = () => {
		setImageFile(null)
		setImagePreview(null)
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
					image: data.imageUrl || extras.image || fallbackImage,
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

	// ✅ 저장: 자동으로 이미지 업로드 후 서버에 반영
	const onSubmitEdit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!article) return
		const title = editDraft.title.trim()
		const content = editDraft.content.trim()
		if (!title) return

		try {
			let finalImageUrl = editDraft.image.trim()

			// 새 이미지 파일이 선택된 경우 자동으로 S3에 업로드
			if (imageFile) {
				setUploading(true)
				try {
					const key = generateTrendImageKey(article.id, imageFile.name)
					const uploadedUrl = await uploadToS3(imageFile, key)
					finalImageUrl = uploadedUrl
				} catch (error) {
					console.error('Image upload failed:', error)
					alert('이미지 업로드에 실패했습니다.')
					setUploading(false)
					return
				} finally {
					setUploading(false)
				}
			}

			// 서버에 title, content, imageUrl 반영 (빈 문자열이면 null로 설정)
			const serverImageUrl = finalImageUrl === '' ? null : finalImageUrl
			await updatePost(article.id, { title, content, imageUrl: serverImageUrl })

			// 프론트 확장 필드 저장
			const extras = {
				image: finalImageUrl,
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
							image: finalImageUrl || prev.image,
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

				{/* 히어로 이미지 */}
				<section className="relative mb-16">
					<div className="overflow-hidden border rounded-2xl">
						{article.image ? (
							<img
								src={article.image}
								alt={article.title}
								className="w-full h-[320px] md:h-[440px] object-cover"
							/>
						) : (
							<div className="w-full h-[320px] md:h-[440px] bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
								<div className="text-center">
									<svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									<p className="text-gray-400 text-sm">K-Trend Content</p>
								</div>
							</div>
						)}
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

				{/* 본문 텍스트 */}
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

					<button
						onClick={() => navigate('/buzz')}
						className="px-4 py-2 border rounded-lg hover:bg-gray-50"
					>
						목록
					</button>
				</div>

				{/* ✏️ 수정 모달 */}
				{editModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
						<div className="absolute inset-0 bg-black/40" onClick={closeEdit} />
						<div className="relative z-10 w-full max-w-xl max-h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col">
							<div className="flex items-center justify-between p-5 border-b">
								<h3 className="text-lg font-semibold">트렌드 아티클 수정</h3>
								<button
									onClick={closeEdit}
									aria-label="close"
									className="w-8 h-8 text-gray-600 border rounded-full hover:bg-gray-50"
								>
									✕
								</button>
							</div>

							<div className="flex-1 p-5 overflow-y-auto">
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

								{/* 이미지 업로드 (S3) */}
								<div>
									<label className="block mb-1 text-sm font-medium">이미지</label>

									{/* 현재 이미지 URL 입력 */}
									<div className="mb-3">
										<input
											type="url"
											value={editDraft.image}
											onChange={(e) => setEditDraft((d) => ({ ...d, image: e.target.value }))}
											placeholder="이미지 URL을 입력하거나 파일을 업로드하세요"
											className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
										/>
									</div>

									{/* 현재 이미지 표시 */}
									{editDraft.image && !imagePreview && (
										<div className="mb-4 p-3 border rounded-lg bg-gray-50">
											<p className="mb-2 text-sm font-medium text-gray-700">현재 이미지:</p>
											<div className="flex items-start gap-3">
												<img
													src={editDraft.image}
													alt="현재 이미지"
													className="object-cover w-20 h-20 border rounded"
													onError={(e) => {
														(e.target as HTMLImageElement).style.display = 'none'
													}}
												/>
												<div className="flex-1">
													<p className="text-sm text-gray-600">기존 이미지</p>
													<p className="text-xs text-gray-500">새 이미지를 선택하면 교체됩니다</p>
												</div>
												<button
													type="button"
													onClick={() => {
														if (confirm('이미지를 제거하시겠습니까?')) {
															setEditDraft(prev => ({ ...prev, image: '' }))
														}
													}}
													className="px-2 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
												>
													이미지 제거
												</button>
											</div>
										</div>
									)}

									{/* 파일 업로드 섹션 */}
									<div className="p-4 border-2 border-gray-300 border-dashed rounded-lg">
										{!imagePreview ? (
											<div className="text-center">
												<p className="mb-2 text-sm text-gray-500">
													{editDraft.image ? '새 이미지로 교체' : '새 이미지를 S3에 업로드'}
												</p>
												<label className="inline-block px-4 py-2 text-gray-700 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
													파일 선택
													<input
														type="file"
														accept="image/png,image/jpeg,image/webp"
														onChange={handleImageSelect}
														className="hidden"
													/>
												</label>
												<p className="mt-1 text-xs text-gray-400">JPG, PNG, WebP · 최대 5MB</p>
											</div>
										) : (
											<div>
												<div className="flex items-start gap-3 mb-3">
													<img
														src={imagePreview}
														alt="선택된 이미지"
														className="object-cover w-20 h-20 border rounded"
													/>
													<div className="flex-1">
														<p className="text-sm font-medium">{imageFile?.name}</p>
														{imageFile && (
															<p className="text-xs text-gray-500">
																{(imageFile.size / 1024 / 1024).toFixed(2)} MB
															</p>
														)}
													</div>
													<button
														type="button"
														onClick={clearImageSelection}
														className="px-2 py-1 text-sm text-gray-600 rounded hover:bg-gray-100"
													>
														×
													</button>
												</div>

												<div className="text-sm text-green-600">
													새 이미지가 선택되었습니다. 저장 시 자동으로 업로드됩니다.
												</div>
											</div>
										)}
									</div>
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
								</form>
							</div>

							{/* Fixed footer with buttons */}
							<div className="flex-shrink-0 p-5 border-t bg-gray-50">
								<div className="flex items-center justify-end gap-3">
									<button
										type="button"
										onClick={closeEdit}
										className="px-4 py-2 border rounded-lg hover:bg-gray-50"
									>
										취소
									</button>
									<button
										type="submit"
										onClick={onSubmitEdit}
										className="flex items-center gap-2 px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
										disabled={uploading}
									>
										{uploading && (
											<svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
												<circle
													className="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													strokeWidth="4"
												></circle>
												<path
													className="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												></path>
											</svg>
										)}
										{uploading ? '업로드 중...' : '수정 완료'}
									</button>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
