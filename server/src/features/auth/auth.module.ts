// src/features/auth/auth.module.ts
import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthController } from './auth.controller'
import { DevAdminController } from './dev-admin.controller'
import { AuthService } from './auth.service'
import { GoogleStrategy } from './strategies/google.strategy'
import { JwtCookieStrategy } from './strategies/jwt-cookie.strategy'
import { User } from '../users/user.entity' // 경로 확인

@Module({
	imports: [
		TypeOrmModule.forFeature([User]), // Repository 주입
		PassportModule.register({ session: false }),
		JwtModule.register({
			secret: process.env.JWT_SECRET!,
			signOptions: { expiresIn: process.env.ACCESS_TOKEN_TTL ?? '15m' },
		}),
	],
	controllers: [AuthController, DevAdminController],
	providers: [AuthService, GoogleStrategy, JwtCookieStrategy],
	exports: [AuthService, TypeOrmModule, JwtModule],
})
export class AuthModule {}
