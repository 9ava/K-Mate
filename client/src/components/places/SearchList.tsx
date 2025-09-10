import type { Place } from '../../lib/types/place'

type Props = {
	places: Place[]
	onSelect: (p: Place) => void
}

export default function SearchList({ places, onSelect }: Props) {
	return (
		<aside
			className="
        absolute top-0 left-16 h-full w-96 max-w-[90vw]
        bg-white shadow-2xl border-r border-gray-200 z-40
        overflow-y-auto
      "
			role="dialog"
			aria-label="검색 결과"
		>
			<div className="p-4 border-b font-bold text-lg">검색 결과</div>
			<ul>
				{places.map((p, i) => (
					<li
						key={p.id ?? `${p.lat},${p.lng}-${i}`}
						className="p-3 border-b hover:bg-gray-100 cursor-pointer"
						onClick={() => onSelect(p)}
					>
						<div className="flex items-start gap-2">
							<div className="mt-1 shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold grid place-items-center">
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
