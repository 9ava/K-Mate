// src/features/auth/useRequireAuth.ts
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'

export function useRequireAuth() {
	const { isAuthed } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()

	return (action?: () => void) => {
		if (!isAuthed) {
			alert('로그인이 필요합니다.')
			sessionStorage.setItem('post_login_redirect', location.pathname + location.search)
			navigate('/login')
			return false
		}
		action?.()
		return true
	}
}

// (옵션) 관리자 가드가 필요하면:
export function useRequireAdmin() {
	const { role } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()
	return (action?: () => void) => {
		if (role !== 'admin') {
			alert('관리자만 접근할 수 있습니다.')
			sessionStorage.setItem('post_login_redirect', location.pathname + location.search)
			navigate('/')
			return false
		}
		action?.()
		return true
	}
}

// 특정 버튼을 눌렀을 때만 로그인 요구 + 로그인 후 원래 위치 복귀
// 사용법:
// const requireAuth = useRequireAuth()
// <button onClick={() => requireAuth(() => doSomething())}>액션</button>
