import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../features/auth/useAuth'
import { Link } from 'react-router-dom'
import Header from '../components/layout/Header'

export default function MainPage() {
	const { t } = useTranslation()
	const { refresh, ready } = useAuth()

	useEffect(() => {
		refresh()
	}, [])

	if (!ready)
		return (
			<div className="flex items-center justify-center min-h-screen">
				{t('common.loading', 'Loading...')}
			</div>
		)

	return (
		<div className="min-h-screen bg-white">
			<Header />

			{/* Hero Section */}
			<section className="relative pt-20 pb-16 overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
				<div className="relative px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-6xl">
							{t('main.hero.title', 'Discover Korea with')}
							<span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
								K-Mate
							</span>
						</h1>
						<p className="max-w-3xl mx-auto mb-8 text-xl text-gray-600 whitespace-pre-line">
							{t(
								'main.hero.subtitle',
								'Your ultimate companion for exploring Korean culture, places, and trends. Connect with the heart of Korea through interactive maps, courses, and community.'
							)}
						</p>
						<div className="flex flex-col justify-center gap-4 sm:flex-row">
							<Link
								to="/kmap"
								className="px-8 py-4 font-semibold text-white transition-all duration-200 transform rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:scale-105"
							>
								{t('main.hero.start_exploring', 'Start Exploring')}
							</Link>
							<Link
								to="/kcourse"
								className="px-8 py-4 font-semibold text-gray-700 transition-colors duration-200 border-2 border-gray-300 rounded-full hover:border-gray-400"
							>
								{t('main.hero.browse_courses', 'Browse Courses')}
							</Link>
						</div>
					</div>
				</div>

				{/* Floating Elements */}
				<div className="absolute w-20 h-20 bg-blue-200 rounded-full top-20 left-10 opacity-20 animate-pulse"></div>
				<div className="absolute w-32 h-32 delay-1000 bg-purple-200 rounded-full bottom-20 right-10 opacity-20 animate-pulse"></div>
			</section>

			{/* Features Section */}
			<section className="py-20 bg-gray-50">
				<div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
					<div className="mb-16 text-center">
						<h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
							{t('main.features.section_title', 'Explore Korea Like Never Before')}
						</h2>
						<p className="text-xl text-gray-600">
							{t(
								'main.features.section_subtitle',
								'Three powerful tools to enhance your Korean experience'
							)}
						</p>
					</div>

					<div className="grid gap-8 md:grid-cols-3">
						{/* K-Map Feature */}
						<div className="group perspective-1000 h-80">
							<div className="relative w-full h-full transition-transform duration-700 preserve-3d group-hover:rotate-y-180">
								{/* Front Side */}
								<div className="absolute inset-0 p-8 bg-white shadow-sm rounded-2xl backface-hidden">
									<div className="flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl">
										<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
									</div>
									<h3 className="mb-4 text-2xl font-bold text-gray-900">{t('main.features.kmap.title', 'K-Map')}</h3>
									<p className="text-gray-600">
										{t('main.features.kmap.description', 'Interactive maps showcasing Korean landmarks, restaurants, cultural sites, and hidden gems. Navigate Korea with local insights and recommendations.')}
									</p>
								</div>
								{/* Back Side */}
								<div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl backface-hidden rotate-y-180">
									<div className="relative w-full h-full overflow-hidden rounded-2xl">
										<div className="absolute inset-0 bg-cover bg-center opacity-80" style={{backgroundImage: "url('https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')"}}></div>
										<div className="absolute inset-0 bg-blue-600 bg-opacity-60"></div>
										<div className="relative flex flex-col items-center justify-center h-full p-8 text-center text-white">
											<h3 className="mb-4 text-2xl font-bold">Interactive Maps</h3>
											<p className="text-blue-100">Explore Korean restaurants, cafes, and cultural attractions with detailed location guides and local insights.</p>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* K-Course Feature */}
						<div className="group perspective-1000 h-80">
							<div className="relative w-full h-full transition-transform duration-700 preserve-3d group-hover:rotate-y-180">
								{/* Front Side */}
								<div className="absolute inset-0 p-8 bg-white shadow-sm rounded-2xl backface-hidden">
									<div className="flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl">
										<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
										</svg>
									</div>
									<h3 className="mb-4 text-2xl font-bold text-gray-900">{t('main.features.kcourse.title', 'K-Course')}</h3>
									<p className="text-gray-600">
										{t('main.features.kcourse.description', 'Create and share personalized travel courses for Korea. Design itineraries with curated stops, share experiences, and discover routes created by other travelers.')}
									</p>
								</div>
								{/* Back Side */}
								<div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl backface-hidden rotate-y-180">
									<div className="relative w-full h-full overflow-hidden rounded-2xl">
										<div className="absolute inset-0 bg-cover bg-center opacity-80" style={{backgroundImage: "url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')"}}></div>
										<div className="absolute inset-0 bg-green-600 bg-opacity-60"></div>
										<div className="relative flex flex-col items-center justify-center h-full p-8 text-center text-white">
											<h3 className="mb-4 text-2xl font-bold">Travel Courses</h3>
											<p className="text-green-100">Create and share your Korean travel itineraries with curated routes and experiences from the community.</p>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* K-Buzz Feature */}
						<div className="group perspective-1000 h-80">
							<div className="relative w-full h-full transition-transform duration-700 preserve-3d group-hover:rotate-y-180">
								{/* Front Side */}
								<div className="absolute inset-0 p-8 bg-white shadow-sm rounded-2xl backface-hidden">
									<div className="flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl">
										<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
										</svg>
									</div>
									<h3 className="mb-4 text-2xl font-bold text-gray-900">{t('main.features.kbuzz.title', 'K-Buzz')}</h3>
									<p className="text-gray-600">
										{t('main.features.kbuzz.description', 'Stay updated with the latest Korean trends, news, and community discussions. Connect with fellow Korea enthusiasts and share your experiences.')}
									</p>
								</div>
								{/* Back Side */}
								<div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl backface-hidden rotate-y-180">
									<div className="relative w-full h-full overflow-hidden rounded-2xl">
										<div className="absolute inset-0 bg-cover bg-center opacity-80" style={{backgroundImage: "url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')"}}></div>
										<div className="absolute inset-0 bg-purple-600 bg-opacity-60"></div>
										<div className="relative flex flex-col items-center justify-center h-full p-8 text-center text-white">
											<h3 className="mb-4 text-2xl font-bold">Community Hub</h3>
											<p className="text-purple-100">Share experiences, get travel tips, and connect with fellow Korea enthusiasts in our vibrant community.</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Stats Section */}
			<section className="py-20 bg-white">
				<div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
					<div className="grid gap-8 text-center md:grid-cols-4">
						<div>
							<div className="mb-2 text-4xl font-bold text-blue-600">3</div>
							<div className="text-gray-600">{t('main.stats.features', 'Core Features')}</div>
						</div>
						<div>
							<div className="mb-2 text-4xl font-bold text-green-600">2025</div>
							<div className="text-gray-600">{t('main.stats.launched', 'Year Launched')}</div>
						</div>
						<div>
							<div className="mb-2 text-4xl font-bold text-purple-600">24/7</div>
							<div className="text-gray-600">{t('main.stats.availability', 'Always Available')}</div>
						</div>
						<div>
							<div className="mb-2 text-4xl font-bold text-orange-600">Free</div>
							<div className="text-gray-600">
								{t('main.stats.pricing', 'To Use')}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
				<div className="max-w-4xl px-4 mx-auto text-center sm:px-6 lg:px-8">
					<h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
						{t('main.cta.title', 'Ready to Start Your Korean Journey?')}
					</h2>
					<p className="mb-8 text-xl text-blue-100">
						{t(
							'main.cta.subtitle',
							'Join thousands of users discovering the beauty and richness of Korean culture'
						)}
					</p>
					<Link
						to="/kmap"
						className="px-8 py-4 font-semibold text-blue-600 transition-all duration-200 transform bg-white rounded-full hover:shadow-lg hover:scale-105"
					>
						{t('main.cta.button', 'Get Started Today')}
					</Link>
				</div>
			</section>

			{/* Footer */}
			<footer className="py-12 text-white bg-gray-900">
				<div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
					<div className="grid gap-8 md:grid-cols-4">
						<div>
							<div className="flex items-center gap-2 mb-4">
								<div className="grid w-8 h-8 text-sm font-bold text-white bg-blue-600 rounded-full place-items-center">
									K
								</div>
								<span className="text-xl font-semibold">Mate</span>
							</div>
							<p className="text-gray-400">
								{t(
									'main.footer.description',
									'Your ultimate companion for exploring Korean culture and heritage.'
								)}
							</p>
						</div>
						<div>
							<h4 className="mb-4 font-semibold">{t('main.footer.features', 'Features')}</h4>
							<ul className="space-y-2 text-gray-400">
								<li>
									<Link to="/kmap" className="transition-colors hover:text-white">
										K-Map
									</Link>
								</li>
								<li>
									<Link to="/kcourse" className="transition-colors hover:text-white">
										K-Course
									</Link>
								</li>
								<li>
									<Link to="/buzz" className="transition-colors hover:text-white">
										K-Buzz
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="mb-4 font-semibold">{t('main.footer.company', 'Company')}</h4>
							<ul className="space-y-2 text-gray-400">
								<li>
									<a href="#" className="transition-colors hover:text-white">
										{t('main.footer.about', 'About')}
									</a>
								</li>
								<li>
									<a href="#" className="transition-colors hover:text-white">
										{t('main.footer.contact', 'Contact')}
									</a>
								</li>
								<li>
									<a href="#" className="transition-colors hover:text-white">
										{t('main.footer.privacy', 'Privacy')}
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="mb-4 font-semibold">{t('main.footer.connect', 'Connect')}</h4>
							<ul className="space-y-2 text-gray-400">
								<li>
									<a href="#" className="transition-colors hover:text-white">
										{t('main.footer.twitter', 'Twitter')}
									</a>
								</li>
								<li>
									<a href="#" className="transition-colors hover:text-white">
										{t('main.footer.instagram', 'Instagram')}
									</a>
								</li>
								<li>
									<a href="#" className="transition-colors hover:text-white">
										{t('main.footer.facebook', 'Facebook')}
									</a>
								</li>
							</ul>
						</div>
					</div>
					<div className="pt-8 mt-8 text-center text-gray-400 border-t border-gray-800">
						{t('main.footer.copyright', '© 2025 K-Mate. All rights reserved.')}
					</div>
				</div>
			</footer>
		</div>
	)
}
