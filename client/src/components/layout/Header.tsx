// src/components/layout/Header.tsx
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../common/LanguageSwitcher'

function GoogleLoginButton() {
	const { loginWithGoogle } = useAuth()
	const { t } = useTranslation('common')
	return (
		<button
			onClick={loginWithGoogle}
			className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-full shadow hover:bg-gray-50"
		>
			<img
				src="https://developers.google.com/identity/images/g-logo.png"
				alt="Google"
				className="w-5 h-5"
			/>
			{t('auth.continue_google')}
		</button>
	)
}

export default function Header() {
	const { isAuthed, initial, email, logout } = useAuth()
	const { t } = useTranslation('common')

	return (
		<header className="fixed top-0 left-0 right-0 z-50 border-b h-14 bg-white/90 backdrop-blur">
			<div className="flex items-center justify-between h-full px-4 mx-auto max-w-screen-2xl">
				{/* 좌측: 로고 */}
				<div className="flex items-center gap-4">
					<Link to="/" className="flex items-center gap-2">
						<div className="grid w-8 h-8 text-sm font-bold text-white bg-black rounded-full place-items-center">
							K
						</div>
						<span className="font-semibold">{t('app.title')}</span>
					</Link>
				</div>

				{/* 중앙: Nav (번역 적용) */}
				<nav className="flex items-center gap-6 text-sm">
					<NavLink to="/kmap">{t('nav.kmap')}</NavLink>
					<NavLink to="/kcourse">{t('nav.kcourse')}</NavLink>
					<NavLink to="/buzz">{t('nav.kbuzz')}</NavLink>
				</nav>

				{/* 우측: 언어 스위처 + 로그인/아바타 */}
				<div className="flex items-center gap-3">
					<LanguageSwitcher />
					{isAuthed ? (
						<div className="relative group">
							<div className="grid w-8 h-8 text-sm font-bold text-white bg-blue-500 rounded-full cursor-pointer place-items-center">
								{initial}
							</div>
							<div className="absolute right-0 hidden p-2 mt-2 bg-white border rounded-lg shadow w-44 group-hover:block">
								<div className="px-2 py-1 text-xs text-gray-500">{email}</div>
								<hr className="my-2" />
								<button
									onClick={logout}
									className="w-full px-3 py-2 text-left rounded hover:bg-gray-100"
								>
									{t('auth.signout')}
								</button>
							</div>
						</div>
					) : (
						<GoogleLoginButton />
					)}
				</div>
			</div>
		</header>
	)
}
