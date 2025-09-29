// src/components/layout/Header.tsx
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import LanguageSwitcher from '../common/LanguageSwitcher'
import ContactModal from '../common/ContactModal'

function LoginButton() {
	const { t } = useTranslation('common')
	return (
		<Link
			to="/login"
			className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border rounded-full shadow hover:bg-gray-50 sm:gap-2 sm:px-4 sm:py-2 cursor-pointer"
		>
			<span>{t('auth.login', '로그인')}</span>
		</Link>
	)
}

export default function Header() {
	const { isAuthed, initial, email, logout, role } = useAuth()
	const { t } = useTranslation('common')
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const [isContactModalOpen, setIsContactModalOpen] = useState(false)

	return (
		<>
			<header className="fixed top-0 left-0 right-0 z-50 border-b h-14 bg-white/90 backdrop-blur">
				<div className="flex items-center justify-between h-full px-3 mx-auto sm:px-4 max-w-screen-2xl">
					{/* 좌측: 로고 */}
					<div className="flex items-center">
						<Link to="/" className="flex items-center gap-1.5 sm:gap-2">
							<div className="grid text-xs font-bold text-white bg-black rounded-full w-7 h-7 sm:w-8 sm:h-8 sm:text-sm place-items-center">
								K
							</div>
							<span className="text-sm font-semibold sm:text-base">- Mate</span>
						</Link>
					</div>

					{/* 중앙: Nav (데스크탑만 표시) */}
					<nav className="items-center hidden gap-4 text-sm md:flex lg:gap-6">
						<NavLink 
							to="/kmap"
							className={({ isActive }) => 
								`px-3 py-2 rounded-md transition-colors hover:bg-gray-100 ${
									isActive ? 'text-blue-600 font-medium' : 'text-gray-700'
								}`
							}
						>
							{t('nav.kmap')}
						</NavLink>
						<NavLink 
							to="/kcourse"
							className={({ isActive }) => 
								`px-3 py-2 rounded-md transition-colors hover:bg-gray-100 ${
									isActive ? 'text-blue-600 font-medium' : 'text-gray-700'
								}`
							}
						>
							{t('nav.kcourse')}
						</NavLink>
						<NavLink 
							to="/buzz"
							className={({ isActive }) => 
								`px-3 py-2 rounded-md transition-colors hover:bg-gray-100 ${
									isActive ? 'text-blue-600 font-medium' : 'text-gray-700'
								}`
							}
						>
							{t('nav.kbuzz')}
						</NavLink>
					</nav>

					{/* 우측: 문의하기 버튼 + 언어 스위처 + 관리자 버튼 + 로그인/아바타 + 모바일 메뉴 버튼 */}
					<div className="flex items-center gap-2 sm:gap-3">
						{/* 문의하기 버튼 (데스크탑만) */}
						<button
							onClick={() => setIsContactModalOpen(true)}
							className="hidden px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border rounded-full shadow hover:bg-gray-50 transition-colors sm:block cursor-pointer"
						>
							{t('contact.title', '문의하기')}
						</button>

						{/* 언어 스위처 (데스크탑만) */}
						<div className="hidden sm:block">
							<LanguageSwitcher />
						</div>
						
						{/* 관리자 버튼 */}
						{isAuthed && role === 'admin' && (
							<Link
								to="/admin"
								className="hidden px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700 transition-colors sm:block sm:px-3 sm:py-1.5 sm:text-sm"
							>
								{t('nav.admin')}
							</Link>
						)}
						
						{/* 로그인/아바타 */}
						{isAuthed ? (
							<div className="relative group">
								<div className="grid text-xs font-bold text-white transition-colors bg-blue-500 rounded-full cursor-pointer w-7 h-7 sm:w-8 sm:h-8 sm:text-sm place-items-center hover:bg-blue-600">
									{initial}
								</div>
								<div className="absolute right-0 z-50 invisible p-2 mt-1 transition-all duration-200 ease-in-out bg-white border rounded-lg shadow opacity-0 w-44 group-hover:visible group-hover:opacity-100">
									<div className="px-2 py-1 text-xs text-gray-500 truncate">{email}</div>
									<hr className="my-2" />
									{isAuthed && role === 'admin' && (
										<div className="sm:hidden">
											<Link
												to="/admin"
												className="block w-full px-3 py-2 text-sm text-left transition-colors rounded hover:bg-gray-100"
											>
												{t('nav.admin')}
											</Link>
											<hr className="my-2" />
										</div>
									)}
									<Link
										to="/mypage"
										className="block w-full px-3 py-2 text-sm text-left transition-colors rounded hover:bg-gray-100"
									>
										{t('nav.mypage', '마이페이지')}
									</Link>
									<button
										onClick={logout}
										className="w-full px-3 py-2 text-sm text-left transition-colors rounded hover:bg-gray-100"
									>
										{t('auth.signout')}
									</button>
								</div>
							</div>
						) : (
							<LoginButton />
						)}

						{/* 모바일 메뉴 버튼 */}
						<button
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className="flex items-center justify-center w-8 h-8 text-gray-600 rounded-md hover:bg-gray-100 md:hidden"
						>
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								{isMobileMenuOpen ? (
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								) : (
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 6h16M4 12h16M4 18h16"
									/>
								)}
							</svg>
						</button>
					</div>
				</div>
			</header>

			{/* 모바일 메뉴 (햄버거 메뉴 클릭 시 표시) */}
			{isMobileMenuOpen && (
				<div className="fixed inset-0 z-40 md:hidden">
					{/* 배경 오버레이 */}
					<div 
						className="fixed inset-0 bg-black bg-opacity-25"
						onClick={() => setIsMobileMenuOpen(false)}
					/>
					
					{/* 메뉴 패널 */}
					<div className="fixed left-0 right-0 bg-white border-b shadow-lg top-14">
						<div className="py-4">
							{/* 네비게이션 링크 */}
							<div className="space-y-1">
								<NavLink
									to="/kmap"
									onClick={() => setIsMobileMenuOpen(false)}
									className={({ isActive }) =>
										`block px-4 py-3 text-base font-medium transition-colors ${
											isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
										}`
									}
								>
									{t('nav.kmap')}
								</NavLink>
								<NavLink
									to="/kcourse"
									onClick={() => setIsMobileMenuOpen(false)}
									className={({ isActive }) =>
										`block px-4 py-3 text-base font-medium transition-colors ${
											isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
										}`
									}
								>
									{t('nav.kcourse')}
								</NavLink>
								<NavLink
									to="/buzz"
									onClick={() => setIsMobileMenuOpen(false)}
									className={({ isActive }) =>
										`block px-4 py-3 text-base font-medium transition-colors ${
											isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
										}`
									}
								>
									{t('nav.kbuzz')}
								</NavLink>
							</div>
							
							{/* 문의하기 버튼 (모바일) */}
							<div className="px-4 py-3 mt-2 border-t border-gray-100">
								<button
									onClick={() => {
										setIsContactModalOpen(true)
										setIsMobileMenuOpen(false)
									}}
									className="block w-full px-3 py-3 text-base font-medium text-left transition-colors text-gray-700 hover:bg-gray-50 rounded-md"
								>
									{t('contact.title', '문의하기')}
								</button>
							</div>

							{/* 언어 스위처 (모바일) */}
							<div className="px-4 py-3 border-t border-gray-100">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium text-gray-700">{t('common.language', '언어')}</span>
									<LanguageSwitcher />
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Contact Modal */}
			<ContactModal
				isOpen={isContactModalOpen}
				onClose={() => setIsContactModalOpen(false)}
			/>
		</>
	)
}
