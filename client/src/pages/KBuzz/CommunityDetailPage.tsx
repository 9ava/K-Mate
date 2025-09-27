// src/pages/KBuzz/CommunityDetailPage.tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchPostDetail, likePost, updatePost } from '../../api/kbuzz'
import { fetchComments, createComment, deleteComment } from '../../api/comments'
import { useAuthStore } from '../../features/auth/auth.store'
import { toKstFromUtc, toKstFromUtcShort } from '../../lib/date'
import { uploadToS3, generateCommunityImageKey, validateImageFile } from '../../api/s3'

type Post = {
	id: number
	title: string
	asker: string
	askedAt: string
	editor?: string
	editedAt?: string
	body: string[]
	authorId: number
	likeCount: number
	isLiked: boolean
	isScraped: boolean
	imageUrl?: string
}

type Comment = {
	id: number
	author: string
	avatar?: string | null
	createdAt: string
	content: string
	authorId: number
	likeCount: number
	isLiked: boolean
}

export default function CommunityDetailPage() {
	const { id } = useParams()
	const navigate = useNavigate()

	// 로그인 스토어
	const user = useAuthStore((s) => s.user)
	const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)

	// 임시 현재 유저(기존 UI용)
	const currentUser = {
		id: user?.id ?? 0,
		name: user?.name ?? user?.email?.split('@')[0] ?? 'User',
	}

	// 초기값 생성기
	const makeEmptyPost = (pid?: string | number): Post => ({
		id: Number(pid ?? 0),
		title: '',
		asker: '',
		askedAt: '',
		editor: '',
		editedAt: '',
		body: [],
		authorId: 0,
		likeCount: 0,
		isLiked: false,
		isScraped: false,
		imageUrl: undefined,
	})

	// ===== 서버 원본/로딩 상태 =====
	const [loading, setLoading] = useState(true)

	// ===== 포스트 상태 (UI용) =====
	const [post, setPost] = useState<Post>(makeEmptyPost(id))
	const [isLiked, setIsLiked] = useState(false)
	const [likeCount, setLikeCount] = useState(0)
	const [isScraped, setIsScraped] = useState(false)
	const [liking, setLiking] = useState(false)

	// ===== 서버에서 상세 읽어와서 UI 형태로 매핑 =====
	useEffect(() => {
		let alive = true
		async function run() {
			if (!id) return
			setLoading(true)
			try {
				const res = await fetchPostDetail(id) // GET /posts/:id

				if (!alive) return

				const mapped: Post = {
					id: Number(res.id),
					title: res.title,
					asker: res.author?.name ?? 'User',
					askedAt: toKstFromUtc(res.createdAt),
					editor: res.author?.name ?? 'User',
					editedAt: toKstFromUtc(res.updatedAt),
					body: (res.content || '').split(/\n{2,}/),
					authorId: res.author?.id ?? 0,
					likeCount: res.likeCount ?? 0,
					isLiked: res.isLiked ?? false,
					isScraped: false,
					imageUrl: res.imageUrl ?? undefined, // ⬅ 서버에 저장된 이미지가 있으면 표시
				}

				setPost(mapped)
				setIsLiked(mapped.isLiked)
				setLikeCount(mapped.likeCount)
				setIsScraped(false)
			} catch (e: any) {
				// noop
			} finally {
				if (alive) setLoading(false)
			}
		}
		run()
		return () => {
			alive = false
		}
	}, [id])

	// ===== 댓글 상태 =====
	const [comments, setComments] = useState<Comment[]>([])
	const [commentsLoading, setCommentsLoading] = useState(false)

	// 댓글 목록 로드 (items 구조 대응)
	useEffect(() => {
		let alive = true
		async function loadComments() {
			if (!id) return
			setCommentsLoading(true)
			try {
				const list = await fetchComments(Number(id), 1, 50) // 필요 시 페이지/limit 조절
				if (!alive) return
				const mapped: Comment[] = list.items.map((i) => ({
					id: i.id,
					author: i.author.name,
					avatar: i.author.avatarUrl,
					createdAt: toKstFromUtcShort(i.createdAt),
					content: i.content,
					authorId: i.author.id,
					likeCount: 0,
					isLiked: false,
				}))
				setComments(mapped)
			} catch (e) {
				// 목록 실패는 토스트/로깅 정도로 충분
			} finally {
				if (alive) setCommentsLoading(false)
			}
		}
		loadComments()
		return () => {
			alive = false
		}
	}, [id])

	// 새 댓글 작성
	const [draft, setDraft] = useState('')
	const addComment = async () => {
		const text = draft.trim()
		if (!text || !id) return
		if (!user) {
			loginWithGoogle()
			return
		}
		try {
			const created = await createComment(Number(id), text)
			const mapped: Comment = {
				id: created.id,
				author: created.author.name,
				avatar: created.author.avatarUrl,
				createdAt: toKstFromUtcShort(created.createdAt),
				content: created.content,
				authorId: created.author.id,
				likeCount: 0,
				isLiked: false,
			}
			setComments((prev) => [...prev, mapped])
			setDraft('')
		} catch (e) {
			alert('댓글 작성 중 오류가 발생했어요.')
		}
	}

	// 댓글 삭제
	const onDeleteComment = async (commentId: number) => {
		if (!user) {
			loginWithGoogle()
			return
		}
		if (!confirm('이 댓글을 삭제할까요?')) return
		try {
			await deleteComment(commentId)
			setComments((prev) => prev.filter((c) => c.id !== commentId))
		} catch (e) {
			alert('댓글 삭제 중 오류가 발생했어요.')
		}
	}

	// 댓글 인라인 수정(로컬 유지)
	const [editingId, setEditingId] = useState<number | null>(null)
	const [editDraft, setEditDraft] = useState('')
	const startEditComment = (commentId: number) => {
		const target = comments.find((c) => c.id === commentId)
		setEditingId(commentId)
		setEditDraft(target?.content ?? '')
	}
	const cancelEditComment = () => {
		setEditingId(null)
		setEditDraft('')
	}
	const saveEditComment = () => {
		if (editingId == null) return
		const text = editDraft.trim()
		if (!text) {
			alert('내용을 입력해 주세요.')
			return
		}
		setComments((prev) => prev.map((c) => (c.id === editingId ? { ...c, content: text } : c)))
		setEditingId(null)
		setEditDraft('')
	}

	// 스크랩/댓글 좋아요는 로컬 유지
	const toggleScrap = () => setIsScraped((v) => !v)
	const toggleCommentLike = (commentId: number) => {
		setComments((prev) =>
			prev.map((c) =>
				c.id === commentId
					? {
							...c,
							isLiked: !c.isLiked,
							likeCount: Math.max(0, c.likeCount + (c.isLiked ? -1 : 1)),
					  }
					: c
			)
		)
	}

	// ✅ 게시글 좋아요: 서버 반영(토글) + 낙관적 업데이트 + 실패 롤백
	async function onLike() {
		if (!id) return
		if (!user) {
			loginWithGoogle()
			return
		}
		setLiking(true)
		const prevLiked = isLiked
		const prevCount = likeCount
		const nextLiked = !prevLiked
		setIsLiked(nextLiked)
		setLikeCount((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)))
		try {
			await likePost(id) // POST /posts/buzz/:id/like
			const fresh = await fetchPostDetail(id) // 정확한 숫자 동기화
			setLikeCount(fresh.likeCount ?? 0)
		} catch (e) {
			// 롤백
			setIsLiked(prevLiked)
			setLikeCount(prevCount)
			alert('좋아요 처리 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.')
		} finally {
			setLiking(false)
		}
	}

	// ===== 게시글 인라인 수정/삭제 (UI 유지) =====
	const [editingPost, setEditingPost] = useState(false)
	const [postTitleDraft, setPostTitleDraft] = useState(post.title)
	const [postBodyDraft, setPostBodyDraft] = useState(post.body.join('\n\n'))

	const startEditPost = () => {
		setPostTitleDraft(post.title)
		setPostBodyDraft(post.body.join('\n\n'))
		// Reset image upload states but keep existing image
		setImageFile(null)
		setImagePreview(null)
		setUploading(false)
		setUploadProgress(0)
		setEditingPost(true)
	}
	const cancelEditPost = () => setEditingPost(false)

	// ===== 이미지 업로드 상태 (S3 결합) =====
	const [imageFile, setImageFile] = useState<File | null>(null)
	const [imagePreview, setImagePreview] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [uploading, setUploading] = useState(false)
	const [uploadProgress, setUploadProgress] = useState(0)

	function handlePickClick() {
		fileInputRef.current?.click()
	}
	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0]
		if (!f) return

		const validation = validateImageFile(f, 5)
		if (!validation.isValid) {
			alert(validation.error)
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

	// ⬇️ 자동으로 이미지 업로드 후 서버에 저장
	const saveEditPost = async () => {
		const title = postTitleDraft.trim()
		const body = postBodyDraft.trim()
		if (!title || !body) {
			alert('제목과 본문을 입력해 주세요.')
			return
		}

		// 1) 새 이미지 파일이 선택된 경우 자동으로 S3에 업로드
		let nextImageUrl: string | null | undefined = post.imageUrl
		if (imageFile) {
			try {
				setUploading(true)
				setUploadProgress(0)
				const key = generateCommunityImageKey(Number(currentUser.id), imageFile.name)
				const uploadedUrl = await uploadToS3(imageFile, key)
				nextImageUrl = uploadedUrl
			} catch (e) {
				console.error(e)
				alert('이미지 업로드 중 오류가 발생했어요.')
				setUploading(false)
				return
			} finally {
				setUploading(false)
				setUploadProgress(0)
			}
		}

		try {
			// 2) 서버에 업데이트
			await updatePost(post.id, { title, content: body, imageUrl: nextImageUrl })

			// 3) 로컬 UI 반영
			setPost((prev) => ({
				...prev,
				title,
				body: body.split(/\n{2,}/),
				imageUrl: nextImageUrl ?? prev.imageUrl ?? undefined,
			}))
			setEditingPost(false)
		} catch (e: any) {
			alert('게시글 수정 중 오류가 발생했어요.')
		}
	}

	const onDeletePost = () => {
		if (!confirm('이 게시글을 삭제할까요?')) return
		// TODO: 서버 DELETE 연동 필요 시 연결
		navigate('/buzz')
	}

	return (
		<div className="min-h-screen bg-white">
			<main className="max-w-3xl px-5 py-10 mx-auto md:px-0">
				{/* Title */}
				{!editingPost ? (
					<h1 className="text-left text-2xl md:text-[28px] font-semibold leading-snug">
						{post.title || (loading ? 'Loading…' : '(제목 없음)')}
					</h1>
				) : (
					<input
						value={postTitleDraft}
						onChange={(e) => setPostTitleDraft(e.target.value)}
						className="w-full text-left text-2xl md:text-[28px] font-semibold leading-snug border rounded px-3 py-2"
					/>
				)}

				{/* Meta line */}
				<div className="mt-2 text-sm text-right text-gray-500">
					{post.editor && post.editedAt && (
						<>
							by <span className="font-medium text-sky-600">{post.editor}</span> on {post.editedAt}
						</>
					)}
				</div>

				{/* Actions */}
				<div className="flex items-center justify-end gap-3 mt-3">
					{currentUser.id !== 0 && currentUser.id === post.authorId && (
						<>
							{!editingPost ? (
								<>
									<button
										onClick={startEditPost}
										className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded hover:bg-amber-200"
									>
										Edit
									</button>
									<button
										onClick={onDeletePost}
										className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded hover:bg-amber-200"
									>
										Delete
									</button>
								</>
							) : (
								<>
									<button
										onClick={saveEditPost}
										disabled={uploading}
										className="px-2 py-0.5 text-xs bg-sky-500 text-white rounded hover:bg-sky-600 disabled:opacity-50"
									>
										{uploading ? 'Saving…' : 'Save'}
									</button>
									<button
										onClick={cancelEditPost}
										className="px-2 py-0.5 text-xs border text-gray-600 rounded hover:bg-gray-50"
									>
										Cancel
									</button>
								</>
							)}
						</>
					)}

					{/* Like (서버 반영) */}
					<button onClick={onLike} disabled={liking} className="inline-flex items-center gap-2">
						<svg
							viewBox="0 0 24 24"
							className={`w-6 h-6 ${isLiked ? 'text-rose-500' : 'text-black'}`}
							fill={isLiked ? 'currentColor' : 'none'}
							stroke="currentColor"
						>
							<path d="M21 8.25c0-2.485-2.239-4.5-5-4.5-1.747 0-3.298.802-4 2.163C11.298 4.552 9.747 3.75 8 3.75 5.239 3.75 3 5.765 3 8.25c0 7.22 9 11.25 9 11.25s9-4.03 9-11.25z" />
						</svg>
						<span>{likeCount}</span>
					</button>

					{/* Scrap (로컬만) */}
					<button onClick={toggleScrap} className="inline-flex items-center gap-2">
						<svg
							viewBox="0 0 24 24"
							className={`w-6 h-6 ${isScraped ? 'text-amber-500' : 'text-black'}`}
							fill={isScraped ? 'currentColor' : 'none'}
							stroke="currentColor"
						>
							<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
						</svg>
						<span>{isScraped ? 'Saved' : 'Save'}</span>
					</button>
				</div>

				<hr className="my-5 border-gray-200" />

				{/* Body & Image */}
				{!editingPost ? (
					<>
						<article className="space-y-5 text-[15px] leading-7 text-gray-800 ">
							{post.body.length > 0 ? (
								post.body.map((p, i) => (
									<p key={i} className="text-left whitespace-pre-wrap">
										{p}
									</p>
								))
							) : (
								<p className="text-left text-gray-400">
									{loading ? '내용을 불러오는 중…' : '내용이 없습니다.'}
								</p>
							)}
						</article>
						{post.imageUrl && (
							<div className="mt-5">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={post.imageUrl}
									alt="post"
									className="object-cover w-full border rounded-lg"
								/>
							</div>
						)}
					</>
				) : (
					<div>
						<textarea
							value={postBodyDraft}
							onChange={(e) => setPostBodyDraft(e.target.value)}
							rows={10}
							className="w-full rounded border px-3 py-2 text-[15px] leading-7"
						/>
						{/* Image Upload */}
						<div className="mt-4">
							<label className="block mb-1 text-sm font-medium">Image (optional)</label>

							{/* 현재 이미지 표시 */}
							{post.imageUrl && !imagePreview && (
								<div className="mb-4 p-3 border rounded-lg bg-gray-50">
									<p className="mb-2 text-sm font-medium text-gray-700">현재 이미지:</p>
									<div className="flex items-start gap-3">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={post.imageUrl}
											alt="현재 이미지"
											className="object-cover w-16 h-16 border rounded"
											onError={(e) => {
												(e.target as HTMLImageElement).style.display = 'none'
											}}
										/>
										<div className="flex-1">
											<p className="text-sm text-gray-600">기존 이미지</p>
											<p className="text-xs text-gray-500">새 이미지를 선택하면 교체됩니다</p>
										</div>
									</div>
								</div>
							)}

							{!imagePreview ? (
								<div className="px-4 py-6 text-center border border-dashed rounded-lg">
									<p className="text-sm text-gray-500">
										{post.imageUrl ? '새 이미지로 교체' : '첨부할 이미지를 선택해 주세요'}
									</p>
									<div className="flex justify-center gap-3 mt-3">
										<button
											type="button"
											onClick={handlePickClick}
											className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50"
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
								<div className="flex items-center gap-3 p-3 border rounded-lg">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={imagePreview}
										alt="선택된 이미지"
										className="object-cover w-16 h-16 border rounded"
									/>
									<div className="flex-1">
										<div className="text-sm font-medium truncate">
											{imageFile?.name ?? '이미지'}
										</div>
										{imageFile && (
											<div className="text-xs text-gray-500">
												{(imageFile.size / 1024 / 1024).toFixed(2)} MB
												{uploading ? ` · 업로드중 ${uploadProgress}%` : ' · 저장 시 자동으로 업로드됩니다'}
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
					</div>
				)}

				{/* Soft divider */}
				<div className="my-8 border-t border-gray-200 border-dashed" />

				{/* Comments header */}
				<div className="mb-3 text-sm font-semibold text-right text-gray-700">
					{commentsLoading ? 'Loading comments…' : `${comments.length} Comments`}
				</div>

				{/* Comments */}
				<section className="relative pl-16 space-y-6">
					<div className="absolute top-0 bottom-0 w-px bg-gray-200 left-8" />
					{comments.map((c) => {
						const isOwner = Number(currentUser.id) === Number(c.authorId)
						const isEditing = editingId === c.id
						return (
							<div key={c.id} className="relative">
								{/* avatar */}
								<div className="absolute left-[1.25rem] top-1 h-10 w-10 rounded-full bg-gray-200 ring-2 ring-white flex items-center justify-center text-sm font-medium overflow-hidden">
									{c.avatar ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img src={c.avatar} alt={c.author} className="object-cover w-full h-full" />
									) : (
										c.author.charAt(0).toUpperCase()
									)}
								</div>

								{/* bubble */}
								<div className="relative px-4 py-3 ml-3 bg-white border border-gray-200 shadow-sm rounded-xl">
									{/* 상단: 왼쪽(닉) | 오른쪽(액션/하트) */}
									<div className="flex items-center justify-between mb-1 text-sm">
										<div className="text-left">
											<span className="font-medium text-sky-600">{c.author}</span>{' '}
											<span className="text-gray-400">{c.createdAt}</span>
										</div>
										<div className="flex items-center gap-3">
											{isOwner &&
												(!isEditing ? (
													<div className="flex gap-2">
														<button
															onClick={() => startEditComment(c.id)}
															className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded hover:bg-amber-200"
														>
															Edit
														</button>
														<button
															onClick={() => onDeleteComment(c.id)}
															className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded hover:bg-amber-200"
														>
															Delete
														</button>
													</div>
												) : (
													<div className="flex gap-2">
														<button
															onClick={saveEditComment}
															className="px-2 py-0.5 text-xs bg-sky-500 text-white rounded hover:bg-sky-600"
														>
															Save
														</button>
														<button
															onClick={cancelEditComment}
															className="px-2 py-0.5 text-xs border text-gray-600 rounded hover:bg-gray-50"
														>
															Cancel
														</button>
													</div>
												))}

											{/* 하트(댓글 로컬) */}
											<button
												onClick={() => toggleCommentLike(c.id)}
												className="inline-flex items-center gap-1"
												aria-pressed={c.isLiked}
												aria-label={c.isLiked ? 'Unlike comment' : 'Like comment'}
												title="Like comment"
											>
												<svg
													viewBox="0 0 24 24"
													className={`w-4 h-4 ${c.isLiked ? 'text-rose-500' : 'text-black'}`}
													fill={c.isLiked ? 'currentColor' : 'none'}
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<path d="M21 8.25c0-2.485-2.239-4.5-5-4.5-1.747 0-3.298.802-4 2.163C11.298 4.552 9.747 3.75 8 3.75 5.239 3.75 3 5.765 3 8.25c0 7.22 9 11.25 9 11.25s9-4.03 9-11.25z" />
												</svg>
												<span className={`text-xs ${c.isLiked ? 'font-semibold' : ''}`}>
													{c.likeCount}
												</span>
											</button>
										</div>
									</div>

									{/* 본문 or 편집기 */}
									{!isEditing ? (
										<p className="text-[15px] leading-7 text-gray-800 whitespace-pre-wrap text-left">
											{c.content}
										</p>
									) : (
										<div>
											<textarea
												value={editDraft}
												onChange={(e) => setEditDraft(e.target.value)}
												rows={3}
												className="w-full resize-none rounded border px-3 py-2 text-[15px] leading-7 outline-none focus:ring-2 focus:ring-sky-200"
											/>
										</div>
									)}
								</div>
							</div>
						)
					})}
				</section>

				{/* Add comment */}
				<div className="p-3 mt-5 bg-white border border-gray-200 rounded-lg">
					<textarea
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						rows={3}
						placeholder="Write a comment…"
						className="w-full resize-none outline-none text-[15px] leading-7"
					/>
					<div className="flex justify-end mt-2">
						<button
							onClick={addComment}
							disabled={!draft.trim()}
							className="px-4 text-white rounded h-9 bg-sky-500 hover:bg-sky-600 disabled:opacity-40"
						>
							Add Comment
						</button>
					</div>
				</div>
			</main>
		</div>
	)
}
