// src/pages/KBuzz/CommunityDetailPage.tsx
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

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
}

type Comment = {
	id: number
	author: string
	avatar?: string
	createdAt: string
	content: string
	authorId: number
}

export default function CommunityDetailPage() {
	const { id } = useParams()

	// 로그인 유저 (mock)
	const currentUser = { id: 1, name: 'Monika Dykas' }

	// Post (mock)
	const postInit: Post = useMemo(
		() => ({
			id: Number(id ?? 1),
			title: 'Having the Master at MIT, Harvard, Yale, Berkeley, Stanford?',
			asker: 'Monika Dykas',
			askedAt: 'Dec 18, 2014',
			editor: 'Asif Aleem',
			editedAt: 'Dec 19, 2014',
			body: [
				`I am a 31 year old German Bachelor-student in his 5th semester in a University of Applied Sciences, studying in Business Information Systems. The total time for receiving the Bachelor is 7 semesters.`,
				`Slowly I am starting to search for a good university for my Master (same area of studies) and I was thinking of the big ones like MIT, Harvard, Yale, Berkeley, and Stanford. Having checked on their websites, the costs got my main focus, as they are all quite expensive.`,
				`My question here is, whether there are studentships to support the costs. Does anybody know whether my idea of studies in these universities is realistic? How big can I expect my chance given my age, nationality, university in Germany, money situation?`,
			],
			authorId: 1,
			likeCount: 12,
			isLiked: false,
			isScraped: false,
		}),
		[id]
	)

	// 포스트 액션 상태
	const [isLiked, setIsLiked] = useState(postInit.isLiked)
	const [likeCount, setLikeCount] = useState(postInit.likeCount)
	const [isScraped, setIsScraped] = useState(postInit.isScraped)

	const [comments, setComments] = useState<Comment[]>([
		{
			id: 1,
			author: 'Monika',
			createdAt: '2 days ago',
			content:
				"I don't know about chanza, but if burla is at the highest degree, then I would agree with you. I'm not a native spanish speaker.",
			authorId: 1,
		},
		{
			id: 2,
			author: 'Bobby Watson',
			createdAt: '2 days ago',
			content: "maybe something like a 'masters of information systems' would be possible.",
			authorId: 2,
		},
	])

	const [draft, setDraft] = useState('')

	const addComment = () => {
		const text = draft.trim()
		if (!text) return
		setComments((prev) => [
			...prev,
			{
				id: Date.now(),
				author: currentUser.name,
				createdAt: 'just now',
				content: text,
				authorId: currentUser.id,
			},
		])
		setDraft('')
	}

	// === Post Actions ===
	const onEdit = () => {
		console.log('수정 클릭')
	}
	const onDelete = () => {
		if (confirm('이 게시글을 삭제할까요?')) {
			console.log('삭제 확인')
		}
	}

	// 좋아요 토글 (낙관적)
	const toggleLike = () => {
		const next = !isLiked
		setIsLiked(next)
		setLikeCount((c) => (next ? c + 1 : Math.max(0, c - 1)))
		// TODO: 서버 반영 (실패 시 롤백)
	}

	// 스크랩 토글 (낙관적)
	const toggleScrap = () => {
		const next = !isScraped
		setIsScraped(next)
		// TODO: 서버 반영 (실패 시 롤백)
	}

	return (
		<div className="min-h-screen bg-white">
			<main className="mx-auto max-w-3xl px-5 md:px-0 py-10">
				{/* Title */}
				<h1 className="text-2xl md:text-[28px] font-semibold leading-snug">{postInit.title}</h1>

				{/* Meta line */}
				<div className="mt-2 text-sm text-gray-500 text-right">
					{postInit.editor && postInit.editedAt && (
						<>
							by <span className="text-sky-600 font-medium">{postInit.editor}</span> on{' '}
							{postInit.editedAt}
						</>
					)}
				</div>

				{/* Actions (Edit/Delete + Like/Scrap) */}
				<div className="mt-3 flex justify-end gap-3 items-center">
					{/* 글 작성자만: Edit/Delete */}
					{currentUser.id === postInit.authorId && (
						<>
							<button
								onClick={onEdit}
								className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-amber-100 text-amber-800 hover:bg-amber-200"
							>
								Edit
							</button>
							<button
								onClick={onDelete}
								className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-amber-100 text-amber-800 hover:bg-amber-200"
							>
								Delete
							</button>
						</>
					)}

					{/* Like: 빈 하트 → 빨간 하트 + 카운트 */}
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

					{/* Scrap: 빈 별 → 노란 별 + Saved */}
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
				</div>

				{/* Hairline */}
				<hr className="my-5 border-gray-200" />

				{/* Body */}
				<article className="space-y-5 text-[15px] leading-7 text-gray-800">
					{postInit.body.map((p, i) => (
						<p key={i}>{p}</p>
					))}
				</article>

				{/* Soft divider */}
				<div className="my-8 border-t border-dashed border-gray-200" />

				{/* Comments header */}
				<div className="text-sm font-semibold text-gray-700 mb-3 text-right">
					{comments.length} Comments
				</div>

				{/* ===== Comments ===== */}
				<section className="relative pl-16 space-y-6">
					{/* vertical timeline */}
					<div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200" />

					{comments.map((c) => (
						<div key={c.id} className="relative">
							{/* avatar */}
							<div className="absolute left-[1.25rem] top-1 h-10 w-10 rounded-full bg-gray-200 ring-2 ring-white flex items-center justify-center text-sm font-medium">
								{c.author.charAt(0).toUpperCase()}
							</div>

							{/* bubble */}
							<div
								className="
                  relative bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3 ml-3
                  before:content-[''] before:absolute before:-left-3 before:top-6
                  before:border-y-[10px] before:border-y-transparent before:border-r-[10px] before:border-r-gray-200
                  after:content-[''] after:absolute after:-left-[11px] after:top-6
                  after:border-y-[10px] after:border-y-transparent after:border-r-[10px] after:border-r-white
                "
							>
								{/* 작성자+날짜 + (본인일 때) 버튼 */}
								<div className="mb-1 text-sm flex items-center justify-between">
									<div className="text-left">
										<span className="text-sky-600 font-medium">{c.author}</span>{' '}
										<span className="text-gray-400">{c.createdAt}</span>
									</div>

									{Number(currentUser.id) === Number(c.authorId) && (
										<div className="flex gap-2">
											<button className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-amber-100 text-amber-800 hover:bg-amber-200">
												Edit
											</button>
											<button className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-amber-100 text-amber-800 hover:bg-amber-200">
												Delete
											</button>
										</div>
									)}
								</div>

								<p className="text-[15px] leading-7 text-gray-800 whitespace-pre-wrap text-left">
									{c.content}
								</p>
							</div>
						</div>
					))}
				</section>

				{/* Add comment */}
				<div className="mt-5 rounded-lg border border-gray-200 p-3 bg-white">
					<textarea
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						rows={3}
						placeholder="Write a comment…"
						className="w-full resize-none outline-none text-[15px] leading-7"
					/>
					<div className="mt-2 flex justify-end">
						<button
							onClick={addComment}
							disabled={!draft.trim()}
							className="px-4 h-9 rounded bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-40"
						>
							Add Comment
						</button>
					</div>
				</div>
			</main>
		</div>
	)
}
