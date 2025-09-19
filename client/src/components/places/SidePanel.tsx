import { useState } from 'react'
import type { Place } from '../../types/place'
import { addBookmark, removeBookmark } from '../../api/bookmarks'

export type SidePanelProps = {
	place: Place
	onClose: () => void
}

export default function SidePanel({ place, onClose }: SidePanelProps) {
	const [bmLoading, setBmLoading] = useState<'add' | 'remove' | null>(null)

	const handleAdd = async () => {
		try {
			setBmLoading('add')
			await addBookmark(place.googlePlaceId)
			alert('북마크에 추가했어요 ✅')
		} catch (e: any) {
			if (e?.response?.status === 403) alert('로그인이 필요합니다. 먼저 로그인해 주세요.')
			else alert('추가 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.')
		} finally {
			setBmLoading(null)
		}
	}

	const handleRemove = async () => {
		try {
			setBmLoading('remove')
			await removeBookmark(place.googlePlaceId)
			alert('북마크에서 제거했어요 🗑️')
		} catch (e: any) {
			if (e?.response?.status === 403) alert('로그인이 필요합니다. 먼저 로그인해 주세요.')
			else alert('제거 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.')
		} finally {
			setBmLoading(null)
		}
	}

	return (
		<aside
			className="h-full w-[400px] max-w-[95vw] shrink-0 bg-white border-r border-gray-200 flex flex-col"
			role="dialog"
			aria-label="장소 상세"
		>
			<div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
				<h2 className="m-0 text-lg font-bold">{place.name}</h2>
				<button
					onClick={onClose}
					aria-label="닫기"
					className="text-xl text-gray-500 hover:text-gray-700"
				>
					✕
				</button>
			</div>

			{place.photoUrl && (
				<img src={place.photoUrl} alt={place.name} className="object-cover w-full h-44" />
			)}

			<div className="p-4 space-y-3 text-sm">
				{(place.rating || place.userRatingsTotal) && (
					<div>
						⭐ {place.rating ?? '-'} ({place.userRatingsTotal ?? 0})
					</div>
				)}
				{place.address && <div className="text-gray-600">{place.address}</div>}
				{place.phone && <div>📞 {place.phone}</div>}

				{/* 웹사이트 바로가기 */}
				{place.website && (
					<a
						href={place.website}
						target="_blank"
						rel="noreferrer"
						className="inline-block text-blue-600 underline"
					>
						웹사이트 열기
					</a>
				)}

				{/* Google 지도 열기 */}
				{place.googleMapsUrl && (
					<a
						href={place.googleMapsUrl}
						target="_blank"
						rel="noreferrer"
						className="inline-block text-blue-600 underline"
					>
						Google 지도로 보기
					</a>
				)}

				{/* 북마크 */}
				<div className="flex gap-2 pt-2">
					<button
						onClick={handleAdd}
						disabled={bmLoading !== null}
						className="px-3 py-1.5 rounded-md bg-blue-600 text-white disabled:opacity-60"
					>
						{bmLoading === 'add' ? '추가 중…' : '북마크 추가'}
					</button>
					<button
						onClick={handleRemove}
						disabled={bmLoading !== null}
						className="px-3 py-1.5 rounded-md bg-gray-200 text-gray-800 disabled:opacity-60"
					>
						{bmLoading === 'remove' ? '삭제 중…' : '북마크 제거'}
					</button>
				</div>

				<p className="text-xs text-gray-500">
					* 북마크 기능은 로그인 후 이용할 수 있어요. (JWT 쿠키 기반)
				</p>
			</div>
		</aside>
	)
}
