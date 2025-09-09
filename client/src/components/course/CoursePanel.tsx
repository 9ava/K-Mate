// src/components/course/CoursePanel.tsx
import { useMemo } from 'react'
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SortableItem from './SortableItem'

type Stop = { id: string; name: string; lat: number; lng: number }

export default function CoursePanel({
	stops,
	setStops,
}: {
	stops: Stop[]
	setStops: (s: Stop[]) => void
}) {
	const sensors = useSensors(useSensor(PointerSensor))
	const ids = useMemo(() => stops.map((s) => s.id), [stops])

	const onDragEnd = (e: DragEndEvent) => {
		const { active, over } = e
		if (!over || active.id === over.id) return
		const oldIdx = ids.indexOf(String(active.id))
		const newIdx = ids.indexOf(String(over.id))
		setStops(arrayMove(stops, oldIdx, newIdx))
	}

	return (
		<div className="p-3 border-l w-80">
			<h3 className="mb-3 font-semibold">내 코스</h3>
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
	)
}
