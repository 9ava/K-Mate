import { useState } from 'react'
import type { Place } from '../../types/place'
import { addBookmark, removeBookmark } from '../../api/bookmarks'

export type SidePanelProps = {
	place: Place
	onClose: () => void
	onBookmarkChange?: () => void // 북마크 변경 시 호출될 콜백
	isBookmarked?: boolean // 현재 북마크 상태
}

export default function SidePanel({ place, onClose, onBookmarkChange, isBookmarked = false }: SidePanelProps) {
	const [bmLoading, setBmLoading] = useState<'add' | 'remove' | null>(null)

	const handleAdd = async () => {
		// 이미 북마크된 경우 경고 메시지
		if (isBookmarked) {
			alert('이미 북마크된 장소입니다')
			return
		}
		
		try {
			setBmLoading('add')
			await addBookmark(place.googlePlaceId)
			alert('북마크에 추가했어요 ✅')
			onBookmarkChange?.() // 북마크 리스트 새로고침
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
			onBookmarkChange?.() // 북마크 리스트 새로고침
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
				<div className="flex items-center flex-1 min-w-0 gap-2">
					<h2 className="m-0 text-lg font-bold truncate">{place.name}</h2>
					{place.isAdvertisement && (
						<span className="px-2 py-1 text-xs text-gray-600 bg-white border border-gray-300 rounded-full shrink-0">
							광고 ⓘ
						</span>
					)}
				</div>
				<button
					onClick={onClose}
					aria-label="닫기"
					className="ml-2 text-xl text-gray-500 hover:text-gray-700 shrink-0"
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
				<div className="flex justify-center gap-2 pt-2">
					<button
						onClick={handleAdd}
						disabled={bmLoading !== null || isBookmarked}
						className={`px-3 py-1.5 rounded-md disabled:opacity-60 ${
							isBookmarked 
								? 'bg-green-600 text-white cursor-not-allowed' 
								: 'bg-blue-600 text-white hover:bg-blue-700'
						}`}
					>
						{isBookmarked 
							? '✅ 북마크됨' 
							: bmLoading === 'add' 
								? '추가 중…' 
								: '북마크 추가'
						}
					</button>
					{isBookmarked && (
						<button
							onClick={handleRemove}
							disabled={bmLoading !== null}
							className="px-3 py-1.5 rounded-md bg-gray-200 text-gray-800 disabled:opacity-60 hover:bg-gray-300"
						>
							{bmLoading === 'remove' ? '삭제 중…' : '북마크 제거'}
						</button>
					)}
				</div>

				<p className="text-xs text-gray-500">
					* 북마크 기능은 로그인 후 이용할 수 있어요. (JWT 쿠키 기반)
				</p>
			</div>
		</aside>
	)
}
