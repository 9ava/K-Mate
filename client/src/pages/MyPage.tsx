interface ActivityCardProps {
	iconClass: string
	title: string
	count: number
	category: 'K-Map' | 'K-Course' | 'K-Buzz'
}

const ActivityCard = ({ iconClass, title, count, category }: ActivityCardProps) => {
	// 카테고리별 색상 설정 (테두리는 단색으로 통일)
	const getCategoryColors = (cat: string) => {
		switch (cat) {
			case 'K-Map':
				return {
					badge: 'bg-blue-500',
					icon: 'text-blue-600'
				}
			case 'K-Course':
				return {
					badge: 'bg-green-500',
					icon: 'text-green-600'
				}
			case 'K-Buzz':
				return {
					badge: 'bg-orange-500',
					icon: 'text-orange-600'
				}
			default:
				return {
					badge: 'bg-gray-500',
					icon: 'text-gray-600'
				}
		}
	}

	const colors = getCategoryColors(category)

	return (
		<div className="p-8 transition-all duration-200 bg-white border-2 border-gray-200 shadow-sm cursor-pointer rounded-xl hover:shadow-lg">
			<div className="flex flex-col items-center space-y-4">
				{/* 카테고리 배지 */}
				<div className={`px-3 py-1 text-xs font-bold text-white ${colors.badge} rounded-full`}>
					{category}
				</div>
				
				<div className="relative">
					{/* 아이콘 */}
					<i className={`${colors.icon} text-3xl ${iconClass}`}></i>
					<div className={`absolute flex items-center justify-center w-6 h-6 text-xs font-bold text-white ${colors.badge} rounded-full -top-2 -right-2 shadow-sm`}>
						{count}
					</div>
				</div>
				<span className="text-sm font-semibold text-center text-gray-800">{title}</span>
			</div>
		</div>
	)
}

const MyPage = () => {
	// 위쪽 3개 - 장소/코스 관련
	const topActivities = [
		{ iconClass: 'fi-rr-bookmark', title: '북마크한 장소', count: 0, category: 'K-Map' as const },
		{ iconClass: 'fi-rr-map-marker', title: '저장한 코스', count: 1, category: 'K-Course' as const },
		{ iconClass: 'fi-rr-map-marker-plus', title: '내가 만든 코스', count: 0, category: 'K-Course' as const },
	]

	// 아래쪽 3개 - 글/댓글 관련
	const bottomActivities = [
		{ iconClass: 'fi-rr-document', title: '스크랩한 글', count: 0, category: 'K-Buzz' as const },
		{ iconClass: 'fi-rr-edit', title: '내가 쓴 글', count: 0, category: 'K-Buzz' as const },
		{ iconClass: 'fi-rr-comment-alt', title: '내가 쓴 댓글', count: 0, category: 'K-Buzz' as const },
	]

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-4xl mx-auto">
				<div className="px-6 py-8">
					<h1 className="mb-16 text-2xl font-bold text-center text-gray-900">나의 활동</h1>

					{/* 위쪽 3개 - 장소/코스 관련 */}
					<div className="mb-16">
						<div className="grid grid-cols-3 gap-6">
							{topActivities.map((activity, index) => (
								<ActivityCard
									key={index}
									iconClass={activity.iconClass}
									title={activity.title}
									count={activity.count}
									category={activity.category}
								/>
							))}
						</div>
					</div>

					{/* 아래쪽 3개 - 글/댓글 관련 */}
					<div>
						<div className="grid grid-cols-3 gap-6">
							{bottomActivities.map((activity, index) => (
								<ActivityCard
									key={index}
									iconClass={activity.iconClass}
									title={activity.title}
									count={activity.count}
									category={activity.category}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default MyPage
