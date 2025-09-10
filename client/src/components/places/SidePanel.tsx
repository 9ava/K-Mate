import type { Place } from '../../lib/types/place'

type Props = {
	place: Place
	onClose: () => void
}

export default function SidePanel({ place, onClose }: Props) {
	return (
		<aside
			className="absolute top-0 left-16 h-full w-[380px] max-w-[90vw]
                 bg-white border-r border-gray-200 shadow-2xl z-50 flex flex-col"
			role="dialog"
			aria-label="장소 상세"
		>
			<div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
				<h2 className="m-0 text-lg font-bold">{place.name}</h2>
				<button
					onClick={onClose}
					aria-label="닫기"
					className="text-gray-500 hover:text-gray-700 text-xl"
				>
					✕
				</button>
			</div>

			{place.photoUrl && (
				<img src={place.photoUrl} alt={place.name} className="w-full h-44 object-cover" />
			)}

			<div className="p-4 space-y-2 text-sm">
				{(place.rating || place.userRatingsTotal) && (
					<div>
						⭐ {place.rating ?? '-'} ({place.userRatingsTotal ?? 0})
					</div>
				)}
				{place.address && <div className="text-gray-600">{place.address}</div>}
				{place.phone && <div>📞 {place.phone}</div>}
				{place.website && (
					<a
						href={place.website}
						target="_blank"
						rel="noreferrer"
						className="text-blue-600 underline"
					>
						웹사이트 열기
					</a>
				)}
			</div>
		</aside>
	)
}
