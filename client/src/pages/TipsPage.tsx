// src/pages/TipsPage.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import { Loader } from '@googlemaps/js-api-loader'
import type { TipCategory, TipItem } from '../types/tips'

/* ----------------------- 임시 정적 데이터 ----------------------- */
const TIPS_DATA: TipItem[] = [
	{
		id: 'tmoney-basics',
		category: 'travel',
		title: '티머니 카드 사용법',
		summary: '구매 → 충전 → 승/하차 태그 기본 흐름',
		tags: ['교통', '티머니'],
		sections: [
			{
				id: 'tmoney-what',
				heading: '티머니란?',
				body: '대중교통 선불 교통카드. 편의점/지하철역에서 구매·충전 후 승/하차 때 태그.',
				notes: ['분실 시 잔액 환불 어려울 수 있어 보관 주의'],
			},
			{
				id: 'tmoney-charge',
				heading: '구매 & 충전',
				steps: [
					'편의점 또는 지하철역에서 카드 구매',
					'무인충전기/카운터에서 충전',
					'초반엔 실물 카드 추천',
				],
			},
			{
				id: 'tmoney-tag',
				heading: '이용',
				steps: [
					'승차 태그 → 이동 → 하차 태그',
					'환승 시 하차 태그 후 다음 교통수단 승차 태그',
					'최종 하차 시 반드시 하차 태그',
				],
			},
		],
		links: [{ label: '티머니 공식', url: 'https://www.tmoney.co.kr', external: true }],
	},
	{
		id: 'transfer-basics',
		category: 'travel',
		title: '버스/지하철 환승 기본',
		summary: '환승 인정 시간 개념, 태그 순서',
		tags: ['환승'],
		sections: [
			{
				id: 'window',
				heading: '환승 인정 시간',
				body: '대체로 “하차 태그 후 일정 시간 내 다음 승차 태그” 시 환승 인정(지역·운영사별 상이).',
				notes: ['항상 하차 태그 필수', '장거리 이동 전 잔액 충분히 준비'],
			},
			{
				id: 'order',
				heading: '태그 순서',
				steps: ['승차 태그', '하차 태그', '환승 승차 태그', '최종 하차 태그'],
			},
		],
		links: [{ label: '서울교통공사', url: 'https://www.seoulmetro.co.kr', external: true }],
	},
	{
		id: 'catchtable-howto',
		category: 'food',
		title: '캐치테이블 예약 사용법',
		summary: '앱 설치 → 매장검색 → 날짜/시간/인원 선택 → 예약 확정',
		tags: ['예약', '레스토랑'],
		sections: [
			{
				id: 'ct-overview',
				heading: '개요',
				body: '인기 레스토랑 실시간 좌석/대기 확인 및 예약 플랫폼.',
			},
			{
				id: 'ct-steps',
				heading: '절차',
				steps: ['앱 설치·회원가입', '매장 검색', '날짜/시간/인원 선택', '예약 확정 알림 확인'],
				notes: ['피크타임엔 알림/웨이팅 기능 활용'],
			},
		],
		links: [{ label: '캐치테이블', url: 'https://www.catchtable.co.kr', external: true }],
	},
	{
		id: 'tabling-howto',
		category: 'food',
		title: '테이블링 웨이팅 사용법',
		summary: '원격 줄서기 → 호출 알림 → 입장 체크',
		tags: ['웨이팅'],
		sections: [
			{
				id: 'tb-overview',
				heading: '개요',
				body: '원격 웨이팅/현장 번호표 관리 앱. 미리 줄 서고 호출 시 입장.',
			},
			{
				id: 'tb-steps',
				heading: '절차',
				steps: ['앱 설치·위치 권한', '매장 검색 후 웨이팅 등록', '호출 알림→도착→입장'],
				notes: ['호출 후 제한 시간 지나면 순번 넘어갈 수 있음'],
			},
		],
		links: [{ label: '테이블링', url: 'https://tabling.co.kr', external: true }],
	},
	{
		id: 'catchtable-cafe',
		category: 'cafe',
		title: '인기 카페 예약 팁(캐치테이블)',
		summary: '피크타임 회피 + 취소석 알림 활용',
		tags: ['카페', '예약'],
		sections: [
			{
				id: 'tips',
				heading: '핵심 팁',
				steps: ['주말 13~17시 피하기', '즐겨찾기/알림 설정', '인원 유연성 확보'],
			},
		],
		links: [{ label: '캐치테이블', url: 'https://www.catchtable.co.kr', external: true }],
	},
	{
		id: 'tabling-cafe',
		category: 'cafe',
		title: '인기 카페 웨이팅 팁(테이블링)',
		summary: '원격 웨이팅 + 동선 관리',
		tags: ['카페', '웨이팅'],
		sections: [
			{
				id: 'tips2',
				heading: '핵심 팁',
				steps: ['원격 등록 후 근처 대기', '호출 즉시 이동', '악천후 시 실내 대기 가능한 지점'],
			},
		],
		links: [{ label: '테이블링', url: 'https://tabling.co.kr', external: true }],
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
		const loader = new Loader({
			apiKey: API_KEY,
			version: 'weekly',
			libraries: ['marker', 'places'],
		})
		loader.importLibrary('maps').then(() => {
			if (!mapRef.current) return
			mapObjRef.current = new google.maps.Map(mapRef.current, {
				center: { lat: 37.5113, lng: 127.0592 },
				zoom: 14,
				mapId: MAP_ID,
				disableDefaultUI: false,
			})
		})
	}, [])

	// 상태
	const [tab, setTab] = useState<TipCategory>('travel')
	const items: TipItem[] = TIPS_DATA.filter((t) => t.category === tab)
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
					onSelectType={(t) => navigate(`/kmap?type=${t}`)}
					onShowTips={() => {
						/* 이미 /tips 페이지라 동작 없음 or navigate('/tips') */
					}}
					isTipsActive={true} // ✅ TIPS 아이콘 활성화 표시
				/>
			</div>

			{/* 왼쪽 리스트 폭 고정 */}
			<div className="w-[360px] border-r overflow-y-auto ">
				<div className="p-4">
					<h2 className="text-lg font-semibold">TIPS</h2>

					{/* 카테고리 탭 */}
					<div className="flex gap-2 mt-3 mb-4">
						{(['travel', 'food', 'cafe'] as TipCategory[]).map((c) => (
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
								{c === 'travel' ? 'Travel' : c === 'food' ? 'Food' : 'Cafe'}
							</button>
						))}
					</div>

					{/* 목록 */}
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
									onClick={() => setSelectedId(tip.id)}
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

			{/* 중앙 상세: 선택됐을 때만 */}
			{selected && (
				<div className="w-[520px] border-r overflow-y-auto">
					<div className="p-5">
						<div className="flex items-start justify-between gap-3">
							<div>
								<h3 className="text-xl font-semibold">{selected.title}</h3>
								{selected.summary && <p className="mt-1 text-gray-600">{selected.summary}</p>}
							</div>
							<button
								onClick={() => setSelectedId(null)}
								className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50"
								aria-label="닫기"
							>
								닫기
							</button>
						</div>

						<div className="mt-4 space-y-5">
							{selected.sections.map((sec) => (
								<section key={sec.id}>
									<h4 className="font-medium">{sec.heading}</h4>
									{sec.body && <p className="mt-1 text-gray-700">{sec.body}</p>}
									{sec.steps && (
										<ol className="mt-2 list-decimal pl-5 space-y-1">
											{sec.steps.map((s, i) => (
												<li key={i}>{s}</li>
											))}
										</ol>
									)}
									{sec.notes && (
										<ul className="mt-2 list-disc pl-5 text-gray-600 space-y-1">
											{sec.notes.map((n, i) => (
												<li key={i}>{n}</li>
											))}
										</ul>
									)}
								</section>
							))}
						</div>

						{selected.links && selected.links.length > 0 && (
							<div className="mt-5 flex flex-wrap gap-2">
								{selected.links.map((l) => (
									<a
										key={l.url}
										href={l.url}
										target={l.external ? '_blank' : '_self'}
										rel="noreferrer"
										className="text-sm underline hover:no-underline"
									>
										{l.label}
									</a>
								))}
							</div>
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
