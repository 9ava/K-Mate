// 전역 보강: req.user 타입 + req.user 프로퍼티 자체 추가
export {}

declare global {
	namespace Express {
		// Passport가 채워줄 사용자 타입
		interface User {
			id: number
			google_sub: string
			email?: string
			name?: string
			avatar_url?: string
			email_verified?: boolean
			role?: 'user' | 'admin'
		}

		// ✅ Request에 user 프로퍼티를 실제로 추가
		interface Request {
			user?: User
		}
	}
}
