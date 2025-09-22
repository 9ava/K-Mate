import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function SortableItem({
	id,
	index,
	name,
}: {
	id: string
	index: number
	name: string
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
	})

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.6 : 1,
	}

	return (
		<li
			ref={setNodeRef}
			style={style}
			className="flex items-center gap-2 p-2 bg-white border rounded"
		>
			<span className="grid w-6 h-6 text-xs text-white bg-blue-600 rounded-full place-items-center">
				{index + 1}
			</span>
			<span className="flex-1 truncate">{name}</span>
			<button
				{...attributes}
				{...listeners}
				className="px-2 py-1 text-xs border rounded cursor-grab"
				aria-label="drag handle"
			>
				☰
			</button>
		</li>
	)
}
