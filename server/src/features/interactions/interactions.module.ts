// src/features/interactions/interactions.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { InteractionsController } from './interactions.controller'
import { InteractionsService } from './interactions.service'
import { Interaction } from './interaction.entity'
import { Post } from '../posts/post.entity'
import { Place } from '../places/place.entity'
import { User } from '../users/user.entity'

/**
 * InteractionsModule - 통합 상호작용 관리
 * 
 * 주요 기능:
 * - like, scrap, bookmark 통합 관리
 * - 정책:
 *   - bookmark → place 전용
 *   - like, scrap → post 전용 (단, post_type이 community 또는 trend일 때만 허용)
 */
@Module({
	imports: [
		TypeOrmModule.forFeature([Interaction, Post, Place, User]),
	],
	controllers: [InteractionsController],
	providers: [InteractionsService],
	exports: [InteractionsService],
})
export class InteractionsModule {}
