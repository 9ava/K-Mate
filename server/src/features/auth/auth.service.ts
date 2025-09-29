// src/features/auth/auth.service.ts
import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User, UserRole } from '../users/user.entity'

type GoogleUser = {
	google_sub: string
	email?: string
	name?: string
	avatar_url?: string
	email_verified?: boolean
}

function ttlToMs(ttl: string | undefined, fallbackMs: number) {
	if (!ttl) return fallbackMs
	const m = ttl.match(/^(\d+)([smhd])$/i)
	if (!m) return fallbackMs
	const n = Number(m[1])
	const u = m[2].toLowerCase()
	const mult = u === 's' ? 1 : u === 'm' ? 60 : u === 'h' ? 3600 : 86400
	return n * mult * 1000
}

@Injectable()
export class AuthService {
	constructor(
		private readonly jwt: JwtService,
		@InjectRepository(User) private readonly users: Repository<User>
	) {}

	/**
	 * users(email UNIQUE, google_sub UNIQUE) 기준으로 upsert
	 * - email 키로 충돌해도 google_sub, name, avatar_url 등 최신화
	 * - 이후 google_sub 우선, 없으면 email로 조회
	 */
	async upsertUser(gu: GoogleUser) {
		if (!gu.google_sub) throw new Error('google_sub missing')
		if (!gu.email) throw new Error('email missing from Google profile')

		// 1) 기존 사용자 조회
		let user = await this.users.findOne({
			where: [{ google_sub: gu.google_sub }, { email: gu.email }],
		})

		if (user) {
			// 2) 업데이트하되 role은 절대 건드리지 않음
			user.google_sub = gu.google_sub
			user.email = gu.email
			user.name = gu.name ?? user.name ?? 'User'
			user.avatar_url = gu.avatar_url ?? user.avatar_url ?? null
			user.email_verified = gu.email_verified ? 1 : 0
			await this.users.save(user)
		} else {
			// 3) 신규 생성 시에만 role 기본값
			user = this.users.create({
				google_sub: gu.google_sub,
				email: gu.email,
				name: gu.name ?? 'User',
				avatar_url: gu.avatar_url ?? null,
				email_verified: gu.email_verified ? 1 : 0,
				role: 'user', // ← 신규에만
			})
			await this.users.save(user)
		}

		return user
	}

	async issueTokens(user: { id: number; email?: string; role?: UserRole }) {
		const payload = { sub: user.id, email: user.email, role: user.role ?? 'user' }

		const accessTtl = process.env.ACCESS_TOKEN_TTL ?? '15m'
		const refreshTtl = process.env.REFRESH_TOKEN_TTL ?? '7d'

		const access = await this.jwt.signAsync(payload, {
			secret: process.env.JWT_SECRET!,
			expiresIn: accessTtl,
		})
		const refresh = await this.jwt.signAsync(payload, {
			secret: process.env.JWT_SECRET!,
			expiresIn: refreshTtl,
		})

		return {
			access,
			refresh,
			accessMaxAgeMs: ttlToMs(accessTtl, 15 * 60 * 1000),
			refreshMaxAgeMs: ttlToMs(refreshTtl, 7 * 24 * 60 * 60 * 1000),
		}
	}

	async verifyRefresh(token: string) {
		return this.jwt.verifyAsync(token, { secret: process.env.JWT_SECRET! })
	}

	async findAll(): Promise<User[]> {
		return this.users.find()
	}

	async createAdmin(email: string) {
		let user = await this.users.findOne({ where: { email } })

		if (user) {
			user.role = 'admin'
			await this.users.save(user)
		} else {
			user = this.users.create({
				email,
				role: 'admin',
				google_sub: `admin_${email}`, // Placeholder
				name: 'Admin User',
				email_verified: 1,
			})
			await this.users.save(user)
		}

		return user
	}

	async updateUserRole(id: number, role: 'user' | 'admin'): Promise<User> {
		const user = await this.users.findOne({ where: { id } })
		if (!user) {
			throw new Error('User not found')
		}
		user.role = role
		return this.users.save(user)
	}

	async deleteUser(id: number): Promise<void> {
		const user = await this.users.findOne({ where: { id } })
		if (!user) {
			throw new Error('User not found')
		}
		await this.users.remove(user)
	}
}
