// src/components/places/SearchList.tsx
import type { Place } from '../../types/place'

export type SearchListProps = {
	places: Place[]
	onSelect: (p: Place) => void
	title?: string // ✅ 추가
}

export default function SearchList({ places, onSelect, title = '인기 장소 🌟' }: SearchListProps) {
	return (
		<aside
			className="
        h-full w-96 shrink-0 max-w-[90vw]
        bg-white border-r border-gray-200 overflow-y-auto
    "
			role="dialog"
			aria-label={title}
		>
			<div className="p-4 text-lg font-bold border-b">{title}</div>
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
		</aside>
	)
}
