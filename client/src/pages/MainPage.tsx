// 예: src/pages/MainPage.tsx 또는 레이아웃에서
import { useEffect } from 'react'
import { useAuth } from '../features/auth/useAuth'

export default function MainPage() {
	const { refresh, ready } = useAuth()
	useEffect(() => {
		refresh()
	}, [])
	if (!ready) return <div className="p-6">Loading...</div>
	return <div className="p-6">Main Page</div>
}
