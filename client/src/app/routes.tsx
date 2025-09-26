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
import AdminPage from '../pages/AdminPage'
import ConnectPage from '../pages/ConnectPage'
import KMapManagePage from '../pages/admin/KMapManagePage'
import AddMarkerPage from '../pages/admin/AddMarkerPage'
import EditMarkerPage from '../pages/admin/EditMarkerPage'
import UserManagePage from '../pages/admin/UserManagePage'
import StatisticsPage from '../pages/admin/StatisticsPage'

const AppRouter = () => {
	return (
		<BrowserRouter>
			<Header />
			<main className="pt-14">
				<Routes>
					<Route path="/" element={<MainPage />} />
					<Route path="/auth/callback" element={<AuthCallbackPage />} />
					<Route path="/login" element={<LoginPage />} />
					<Route path="/login/callback" element={<AuthCallbackPage />} />
					<Route path="/kcourse" element={<KcoursePage />} />
					<Route path="/kcourse/:courseId" element={<CourseDetailPage />} />
					{/* Redirect /courses/* to /kcourse/* for backward compatibility */}
					<Route path="/courses/:courseId" element={<CourseDetailPage />} />
					<Route path="/planner" element={<PlannerPage />} />
					<Route path="/kmap" element={<KmapPage />} />
					<Route path="/buzz" element={<KBuzzPage />} />
					<Route path="/buzz/post/:id" element={<CommunityDetailPage />} />
					<Route path="/buzz/trend/:id" element={<TrendDetailPage />} />
					<Route path="/admin" element={<AdminPage />} />
					<Route path="/admin/connect" element={<ConnectPage />} />
					<Route path="/admin/map" element={<KMapManagePage />} />
					<Route path="/admin/map/add" element={<AddMarkerPage />} />
					<Route path="/admin/map/edit/:id" element={<EditMarkerPage />} />
					<Route path="/admin/users" element={<UserManagePage />} />
					<Route path="/admin/statistics" element={<StatisticsPage />} />
				</Routes>
			</main>
		</BrowserRouter>
	)
}

export default AppRouter
