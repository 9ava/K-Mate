import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getUserActivityStats } from '../api/mypage'
import type { UserActivityStats } from '../api/mypage'
import { useAuth } from '../features/auth/useAuth'

interface ActivityCardProps {
	iconClass: string
	title: string
	count: number
	category: 'K-Map' | 'K-Course' | 'K-Buzz'
	onClick?: () => void
}

const ActivityCard = ({ iconClass, title, count, category, onClick }: ActivityCardProps) => {
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
		<div 
			className="p-8 transition-all duration-200 bg-white border-2 border-gray-200 shadow-sm cursor-pointer rounded-xl hover:shadow-lg"
			onClick={onClick}
		>
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
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { isAuthed } = useAuth()
	const [stats, setStats] = useState<UserActivityStats | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// API에서 활동 통계 로드
	useEffect(() => {
		if (!isAuthed) {
			navigate('/login')
			return
		}

		const loadStats = async () => {
			try {
				setLoading(true)
				const data = await getUserActivityStats()
				setStats(data)
				setError(null)
			} catch (error) {
				console.error('활동 통계 로드 실패:', error)
				setError(t('mypage.messages.failed_to_load_stats'))
			} finally {
				setLoading(false)
			}
		}

		loadStats()
	}, [isAuthed, navigate])

	// 로딩 중이거나 인증되지 않은 경우
	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center">
					<div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
					<p className="text-gray-600">{t('mypage.messages.loading_stats')}</p>
				</div>
			</div>
		)
	}

	if (error || !stats) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center">
					<p className="mb-4 text-red-600">{error || t('mypage.messages.failed_to_load_data')}</p>
					<button 
						onClick={() => window.location.reload()} 
						className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
					>
						{t('mypage.buttons.retry')}
					</button>
				</div>
			</div>
		)
	}

	// 클릭 핸들러들
	const handleBookmarksClick = () => {
		navigate('/mypage/bookmarks')
	}

	const handleSavedCoursesClick = () => {
		navigate('/mypage/courses?tab=saved')
	}

	const handleMyCoursesClick = () => {
		navigate('/mypage/courses?tab=created')
	}

	const handleScrapsClick = () => {
		navigate('/mypage/scraps')
	}

	const handlePostsClick = () => {
		navigate('/mypage/posts')
	}

	const handleCommentsClick = () => {
		navigate('/mypage/comments')
	}

	// 위쪽 3개 - 장소/코스 관련
	const topActivities = [
		{ 
			iconClass: 'fi-rr-bookmark', 
			title: t('mypage.titles.bookmarks'), 
			count: stats.bookmarkCount, 
			category: 'K-Map' as const,
			onClick: handleBookmarksClick
		},
		{ 
			iconClass: 'fi-rr-map-marker', 
			title: t('mypage.titles.saved_courses'), 
			count: stats.savedCourseCount, 
			category: 'K-Course' as const,
			onClick: handleSavedCoursesClick
		},
		{ 
			iconClass: 'fi-rr-map-marker-plus', 
			title: t('mypage.titles.created_courses'), 
			count: stats.courseCount, 
			category: 'K-Course' as const,
			onClick: handleMyCoursesClick
		},
	]

	// 아래쪽 3개 - 글/댓글 관련
	const bottomActivities = [
		{ 
			iconClass: 'fi-rr-document', 
			title: t('mypage.titles.scraps'), 
			count: stats.scrapCount, 
			category: 'K-Buzz' as const,
			onClick: handleScrapsClick
		},
		{ 
			iconClass: 'fi-rr-edit', 
			title: t('mypage.titles.posts'), 
			count: stats.postCount, 
			category: 'K-Buzz' as const,
			onClick: handlePostsClick
		},
		{ 
			iconClass: 'fi-rr-comment-alt', 
			title: t('mypage.titles.comments'), 
			count: stats.commentCount, 
			category: 'K-Buzz' as const,
			onClick: handleCommentsClick
		},
	]

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-4xl mx-auto">
				<div className="px-6 py-8">
					<h1 className="mb-16 text-2xl font-bold text-center text-gray-900">{t('mypage.titles.my_activities')}</h1>

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
									onClick={activity.onClick}
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
									onClick={activity.onClick}
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
