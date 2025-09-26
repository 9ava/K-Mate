import { useTranslation } from 'react-i18next'

interface ErrorDisplayProps {
	/** 에러 타입 */
	type?: 'network' | 'notFound' | 'unauthorized' | 'server' | 'validation' | 'default'
	/** 커스텀 제목 */
	title?: string
	/** 커스텀 메시지 */
	message?: string
	/** 재시도 버튼 표시 여부 */
	showRetry?: boolean
	/** 재시도 핸들러 */
	onRetry?: () => void
	/** 추가 액션 버튼들 */
	actions?: Array<{
		label: string
		onClick: () => void
		variant?: 'primary' | 'secondary' | 'danger'
	}>
	/** 크기 */
	size?: 'small' | 'medium' | 'large'
	/** 아이콘 숨기기 */
	hideIcon?: boolean
}

export default function ErrorDisplay({
	type = 'default',
	title,
	message,
	showRetry = false,
	onRetry,
	actions = [],
	size = 'medium',
	hideIcon = false
}: ErrorDisplayProps) {
	const { t } = useTranslation()

	// 에러 타입별 설정
	const getErrorConfig = () => {
		switch (type) {
			case 'network':
				return {
					icon: '🌐',
					title: title || t('error.network.title', '네트워크 연결 오류'),
					message: message || t('error.network.message', '인터넷 연결을 확인해주세요.'),
					color: 'text-orange-600',
					bgColor: 'bg-orange-50',
					borderColor: 'border-orange-200'
				}
			case 'notFound':
				return {
					icon: '🔍',
					title: title || t('error.notFound.title', '데이터를 찾을 수 없습니다'),
					message: message || t('error.notFound.message', '요청하신 정보가 존재하지 않습니다.'),
					color: 'text-blue-600',
					bgColor: 'bg-blue-50',
					borderColor: 'border-blue-200'
				}
			case 'unauthorized':
				return {
					icon: '🔒',
					title: title || t('error.unauthorized.title', '접근 권한이 없습니다'),
					message: message || t('error.unauthorized.message', '로그인이 필요한 서비스입니다.'),
					color: 'text-red-600',
					bgColor: 'bg-red-50',
					borderColor: 'border-red-200'
				}
			case 'server':
				return {
					icon: '⚠️',
					title: title || t('error.server.title', '서버 오류'),
					message: message || t('error.server.message', '잠시 후 다시 시도해주세요.'),
					color: 'text-red-600',
					bgColor: 'bg-red-50',
					borderColor: 'border-red-200'
				}
			case 'validation':
				return {
					icon: '📝',
					title: title || t('error.validation.title', '입력 오류'),
					message: message || t('error.validation.message', '입력하신 정보를 다시 확인해주세요.'),
					color: 'text-yellow-600',
					bgColor: 'bg-yellow-50',
					borderColor: 'border-yellow-200'
				}
			default:
				return {
					icon: '😵',
					title: title || t('error.default.title', '오류가 발생했습니다'),
					message: message || t('error.default.message', '예상치 못한 문제가 발생했습니다.'),
					color: 'text-gray-600',
					bgColor: 'bg-gray-50',
					borderColor: 'border-gray-200'
				}
		}
	}

	const config = getErrorConfig()

	// 크기별 클래스
	const sizeClasses = {
		small: {
			container: 'p-4',
			icon: 'text-2xl mb-2',
			title: 'text-sm font-semibold',
			message: 'text-xs text-gray-600 mt-1',
			button: 'px-3 py-1.5 text-xs'
		},
		medium: {
			container: 'p-6',
			icon: 'text-4xl mb-3',
			title: 'text-base font-semibold',
			message: 'text-sm text-gray-600 mt-2',
			button: 'px-4 py-2 text-sm'
		},
		large: {
			container: 'p-8',
			icon: 'text-6xl mb-4',
			title: 'text-lg font-semibold',
			message: 'text-base text-gray-600 mt-3',
			button: 'px-6 py-3 text-base'
		}
	}

	const classes = sizeClasses[size]

	// 버튼 스타일
	const getButtonClass = (variant: string = 'primary') => {
		const base = `${classes.button} font-medium rounded-lg transition-colors duration-200`
		switch (variant) {
			case 'primary':
				return `${base} bg-blue-600 text-white hover:bg-blue-700`
			case 'secondary':
				return `${base} bg-gray-200 text-gray-700 hover:bg-gray-300`
			case 'danger':
				return `${base} bg-red-600 text-white hover:bg-red-700`
			default:
				return `${base} bg-blue-600 text-white hover:bg-blue-700`
		}
	}

	return (
		<div className={`${config.bgColor} ${config.borderColor} border rounded-xl ${classes.container} text-center`}>
			{/* 아이콘 */}
			{!hideIcon && (
				<div className={classes.icon}>
					{config.icon}
				</div>
			)}

			{/* 제목 */}
			<h3 className={`${config.color} ${classes.title}`}>
				{config.title}
			</h3>

			{/* 메시지 */}
			<p className={classes.message}>
				{config.message}
			</p>

			{/* 액션 버튼들 */}
			{(showRetry || actions.length > 0) && (
				<div className="flex flex-wrap gap-2 justify-center mt-4">
					{showRetry && onRetry && (
						<button
							onClick={onRetry}
							className={getButtonClass('primary')}
						>
							<span className="flex items-center gap-1">
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
								{t('common.retry', '다시 시도')}
							</span>
						</button>
					)}
					{actions.map((action, index) => (
						<button
							key={index}
							onClick={action.onClick}
							className={getButtonClass(action.variant)}
						>
							{action.label}
						</button>
					))}
				</div>
			)}
		</div>
	)
}