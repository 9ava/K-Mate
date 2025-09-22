// src/components/places/SearchList.tsx
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import type { Place } from '../../types/place'

export type SearchListProps = {
	places: Place[]
	onSelect: (p: Place) => void
	title?: string // ✅ 추가
	isBookmarkMode?: boolean // ✅ 북마크 모드 여부
}

export default function SearchList({ places, onSelect, title = '인기 장소 🌟', isBookmarkMode = false }: SearchListProps) {
	const { isAuthed, role } = useAuth()

	// 비로그인 상태에서 북마크 모드인 경우 안내 메시지 표시
	const showLoginMessage = isBookmarkMode && !isAuthed

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
				{isAuthed && role === 'admin' && (
					<Link
						to="/admin/map"
						title="K-Map 관리자 페이지"
						className="text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors"
					>
						⚙️ 관리
					</Link>
				)}
			</div>
			
			{showLoginMessage ? (
				// 비로그인 상태에서 북마크 모드일 때 안내 메시지
				<div className="p-8 text-center">
					<div className="mb-4 text-4xl">🔒</div>
					<div className="mb-2 text-lg font-semibold text-gray-700">
						로그인이 필요합니다
					</div>
					<div className="text-sm text-gray-500 mb-4">
						북마크 기능은 로그인 후 사용하실 수 있습니다.
					</div>
					<Link 
						to="/login" 
						className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
					>
						로그인하기
					</Link>
				</div>
			) : (
				// 일반 목록 표시
				<ul>
					{places.map((p, i) => (
						<li
							key={p.id ?? `${p.lat},${p.lng}-${i}`}
							className="p-3 border-b cursor-pointer hover:bg-gray-100"
							onClick={() => onSelect(p)}
						>
							<div className="flex items-start gap-2">
								<div className="grid w-6 h-6 mt-1 text-xs font-bold text-white bg-blue-600 rounded-full shrink-0 place-items-center">
									{i + 1}
								</div>
								<div className="min-w-0">
									<div className="font-semibold truncate">{p.name}</div>
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
