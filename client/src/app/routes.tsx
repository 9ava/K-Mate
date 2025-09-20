import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from '../components/layout/Header'
import MainPage from '../pages/MainPage'
import KmapPage from '../pages/KmapPage'
import AuthCallbackPage from '../pages/AuthCallbackPage'
import LoginPage from '../pages/LoginPage'
import KcoursePage from '../pages/KcoursePage'
import CourseDetailPage from '../pages/CourseDetailPage'
import PlannerPage from '../pages/PlannerPage'
import KBuzzPage from '../pages/KBuzzPage'
import CommunityDetailPage from '../pages/KBuzz/CommunityDetailPage'
import TrendDetailPage from '../pages/KBuzz/TrendDetailPage'

const AppRouter = () => {
	return (
		<BrowserRouter>
			<Header />
			<main className="pt-14">
				<Routes>
					<Route path="/" element={<MainPage />} />
					<Route path="/auth/callback" element={<AuthCallbackPage />} />
					<Route path="/login" element={<LoginPage />} />
					<Route path="/kcourse" element={<KcoursePage />} />
					<Route path="/kcourse/:courseId" element={<CourseDetailPage />} />
					<Route path="/planner" element={<PlannerPage />} />
					<Route path="/kmap" element={<KmapPage />} />
					<Route path="/buzz" element={<KBuzzPage />} />
					<Route path="/buzz/post/:id" element={<CommunityDetailPage />} />
					<Route path="/buzz/trend/:id" element={<TrendDetailPage />} />
				</Routes>
			</main>
		</BrowserRouter>
	)
}

export default AppRouter
