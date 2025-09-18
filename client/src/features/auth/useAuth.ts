import { useMemo } from 'react'
import { useAuthStore } from './auth.store'

export function useAuth() {
	const user = useAuthStore((s) => s.user)
	const ready = useAuthStore((s) => s.ready)
	const bootstrap = useAuthStore((s) => s.bootstrap)
	const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)
	const logout = useAuthStore((s) => s.logout)
	const isAuthed = useAuthStore((s) => s.isAuthed())
	const role = (user?.role ?? 'user') as 'user' | 'admin'
	const email = user?.email
	const initial = useMemo(() => (email ? (email[0] || 'U').toUpperCase() : 'U'), [email])

	return {
		user,
		isAuthed,
		ready,
		email,
		role,
		initial,
		refresh: bootstrap,
		loginWithGoogle,
		logout,
	}
}
