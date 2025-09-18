// src/components/layout/Sidebar.tsx
import type React from 'react'
import type { PlaceType } from '../../types/place'

type Props = {
	active?: PlaceType | ''
	onSelectType?: (t: PlaceType) => void
	onShowBookmarks?: () => void // ✅ 추가
}

const Sidebar: React.FC<Props> = ({ active = '', onSelectType, onShowBookmarks }) => {
	const menuItems: Array<{ icon: string; label: string; type?: PlaceType; action?: () => void }> = [
		{ icon: '☰', label: 'Menu' },
		{ icon: '🔖', label: 'Bookmark', action: onShowBookmarks }, 
		{ icon: '📍', label: 'K-Travel', type: 'travel' },
		{ icon: '🍽️', label: 'K-Food', type: 'food' },
		{ icon: '☕', label: 'K-Cafe', type: 'cafe' },
	]

	return (
		<aside className="flex flex-col items-center w-16 py-4 space-y-4 bg-white border-r border-gray-200 shadow-sm">
			{menuItems.map((item, idx) => {
				const isCategory = !!item.type
				const isActive = isCategory && active === item.type
				return (
					<button
						key={idx}
						title={item.label}
						onClick={() => (item.type ? onSelectType?.(item.type) : item.action?.())}
						className={[
							'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
							isCategory
								? isActive
									? 'bg-blue-600 text-white'
									: 'hover:bg-gray-100'
								: 'hover:bg-gray-100',
						].join(' ')}
					>
						<span className="text-lg">{item.icon}</span>
					</button>
				)
			})}

			<div className="flex-1" />
			<div className="space-y-2">
				<button className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100">
					<span className="text-sm font-bold">TIPS</span>
				</button>
			</div>
		</aside>
	)
}

export default Sidebar
