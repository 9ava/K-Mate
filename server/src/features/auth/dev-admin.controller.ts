// src/features/auth/dev-admin.controller.ts
// DEVELOPMENT ONLY - Remove in production
import { Controller, Post, Req, UseGuards, ForbiddenException } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/user.entity'
import type { Request } from 'express'

@Controller('dev')
export class DevAdminController {
	constructor(
		@InjectRepository(User) private readonly users: Repository<User>
	) {}

	/**
	 * DEVELOPMENT ONLY: Promote current user to admin
	 * Remove this endpoint in production!
	 */
	@Post('make-me-admin')
	@UseGuards(JwtAuthGuard)
	async makeMeAdmin(@Req() req: Request) {
		// Only allow in development environment
		if (process.env.NODE_ENV === 'production') {
			throw new ForbiddenException('This endpoint is only available in development')
		}

		const userId = (req.user as any)?.id as number
		if (!userId) {
			throw new ForbiddenException('User not authenticated')
		}

		// Update user role to admin
		await this.users.update(userId, { role: 'admin' })

		const updatedUser = await this.users.findOne({ where: { id: userId } })

		return {
			success: true,
			message: 'You are now an admin!',
			user: {
				id: updatedUser?.id,
				email: updatedUser?.email,
				name: updatedUser?.name,
				role: updatedUser?.role
			}
		}
	}

	/**
	 * DEVELOPMENT ONLY: Check if current user is admin
	 */
	@Post('check-admin')
	@UseGuards(JwtAuthGuard)
	async checkAdmin(@Req() req: Request) {
		const user = req.user as any
		return {
			success: true,
			user: {
				id: user?.id,
				email: user?.email,
				role: user?.role
			},
			isAdmin: user?.role === 'admin'
		}
	}
}