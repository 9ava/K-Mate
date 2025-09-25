import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, useEffect } from 'react'
import { getPlaceDetail } from '../../api/places'

type Stop = { 
	id: string
	name: string
	lat: number
	lng: number
	address?: string
	placeId?: string
	photoUrl?: string
	description?: string
	category?: string
	types?: string[]
}

interface PlaceInfo {
	photoUrl?: string
	description?: string
	category?: string
	types?: string[]
}

export default function SortableItem({
	id,
	index,
	stop,
	onRemove,
}: {
	id: string
	index: number
	stop: Stop
	onRemove: (stopId: string) => void
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
	})

	const [placeInfo, setPlaceInfo] = useState<PlaceInfo>({})
	const [loading, setLoading] = useState(false)

	// Google Place 상세정보 로드
	useEffect(() => {
		const loadPlaceInfo = async () => {
			if (stop.placeId || stop.id) {
				try {
					setLoading(true)
					const placeId = stop.placeId || stop.id
					const placeDetail = await getPlaceDetail(placeId)
					
					setPlaceInfo({
						photoUrl: placeDetail.photoUrl,
						description: placeDetail.description || undefined,
						category: placeDetail.type || undefined,
						types: placeDetail.sourceTypesJson || []
					})
				} catch (error) {
					console.warn('Failed to load place detail:', error)
					// 기본값 사용
					setPlaceInfo({
						photoUrl: undefined,
						description: stop.description,
						category: stop.category,
						types: stop.types || []
					})
				} finally {
					setLoading(false)
				}
			}
		}

		loadPlaceInfo()
	}, [stop.id, stop.placeId])

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.6 : 1,
	}

	return (
		<li
			ref={setNodeRef}
			style={style}
			className="bg-white border rounded-lg shadow-sm overflow-hidden"
		>
			<div className="flex">
				{/* 사진 영역 */}
				<div className="w-16 h-16 flex-shrink-0 relative overflow-hidden">
					{loading ? (
						<div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
							<div className="text-xs text-gray-400">...</div>
						</div>
					) : placeInfo.photoUrl ? (
						<img 
							src={placeInfo.photoUrl} 
							alt={stop.name}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full bg-gray-200 flex items-center justify-center">
							<svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
						</div>
					)}
					
					{/* 순서 번호 */}
					<div className="absolute top-1 left-1 w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-medium">
						{index + 1}
					</div>
				</div>

				{/* 내용 영역 */}
				<div className="flex-1 p-2 min-w-0">
					<div className="flex items-center justify-between">
						<div className="flex-1 min-w-0">
							<h4 className="font-medium text-sm text-gray-900 truncate mb-1">
								{stop.name}
							</h4>
							
							{stop.address && (
								<p className="text-xs text-gray-500 truncate mb-1">
									{stop.address}
								</p>
							)}
							
							{placeInfo.description && (
								<p className="text-xs text-gray-600 truncate">
									{placeInfo.description}
								</p>
							)}
						</div>

						{/* 액션 버튼들 */}
						<div className="flex gap-1 ml-2">
							{/* 삭제 버튼 */}
							<button
								onClick={() => onRemove(stop.id)}
								className="w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-50 rounded transition-colors"
								title="장소 삭제"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
							</button>
							
							{/* 드래그 핸들 */}
							<button
								{...attributes}
								{...listeners}
								className="w-6 h-6 flex items-center justify-center text-gray-400 hover:bg-gray-50 rounded cursor-grab transition-colors"
								title="순서 변경"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			</div>
		</li>
	)
}
