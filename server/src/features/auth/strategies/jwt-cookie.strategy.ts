import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { Request } from 'express'

const fromCookie = (req: Request) => req?.cookies?.access_token || null

@Injectable()
export class JwtCookieStrategy extends PassportStrategy(Strategy, 'jwt-cookie') {
	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([fromCookie]),
			ignoreExpiration: false,
			secretOrKey: process.env.JWT_SECRET!,
		})
	}

	async validate(payload: any) {
		// req.user에 들어갈 값
		return { id: payload.sub, email: payload.email, role: payload.role ?? 'user' }
	}
}
