import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { api } from '../../api/client'

export type Role = 'user' | 'admin'
export interface Me {
	id: number | string
	email?: string
	role: Role
	name?: string
	avatar_url?: string | null
	google_sub?: string
	email_verified?: boolean
}

type State = {
	user: Me | null
	ready: boolean
	error: string | null
}

type Actions = {
	// 서버의 /auth/whoami 또는 /auth/me 호출 → user 동기화
	bootstrap: () => Promise<void>
	logout: () => Promise<void>
	loginWithGoogle: () => void
	switchAccount: () => void

	// 편의 getter
	isAuthed: () => boolean
	isAdmin: () => boolean
}

function normalizeMe(raw: any): Me | null {
	if (!raw) return null
	const obj = 'user' in raw ? raw.user : raw
	if (!obj) return null
	const id = obj.id ?? obj.sub
	if (!id) return null
	return {
		id,
		email: obj.email,
		role: (obj.role as Role) ?? 'user',
		name: obj.name,
		avatar_url: obj.avatar_url,
		google_sub: obj.google_sub,
		email_verified: !!obj.email_verified,
	}
}

export const useAuthStore = create<State & Actions>()(
	devtools(
		persist(
			(set, get) => ({
				user: null,
				ready: false,
				error: null,

				async bootstrap() {
					try {
						set({ error: null })
						// 권장 경로
						const { data } = await api.get('/auth/me')
						let u = normalizeMe(data)
						set({ user: u, ready: true })
					} catch (e: any) {
						set({ user: null, ready: true, error: e?.message ?? 'auth failed' })
					}
				},

				async logout() {
					try {
						await api.post('/auth/logout')
					} catch {}
					set({ user: null, ready: true })
				},

				loginWithGoogle() {
					// Store current page for post-login redirect
					const currentUrl = window.location.pathname + window.location.search
					sessionStorage.setItem('post_login_redirect', currentUrl)
					// 서버가 콜백/쿠키를 처리하고 /auth/callback 으로 리다이렉트함
					const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
					window.location.href = `${base}/auth/google?prompt=select_account consent`
				},

				switchAccount() {
					// Store current page for post-login redirect
					sessionStorage.setItem('post_login_redirect', window.location.pathname + window.location.search)
					// Force account selection by adding prompt parameter
					const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
					window.location.href = `${base}/auth/google?prompt=select_account consent`
				},

				isAuthed: () => !!get().user,
				isAdmin: () => get().user?.role === 'admin',
			}),
			{
				name: 'auth', // persist key
				storage: createJSONStorage(() => sessionStorage), // 세션 동안만 유지(원하면 localStorage로 변경)
				partialize: (s) => ({ user: s.user }), // user만 저장
			}
		)
	)
)
