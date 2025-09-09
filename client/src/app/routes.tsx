import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from '../components/layout/Header'
import MainPage from '../pages/MainPage'
import KmapPage from '../pages/KmapPage'
import AuthCallbackPage from '../pages/AuthCallbackPage'
import LoginPage from '../pages/LoginPage'
import PlannerPage from '../pages/PlannerPage'

const AppRouter = () => {
	return (
		<BrowserRouter>
			<Header />
			<main className="pt-14">
				<Routes>
					<Route path="/" element={<MainPage />} />
					<Route path="/auth/callback" element={<AuthCallbackPage />} />
					<Route path="/kmap" element={<KmapPage />} />
					<Route path="/login" element={<LoginPage />} />
					<Route path="/planner" element={<PlannerPage />} />
					{/* 여기에 /course, /buzz 도 추가 가능 */}
				</Routes>
			</main>
		</BrowserRouter>
	)
}

export default AppRouter
