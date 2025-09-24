// src/components/course/CoursePanel.tsx
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SortableItem from './SortableItem'

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
	const { t } = useTranslation()
	const sensors = useSensors(useSensor(PointerSensor))
	const ids = useMemo(() => stops.map((s) => s.id), [stops])

	const [title, setTitle] = useState(initialTitle || t('planner.course.default_title'))
	const [visibility, setVisibility] = useState<'public' | 'private'>(initialVisibility || 'public')

	const onDragEnd = (e: DragEndEvent) => {
		const { active, over } = e
		if (!over || active.id === over.id) return
		const oldIdx = ids.indexOf(String(active.id))
		const newIdx = ids.indexOf(String(over.id))
		setStops(arrayMove(stops, oldIdx, newIdx))
	}

	const removeStop = (stopId: string) => {
		setStops(stops.filter(stop => stop.id !== stopId))
	}

	return (
		<div className="flex flex-col h-full w-80">
			{/* 상단 폼 */}
			<div className="p-3 space-y-3 border-b">
				<h3 className="font-semibold">{t('planner.course.title')}</h3>
				<div className="space-y-2">
					<label className="text-sm text-gray-600">{t('planner.course.course_title_label')}</label>
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder={t('planner.course.course_title_placeholder')}
						className="w-full px-3 py-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div className="space-y-2">
					<label className="text-sm text-gray-600">{t('planner.course.visibility_label')}</label>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => setVisibility('public')}
							className={`px-3 py-1 rounded border ${
								visibility === 'public' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'
							}`}
						>
							{t('planner.course.public')}
						</button>
						<button
							type="button"
							onClick={() => setVisibility('private')}
							className={`px-3 py-1 rounded border ${
								visibility === 'private' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'
							}`}
						>
							{t('planner.course.private')}
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
								<SortableItem 
									key={s.id} 
									id={s.id} 
									index={i} 
									stop={s} 
									onRemove={removeStop}
								/>
							))}
						</ul>
					</SortableContext>
				</DndContext>
			</div>

			{/* 하단 저장 바 */}
			<div className="p-3 mt-auto bg-white border-t">
				<div className="flex items-center justify-between">
					<span className="text-sm text-gray-500">
						{t('planner.course.places_count')}: {stops.length}{t('planner.course.places_unit')}
					</span>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => setStops([])}
							className="px-3 py-2 border rounded hover:bg-gray-50"
						>
							{t('planner.course.reset')}
						</button>
						<button
							type="button"
							disabled={saving}
							onClick={() => onSave({ title, visibility })}
							className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
						>
							{saving ? t('planner.course.saving') : t('planner.course.save_course')}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
