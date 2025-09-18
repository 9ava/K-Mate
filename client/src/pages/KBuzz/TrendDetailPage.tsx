// src/pages/KBuzz/TrendDetailPage.tsx
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function TrendDetailPage() {
	const { id } = useParams()
	const navigate = useNavigate()

	// 정적 페이지지만, id별로 이미지/제목 정도만 다르게 보여줄 수 있게 최소한만 매핑
	const { title, hero, kicker, sub } = useMemo(() => {
		const map: Record<string, { title: string; hero: string; kicker: string; sub: string }> = {
			'1': {
				title: 'Wherever you go, go with all your heart.',
				hero: 'https://picsum.photos/id/1011/1600/900', // 바다 느낌
				kicker:
					"K-Mate's K-Trend highlights what's moving Korea right now — travel, culture, and lifestyle.",
				sub: 'From emerging hotspots to timeless classics, explore the pulse of Korea in a single read.',
			},
			'2': {
				title: 'See the city with brand-new eyes.',
				hero: 'https://picsum.photos/id/1015/1600/900',
				kicker:
					'Fresh perspectives on Korea’s evolving urban scenes, designed for curious travelers.',
				sub: 'Walkable neighborhoods, indie cafés, and night views — curated picks to plan your next day.',
			},
			'3': {
				title: 'Slow down. Savor every moment.',
				hero: 'https://picsum.photos/id/1018/1600/900',
				kicker:
					'A slow-travel look at Korea: coastal roads, island ferries, and quiet morning markets.',
				sub: 'Less rush, more feel. Routes and places made for taking your time.',
			},
		}
		return map[id ?? '1'] ?? map['1']
	}, [id])

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

	return (
		<div className="px-6 py-10">
			<div className="mx-auto max-w-6xl">
				{/* Top section: 큰 헤드라인(좌), 짧은 설명(우) */}
				<section className="grid gap-8 items-end mb-10 md:mb-14 lg:grid-cols-3">
					<h1 className="lg:col-span-2 text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
						{title}
					</h1>
					<div className="text-sm md:text-base text-gray-600 space-y-3">
						<p>{kicker}</p>
						<p className="hidden md:block">{sub}</p>
					</div>
				</section>

				{/* Hero 이미지 + 우측 플로팅 인포 카드 */}
				<section className="relative mb-16">
					<div className="overflow-hidden rounded-2xl border">
						<img src={hero} alt="" className="w-full h-[320px] md:h-[440px] object-cover" />
					</div>

					{/* 화면 오른쪽 겹쳐지는 작은 카드 (모바일에서는 숨김) */}
					<aside className="hidden md:block absolute right-6 -bottom-10">
						<div className="w-[260px] rounded-2xl bg-white shadow-xl border">
							<div className="p-5">
								<div className="text-xs uppercase tracking-wide text-gray-400">01</div>
								<div className="mt-3 text-lg font-semibold leading-snug">About K-Trend</div>
								<p className="mt-2 text-sm text-gray-600">
									Curated insights and guides for exploring Korea’s latest trends — crafted by the
									K-Mate team.
								</p>
							</div>
						</div>
					</aside>
				</section>

				{/* 큰 중간 헤드라인 */}
				<section className="mb-10 md:mb-12">
					<h2 className="text-2xl md:text-4xl font-bold text-center leading-snug">
						The best education I have ever received was through travel.
					</h2>
				</section>

				{/* 두 단 본문 섹션 */}
				<section className="grid gap-8 md:grid-cols-2 text-gray-700 leading-relaxed">
					<p>
						Travel opens up a quiet discipline of paying attention — to colors, textures, and the
						rhythm of local days. In Korea, that can mean noticing the way a seaside town hums at
						dawn, how the scent of pine lingers on a ridge walk, or how a late-night alley lights up
						with tiny neon signs. K-Trend curates routes and places that help you feel these layers
						without rushing.
					</p>
					<p>
						Whether you’re mapping a coastal drive, hopping island ferries, or tracing café lines
						through a university neighborhood, our guides are meant to be simple, visual, and calm.
						Think fewer tabs, clearer choices, and reasons to stay a little longer at each stop. Use
						this as a starting point, then make it your own.
					</p>
				</section>

				{/* 우측 하단 목록 + 액션 버튼들 */}
				<div className="mt-10 flex justify-end items-center gap-3">
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
						className="px-4 py-2 rounded-lg border hover:bg-gray-50"
					>
						목록
					</button>
				</div>
			</div>
		</div>
	)
}
