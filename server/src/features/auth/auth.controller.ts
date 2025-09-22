// server/src/features/auth/auth.controller.ts
import { Controller, Get, Post, Req, Res, UseGuards, HttpCode } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { JwtService } from '@nestjs/jwt'

const baseCookie = {
	httpOnly: true,
	sameSite: 'lax' as const, // 다른 최상위 도메인이면 'none' + secure:true
	secure: process.env.NODE_ENV === 'production', // 로컬에선 false
	domain: process.env.COOKIE_DOMAIN || undefined,
	path: '/',
}

@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly jwt: JwtService
	) {}

	// 1) 구글 로그인 시작
	@Get('google')
	@UseGuards(AuthGuard('google'))
	googleAuth() {}

	// 2) 구글 콜백 → upsert → 토큰 발급 → HttpOnly 쿠키 심고 프론트로 리다이렉트
	@Get('google/callback')
	@UseGuards(AuthGuard('google'))
	async googleCallback(@Req() req: Request, @Res() res: Response) {
		const frontend = process.env.FRONTEND_URL || 'https://k-mate.org'
		const postLoginPath = process.env.POST_LOGIN_PATH || '/login/callback' // ✅ 프런트 라우트로 변경

		// 슬래시 안전 조인
		const redirectTo = frontend.replace(/\/+$/, '') + '/' + postLoginPath.replace(/^\/+/, '')

		try {
			const googleUser = req.user as any
			const appUser = await this.authService.upsertUser(googleUser)
			const { access, refresh, accessMaxAgeMs, refreshMaxAgeMs } =
				await this.authService.issueTokens(appUser)

			return res
				.cookie('access_token', access, { ...baseCookie, maxAge: accessMaxAgeMs })
				.cookie('refresh_token', refresh, { ...baseCookie, maxAge: refreshMaxAgeMs })
				.redirect(redirectTo) // ✅ 프런트로 바로 리다이렉트
		} catch {
			return res.redirect(frontend.replace(/\/+$/, '') + '/login?error=oauth_failed')
		}
	}

	// 3) 세션 확인 (부드러운 me): 항상 200 반환. 로그인 X면 null
	@Get('me')
	async softMe(@Req() req: Request) {
		try {
			const token = req.cookies?.access_token
			if (!token) return null
			const p = await this.jwt.verifyAsync(token, { secret: process.env.JWT_SECRET! })
			return { sub: p.sub, email: p.email, role: p.role ?? 'user' }
		} catch {
			return null
		}
	}

	// (선택) 엄격한 me: 비로그인 시 401을 원할 때 사용
	@Get('me/strict')
	@UseGuards(AuthGuard('jwt-cookie')) // jwt-cookie 전략 사용
	strictMe(@Req() req: Request) {
		return req.user
	}

	// 4) 로그아웃: 쿠키 제거
	@Post('logout')
	@HttpCode(204)
	logout(@Res() res: Response) {
		return res
			.clearCookie('access_token', baseCookie)
			.clearCookie('refresh_token', baseCookie)
			.send()
	}

	// 5) 리프레시 (선택)
	@Post('refresh')
	async refresh(@Req() req: Request, @Res() res: Response) {
		const rt = req.cookies?.refresh_token
		if (!rt) return res.status(401).send('No refresh token')
		try {
			const payload = await this.authService.verifyRefresh(rt)
			const { access, refresh, accessMaxAgeMs, refreshMaxAgeMs } =
				await this.authService.issueTokens({
					id: payload.sub,
					email: payload.email,
					role: payload.role,
				})

			return res
				.cookie('access_token', access, { ...baseCookie, maxAge: accessMaxAgeMs })
				.cookie('refresh_token', refresh, { ...baseCookie, maxAge: refreshMaxAgeMs })
				.sendStatus(204)
		} catch {
			return res.status(401).send('Invalid refresh token')
		}
	}
}

// 보호가 필요한 API/라우트에만 @UseGuards(AuthGuard('jwt-cookie'))(= JwtAuthGuard)를 붙이면
// 비로그인 시 401이 떨어져서 프론트가 로그인 페이지로 리다이렉트 가능.

// 프론트는 공개 화면에서 /auth/me만 조용히(200/null) 확인하고,
// 버튼 가드(useRequireAuth)나 ProtectedRoute에서만 로그인 요구하면 됨.
