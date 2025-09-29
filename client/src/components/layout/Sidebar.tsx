// src/components/layout/Sidebar.tsx
import type React from 'react'
import { useNavigate } from 'react-router-dom'
import type { PlaceType } from '../../types/place'

type Props = {
	active?: PlaceType | ''
	onSelectType?: (t: PlaceType) => void
	onShowBookmarks?: () => void // ✅ 추가
	onToggleMenu?: () => void // ✅ Menu 토글 핸들러 추가
	isMenuOpen?: boolean // ✅ Menu 열림 상태
	isBookmarkMode?: boolean // ✅ 북마크 모드 상태
}

const Sidebar: React.FC<Props> = ({
	active = '',
	onSelectType,
	onShowBookmarks,
	onToggleMenu,
	isMenuOpen = false,
	isBookmarkMode = false,
}) => {
	const navigate = useNavigate()
	const menuItems: Array<{
		icon: string
		label: string
		type?: PlaceType
		action?: () => void
		id: string
	}> = [
		{ icon: '☰', label: 'Menu', action: onToggleMenu, id: 'menu' },
		{ icon: '🔖', label: 'Bookmark', action: onShowBookmarks, id: 'bookmark' },
		{ icon: '🌆', label: 'K-Travel', type: 'travel', id: 'travel' },
		{ icon: '🍽️', label: 'K-Food', type: 'food', id: 'food' },
		{ icon: '☕', label: 'K-Cafe', type: 'cafe', id: 'cafe' },
	]

	return (
		<aside className="flex flex-col items-center w-16 py-4 space-y-4 bg-white border-r border-gray-200 shadow-sm">
			{menuItems.map((item, idx) => {
				const isCategory = !!item.type
				const isCategoryActive = isCategory && active === item.type
				const isMenuActive = item.id === 'menu' && isMenuOpen
				const isBookmarkActive = item.id === 'bookmark' && isBookmarkMode
				const isActive = isCategoryActive || isMenuActive || isBookmarkActive

				return (
					<button
						key={idx}
						title={item.label}
						onClick={() => (item.type ? onSelectType?.(item.type) : item.action?.())}
						className={[
							'flex items-center justify-center w-10 h-10 rounded-lg transition-colors cursor-pointer',
							isActive
								? 'bg-gray-700 text-white' // 회색 테마로 통일
								: 'hover:bg-gray-100',
						].join(' ')}
					>
						<span className="text-lg">{item.icon}</span>
					</button>
				)
			})}

			<div className="flex-1" />
			<div className="space-y-2">
				<button
					onClick={() => navigate('/tips')}
					className="flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer hover:bg-gray-100"
					title="K-Tips"
				>
					<span className="text-sm font-bold">TIPS</span>
				</button>
			</div>
		</aside>
	)
}

export default Sidebar
