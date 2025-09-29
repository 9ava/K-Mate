// src/components/course/CoursePanel.tsx
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SortableItem from './SortableItem'
import { searchGooglePlaces, type GooglePlace } from '../../lib/googlePlaces'

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
	selectedCategory,
	onCategoryChange,
}: {
	stops: Stop[]
	setStops: React.Dispatch<React.SetStateAction<Stop[]>>
	onSave: (payload: { title: string; visibility: 'public' | 'private' }) => void
	saving?: boolean
	initialTitle?: string
	initialVisibility?: 'public' | 'private'
	selectedCategory?: 'all' | 'cultural' | 'cafe' | 'food'
	onCategoryChange?: (category: 'all' | 'cultural' | 'cafe' | 'food') => void
}) {
	const { t, i18n } = useTranslation()
	const sensors = useSensors(useSensor(PointerSensor))
	const ids = useMemo(() => stops.map((s) => s.id), [stops])

	const [title, setTitle] = useState(initialTitle || t('planner.course.default_title'))
	const [visibility, setVisibility] = useState<'public' | 'private'>(initialVisibility || 'public')

	// Search functionality
	const [searchQuery, setSearchQuery] = useState('')
	const [searchResults, setSearchResults] = useState<GooglePlace[]>([])
	const [searchLoading, setSearchLoading] = useState(false)

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

	// Search places functionality
	const searchPlaces = async () => {
		if (!searchQuery.trim()) return

		setSearchLoading(true)
		try {
			const results = await searchGooglePlaces(searchQuery.trim(), i18n.language)
			setSearchResults(results)
		} catch (error) {
			console.error('Search failed:', error)
			setSearchResults([])
		} finally {
			setSearchLoading(false)
		}
	}

	const addSearchResultToStops = (result: GooglePlace) => {
		const newStop: Stop = {
			id: result.placeId,
			name: result.name,
			lat: result.lat,
			lng: result.lng,
			address: result.address,
			placeId: result.placeId,
		}

		// Check if stop already exists
		if (!stops.some((s) => s.id === result.placeId)) {
			setStops((prev) => [...prev, newStop])
		}

		// Clear search results after adding
		setSearchResults([])
		setSearchQuery('')
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
							className={`px-3 py-1 rounded border cursor-pointer ${
								visibility === 'public' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'
							}`}
						>
							{t('planner.course.public')}
						</button>
						<button
							type="button"
							onClick={() => setVisibility('private')}
							className={`px-3 py-1 rounded border cursor-pointer ${
								visibility === 'private' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'
							}`}
						>
							{t('planner.course.private')}
						</button>
					</div>
				</div>

				{/* 카테고리 선택 */}
				{onCategoryChange && (
					<div className="space-y-2">
						<label className="text-sm text-gray-600">{t('planner.course.category') || '카테고리'}</label>
						<div className="grid grid-cols-2 gap-2">
							<button
								type="button"
								onClick={() => onCategoryChange('all')}
								className={`px-3 py-2 rounded border text-sm flex items-center gap-2 cursor-pointer ${
									selectedCategory === 'all' ? 'bg-purple-500 text-white border-purple-500' : 'bg-white'
								}`}
							>
								<div className="w-3 h-3 bg-purple-500 rounded-full"></div>
								{t('kcourse.categories.all')}
							</button>
							<button
								type="button"
								onClick={() => onCategoryChange('cultural')}
								className={`px-3 py-2 rounded border text-sm flex items-center gap-2 cursor-pointer ${
									selectedCategory === 'cultural' ? 'bg-blue-400 text-white border-blue-400' : 'bg-white'
								}`}
							>
								<div className="w-3 h-3 bg-blue-400 rounded-full"></div>
								{t('kcourse.categories.cultural')}
							</button>
							<button
								type="button"
								onClick={() => onCategoryChange('cafe')}
								className={`px-3 py-2 rounded border text-sm flex items-center gap-2 cursor-pointer ${
									selectedCategory === 'cafe' ? 'bg-amber-400 text-white border-amber-400' : 'bg-white'
								}`}
							>
								<div className="w-3 h-3 rounded-full bg-amber-400"></div>
								{t('kcourse.categories.cafe')}
							</button>
							<button
								type="button"
								onClick={() => onCategoryChange('food')}
								className={`px-3 py-2 rounded border text-sm flex items-center gap-2 cursor-pointer ${
									selectedCategory === 'food' ? 'bg-red-400 text-white border-red-400' : 'bg-white'
								}`}
							>
								<div className="w-3 h-3 bg-red-400 rounded-full"></div>
								{t('kcourse.categories.food')}
							</button>
						</div>
					</div>
				)}

				{/* Search Bar */}
				<div className="space-y-2">
					<label className="text-sm text-gray-600">{t('planner.search.label')}</label>
					<div className="flex gap-2">
						<input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyPress={(e) => e.key === 'Enter' && searchPlaces()}
							className="flex-1 px-3 py-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
							placeholder={t('planner.search.placeholder')}
							disabled={searchLoading}
						/>
						<button
							onClick={searchPlaces}
							disabled={searchLoading || !searchQuery.trim()}
							className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
						>
							{searchLoading ? t('planner.search.searching') : t('planner.search.button')}
						</button>
					</div>

					{/* Search Results */}
					{searchResults.length > 0 && (
						<div className="max-h-48 overflow-y-auto border rounded bg-gray-50">
							<div className="p-2 text-xs text-gray-500 border-b bg-white">
								{t('planner.search.results', { count: searchResults.length })}
							</div>
							<ul className="divide-y">
								{searchResults.map((result) => (
									<li key={result.placeId} className="p-2 hover:bg-white transition-colors">
										<div className="flex items-start justify-between gap-2">
											<div className="flex-1 min-w-0">
												<div className="font-medium text-sm truncate">
													{result.name}
												</div>
												<div className="text-xs text-gray-500 truncate">
													{result.address}
												</div>
											</div>
											<button
												onClick={() => addSearchResultToStops(result)}
												disabled={stops.some((s) => s.id === result.placeId)}
												className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
											>
												{stops.some((s) => s.id === result.placeId) ? t('planner.search.added') : t('planner.search.add')}
											</button>
										</div>
									</li>
								))}
							</ul>
						</div>
					)}
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
									isLast={i === stops.length - 1}
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
							className="px-3 py-2 border rounded hover:bg-gray-50 cursor-pointer"
						>
							{t('planner.course.reset')}
						</button>
						<button
							type="button"
							disabled={saving}
							onClick={() => onSave({ title, visibility })}
							className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
						>
							{saving ? t('planner.course.saving') : t('planner.course.save_course')}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
