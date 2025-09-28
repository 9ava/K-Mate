import { useAuth } from '../../features/auth/useAuth'
import { useTranslation } from 'react-i18next'

export default function GoogleLoginButton() {
	const { loginWithGoogle } = useAuth()
	const { t } = useTranslation()
	
	return (
		<button
			onClick={loginWithGoogle}
			className="w-full flex items-center justify-center gap-3 px-6 py-4 text-base font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 group cursor-pointer"
		>
			<div className="flex items-center justify-center w-6 h-6 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow duration-200">
				<img
					src="https://developers.google.com/identity/images/g-logo.png"
					alt="Google"
					className="w-4 h-4"
				/>
			</div>
			<span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text">
				{t('auth.continue_google')}
			</span>
			<svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
			</svg>
		</button>
	)
}
