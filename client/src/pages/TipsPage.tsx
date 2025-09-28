// src/pages/TipsPage.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import { Loader } from '@googlemaps/js-api-loader'
import type { TipItem } from '../types/tips'
import TmoneyGuide from './TipsArticle/TmoneyGuide'
import MpassGuide from './TipsArticle/MpassGuide'
import CatchTableGuide from './TipsArticle/CatchTableGuide'

// ✅ Tips 전용 탭 타입 (전역 타입과 분리: KMap 영향 없음)
type UITab = 'transportation' | 'reservation'

// ✅ 목록 전용 타입: 전역 TipItem에서 필요한 필드만 사용 + category를 새 키로
type TipListItem = Pick<TipItem, 'id' | 'title' | 'summary' | 'tags'> & { category: UITab }

/* ✅ 목록 전용 데이터: 새 카테고리 키 사용 */
const TIPS_DATA: TipListItem[] = [
	{
		id: 'tmoney-basics',
		category: 'transportation',
		title: 'Tmoney card',
		summary: 'How to use the Tmoney card',
		tags: ['교통', '티머니'],
	},
	{
		id: 'mpass-card',
		category: 'transportation',
		title: 'Mpass card',
		summary: 'How to use the Mpass card',
		tags: ['transportation', 'pass'],
	},
	{
		id: 'catchtable-howto',
		category: 'reservation',
		title: 'CatchTable',
		summary: 'How to use the CatchTable',
		tags: ['예약', '레스토랑'],
	},
]

export default function TipsPage() {
	const navigate = useNavigate()

	// 지도 초기화
	const mapRef = useRef<HTMLDivElement>(null)
	const mapObjRef = useRef<google.maps.Map | null>(null)
	useEffect(() => {
		const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string
		const MAP_ID = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string) || undefined
		if (!API_KEY) {
			console.error('Google Maps API key is missing.')
			return
		}
		if (mapObjRef.current) {
			console.warn('Map is already initialized.')
			return
		}
		const loader = new Loader({
			apiKey: API_KEY,
			version: 'weekly',
			libraries: ['marker', 'places'],
		})
		loader
			.importLibrary('maps')
			.then(() => {
				if (!mapRef.current) {
					console.error('Map container is not available.')
					return
				}
				mapObjRef.current = new google.maps.Map(mapRef.current, {
					center: { lat: 37.5113, lng: 127.0592 },
					zoom: 14,
					mapId: MAP_ID,
					disableDefaultUI: false,
				})
			})
			.catch((error) => {
				console.error('Failed to load Google Maps:', error)
			})
	}, [])

	// ✅ Tips 전용 탭 상태
	const [tab, setTab] = useState<UITab>('transportation')
	const items: TipListItem[] = TIPS_DATA.filter((t) => t.category === tab)
	const [selectedId, setSelectedId] = useState<string | null>(null)

	const selected = useMemo(() => {
		if (!selectedId) return null
		return items.find((i) => i.id === selectedId) ?? null
	}, [items, selectedId])

	// ESC로 닫기
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setSelectedId(null)
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [])

	return (
		<div className="fixed inset-x-0 bottom-0 flex top-14">
			{/* 왼쪽 사이드바 */}
			<div className="w-16 bg-white border-r shrink-0">
				<Sidebar
					active=""
					onSelectType={(t) => navigate(`/kmap?type=${t}`)} // ← KMap 용 (그대로 둠)
				/>
			</div>

			{/* 왼쪽 리스트 */}
			<div className="w-[360px] border-r overflow-y-auto">
				<div className="p-4">
					<h2 className="text-lg font-semibold">TIPS</h2>

					{/* ✅ 카테고리 탭: Transportation / Reservation 만 노출 */}
					<div className="flex gap-2 mt-3 mb-4">
						{(['transportation', 'reservation'] as UITab[]).map((c) => (
							<button
								key={c}
								onClick={() => {
									setTab(c)
									setSelectedId(null)
								}}
								className={[
									'px-3 py-1.5 rounded-lg border text-sm',
									tab === c ? 'bg-gray-900 text-white' : 'bg-white hover:bg-gray-50',
								].join(' ')}
							>
								{c === 'transportation' ? 'Transportation' : 'Reservation'}
							</button>
						))}
					</div>

					{/* 목록 */}
					<div
						className="relative"
						onClick={(e) => {
							if (e.target === e.currentTarget) {
								setSelectedId(null)
							}
						}}
						role="listbox"
					>
						<ul className="divide-y">
							{items.map((tip, idx) => {
								const active = tip.id === selectedId
								return (
									<li
										key={tip.id}
										className={[
											'p-3 cursor-pointer hover:bg-gray-50',
											active ? 'bg-gray-50' : '',
										].join(' ')}
										onClick={(e) => {
											e.stopPropagation()
											setSelectedId((cur) => (cur === tip.id ? null : tip.id))
										}}
										aria-selected={active}
										role="option"
									>
										<div className="flex items-center gap-3">
											<div className="w-6 h-6 flex items-center justify-center rounded-full border text-xs">
												{idx + 1}
											</div>
											<div className="min-w-0">
												<p className="font-medium truncate">{tip.title}</p>
												{tip.summary && (
													<p className="text-xs text-gray-500 truncate">{tip.summary}</p>
												)}
											</div>
										</div>
									</li>
								)
							})}
						</ul>
					</div>
				</div>
			</div>

			{/* 중앙 상세 */}
			{selected && (
				<div className="w-[520px] border-r overflow-y-auto" key={selectedId}>
					<div className="p-5">
						{/* 상단: 공통 헤더 삭제, Close만 유지 */}
						<div className="flex items-start justify-between">
							<button
								onClick={() => setSelectedId(null)}
								className="ml-auto px-3 py-1.5 text-sm rounded border hover:bg-gray-50"
								aria-label="닫기"
							>
								Close
							</button>
						</div>

						{/* 본문 */}
						{selected.id === 'tmoney-basics' ? (
							<div className="mt-3">
								<TmoneyGuide />
							</div>
						) : selected.id === 'mpass-card' ? (
							<div className="mt-3">
								<MpassGuide />
							</div>
						) : selected.id === 'catchtable-howto' ? (
							<div className="mt-3">
								<CatchTableGuide />
							</div>
						) : (
							<div className="mt-4 text-sm text-gray-500">준비 중인 콘텐츠입니다.</div>
						)}
					</div>
				</div>
			)}

			{/* 오른쪽 지도 */}
			<div className="flex-1">
				<div ref={mapRef} className="w-full h-full" />
			</div>
		</div>
	)
}
