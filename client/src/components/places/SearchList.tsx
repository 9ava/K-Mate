// src/components/places/SearchList.tsx
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../features/auth/useAuth'
import type { Place } from '../../types/place'

export type SearchListProps = {
	places: Place[]
	onSelect: (p: Place) => void
	title?: string // ✅ 추가
	isBookmarkMode?: boolean // ✅ 북마크 모드 여부
	onClose?: () => void // ✅ 닫기 콜백 추가
}

export default function SearchList({ places, onSelect, title = '장소 목록', isBookmarkMode = false, onClose }: SearchListProps) {
	const { t } = useTranslation()
	const { isAuthed, role } = useAuth()

	// 비로그인 상태에서 북마크 모드인 경우 안내 메시지 표시
	const showLoginMessage = isBookmarkMode && !isAuthed

	// 광고가 있는 장소들을 상위에 정렬
	const sortedPlaces = [...places].sort((a, b) => {
		// 광고 장소를 상위로 정렬 (true가 false보다 먼저)
		if (a.isAdvertisement && !b.isAdvertisement) return -1
		if (!a.isAdvertisement && b.isAdvertisement) return 1
		return 0 // 광고 상태가 같으면 기존 순서 유지
	})

	return (
		<aside
			className="
        h-full w-96 shrink-0 max-w-[90vw]
        bg-white border-r border-gray-200 overflow-y-auto
    "
			role="dialog"
			aria-label={title}
		>
			<div className="flex items-center justify-between p-4 text-lg font-bold border-b">
				<span>{title}</span>
				<div className="flex items-center gap-2">
					{isAuthed && role === 'admin' && (
						<Link
							to="/admin/map"
							title="K-Map 관리자 페이지"
							className="px-2 py-1 text-xs text-white transition-colors bg-gray-800 rounded hover:bg-gray-700"
						>
							⚙️ 관리
						</Link>
					)}
					{onClose && (
						<button
							onClick={onClose}
							aria-label="닫기"
							className="ml-2 text-xl text-gray-500 hover:text-gray-700 cursor-pointer"
							title="목록 닫기"
						>
							✕
						</button>
					)}
				</div>
			</div>
			
			{showLoginMessage ? (
				// 비로그인 상태에서 북마크 모드일 때 안내 메시지
				<div className="p-8 text-center">
					<div className="mb-4 text-4xl">🔒</div>
					<div className="mb-2 text-lg font-semibold text-gray-700">
						{t('kmap.empty.login_required_title')}
					</div>
					<div className="mb-4 text-sm text-gray-500">
						{t('kmap.empty.login_required_message')}
					</div>
					<Link
						to="/login"
						className="inline-block px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
					>
						{t('kmap.empty.login_button')}
					</Link>
				</div>
			) : sortedPlaces.length === 0 && isBookmarkMode ? (
				// 북마크 모드에서 북마크가 없을 때 안내 메시지
				<div className="p-8 text-center">
					<div className="mb-4 text-4xl">📍</div>
					<div className="mb-2 text-lg font-semibold text-gray-700">
						{t('kmap.empty.no_bookmarks_title')}
					</div>
					<div className="mb-4 text-sm text-gray-500">
						{t('kmap.empty.no_bookmarks_message')}
					</div>
					<div className="text-xs text-gray-400">
						{t('kmap.empty.no_bookmarks_hint')}
					</div>
				</div>
			) : sortedPlaces.length === 0 ? (
				// 일반 모드에서 검색 결과가 없을 때
				<div className="p-8 text-center">
					<div className="mb-4 text-4xl">🔍</div>
					<div className="mb-2 text-lg font-semibold text-gray-700">
						{t('kmap.empty.no_results_title')}
					</div>
					<div className="text-sm text-gray-500">
						{t('kmap.empty.no_results_message')}
					</div>
				</div>
			) : (
				// 일반 목록 표시
				<ul>
					{sortedPlaces.map((p, i) => (
						<li
							key={p.id ?? `${p.lat},${p.lng}-${i}`}
							className="p-3 border-b cursor-pointer hover:bg-gray-100"
							onClick={() => onSelect(p)}
						>
							<div className="flex items-start gap-2">
								<div className="grid w-6 h-6 mt-1 text-xs font-bold text-white bg-blue-600 rounded-full shrink-0 place-items-center">
									{i + 1}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<div className="font-semibold truncate">{p.name}</div>
										{p.hasMultilingualMenu && (
											<div className="flex items-center gap-1">
												<div className="w-3 h-3 bg-purple-600 rounded-full border border-white shadow-sm"></div>
												<span className="px-2 py-0.5 text-xs text-white bg-purple-600 rounded-full">
													다국어메뉴
												</span>
											</div>
										)}
										{p.isAdvertisement && (
											<span className="px-2 py-0.5 text-xs text-gray-600 bg-white border border-gray-300 rounded-full">
												광고 ⓘ
											</span>
										)}
									</div>
									{p.rating && <div className="text-sm text-yellow-700">⭐ {p.rating}</div>}
									{p.address && <div className="text-sm text-gray-600 truncate">{p.address}</div>}
								</div>
							</div>
						</li>
					))}
				</ul>
			)}
		</aside>
	)
}
