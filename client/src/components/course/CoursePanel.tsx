// src/components/course/CoursePanel.tsx
import { useMemo, useState } from 'react'
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SortableItem from './SortableItem'

type Stop = { id: string; name: string; lat: number; lng: number }

export default function CoursePanel({
	stops,
	setStops,
	onSave,
	saving,
	initialTitle,
	initialVisibility,
}: {
	stops: Stop[]
	setStops: (s: Stop[]) => void
	onSave: (payload: { title: string; visibility: 'public' | 'private' }) => void
	saving?: boolean
	initialTitle?: string
	initialVisibility?: 'public' | 'private'
}) {
	const sensors = useSensors(useSensor(PointerSensor))
	const ids = useMemo(() => stops.map((s) => s.id), [stops])

	const [title, setTitle] = useState(initialTitle || '나의 첫 여행코스')
	const [visibility, setVisibility] = useState<'public' | 'private'>(initialVisibility || 'public')

	const onDragEnd = (e: DragEndEvent) => {
		const { active, over } = e
		if (!over || active.id === over.id) return
		const oldIdx = ids.indexOf(String(active.id))
		const newIdx = ids.indexOf(String(over.id))
		setStops(arrayMove(stops, oldIdx, newIdx))
	}

	return (
		<div className="flex flex-col h-full w-80">
			{/* 상단 폼 */}
			<div className="p-3 space-y-3 border-b">
				<h3 className="font-semibold">내 코스</h3>
				<div className="space-y-2">
					<label className="text-sm text-gray-600">코스 제목</label>
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="예) 제주 2박3일 카페투어"
						className="w-full px-3 py-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600">공개 범위</label>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => setVisibility('public')}
							className={`px-3 py-1 rounded border ${
								visibility === 'public' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'
							}`}
						>
							공개
						</button>
						<button
							type="button"
							onClick={() => setVisibility('private')}
							className={`px-3 py-1 rounded border ${
								visibility === 'private' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'
							}`}
						>
							비공개
						</button>
					</div>
				</div>
			</div>

			{/* 리스트 (정렬 가능) */}
			<div className="p-3 overflow-y-auto">
				<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
					<SortableContext items={ids} strategy={verticalListSortingStrategy}>
						<ul className="space-y-2">
							{stops.map((s, i) => (
								<SortableItem key={s.id} id={s.id} index={i} name={s.name} />
							))}
						</ul>
					</SortableContext>
				</DndContext>
			</div>

			{/* 하단 저장 바 */}
			<div className="p-3 mt-auto bg-white border-t">
				<div className="flex items-center justify-between">
					<span className="text-sm text-gray-500">담긴 장소: {stops.length}개</span>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => setStops([])}
							className="px-3 py-2 border rounded hover:bg-gray-50"
						>
							초기화
						</button>
						<button
							type="button"
							disabled={saving}
							onClick={() => onSave({ title, visibility })}
							className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
						>
							{saving ? '저장중…' : '코스 저장'}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
