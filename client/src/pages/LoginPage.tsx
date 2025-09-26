import GoogleLoginButton from '../components/common/GoogleLoginButton'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import kmateLogo from '../assets/kmate_logo.png'

export default function LoginPage() {
	const { t } = useTranslation()
	
	const msg = useMemo(() => {
		const q = new URLSearchParams(window.location.search)
		const err = q.get('error')
		if (err === 'oauth_failed') return t('auth.error_oauth_failed')
		return ''
	}, [t])

	return (
		<div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
			<div className="w-full max-w-md">
				{/* Hero Section */}
				<div className="mb-8 text-center">
					<div className="inline-flex items-center justify-center w-16 h-16 mb-6">
						<img 
							src={kmateLogo} 
							alt="K-Mate Logo" 
							className="object-contain w-full h-full"
						/>
					</div>
					<h1 className="mb-2 text-3xl font-bold text-gray-900">{t('auth.welcome_title')}</h1>
					<p className="text-gray-600">{t('auth.welcome_subtitle')}</p>
				</div>

				{/* Login Card */}
				<div className="p-8 bg-white border border-gray-100 shadow-xl rounded-2xl">
					{msg && (
						<div className="p-4 mb-6 border border-red-200 rounded-lg bg-red-50">
							<div className="flex items-center">
								<svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
								</svg>
								<span className="text-sm font-medium text-red-700">{msg}</span>
							</div>
						</div>
					)}

					<div className="space-y-6">
						<div className="text-center">
							<h2 className="mb-2 text-xl font-semibold text-gray-900">{t('auth.login_title')}</h2>
							<p className="text-sm text-gray-500">{t('auth.login_subtitle')}</p>
						</div>

						<GoogleLoginButton />

						<div className="text-center">
							<p className="text-xs text-gray-400">
								{t('auth.terms_notice')}
							</p>
						</div>
					</div>
				</div>

				{/* Features Preview */}
				<div className="grid grid-cols-3 gap-4 mt-8 text-center">
					<div className="p-4 border bg-white/50 backdrop-blur-sm rounded-xl border-white/20">
						<div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 bg-blue-100 rounded-lg">
							<span className="text-lg text-blue-600">🗺️</span>
						</div>
						<h3 className="mb-1 text-sm font-medium text-gray-900">{t('features.kmap.title')}</h3>
						<p className="text-xs text-gray-500">{t('features.kmap.description')}</p>
					</div>
					<div className="p-4 border bg-white/50 backdrop-blur-sm rounded-xl border-white/20">
						<div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 bg-green-100 rounded-lg">
							<span className="text-lg text-green-600">📝</span>
						</div>
						<h3 className="mb-1 text-sm font-medium text-gray-900">{t('features.kcourse.title')}</h3>
						<p className="text-xs text-gray-500">{t('features.kcourse.description')}</p>
					</div>
					<div className="p-4 border bg-white/50 backdrop-blur-sm rounded-xl border-white/20">
						<div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 bg-orange-100 rounded-lg">
							<span className="text-lg text-orange-600">💬</span>
						</div>
						<h3 className="mb-1 text-sm font-medium text-gray-900">{t('features.kbuzz.title')}</h3>
						<p className="text-xs text-gray-500">{t('features.kbuzz.description')}</p>
					</div>
				</div>
			</div>
		</div>
	)
}
