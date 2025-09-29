// src/common/guards/jwt-auth.optional.guard.ts
import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class JwtAuthOptionalGuard extends AuthGuard('jwt-cookie') {
	handleRequest(err: any, user: any, info: any) {
		// err, info는 무시하고 user가 있으면 user 객체를, 없으면 null을 반환
		return user
	}
}
