import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { InteractionController } from './interaction.controller'
import { InteractionService } from './interaction.service'
import { Interaction } from './interaction.entity'
import { User } from '../users/user.entity'
import { Post } from '../posts/post.entity'
import { Place } from '../places/place.entity'

/**
 * Interaction Module - 상호작용 기능 모듈
 * 
 * 주요 기능:
 * - 상호작용 CRUD 작업 (좋아요, 스크랩, 북마크)
 * - 중복 상호작용 방지
 * - 실시간 통계 계산
 * - 페이지네이션
 * - 타입별 상호작용 관리
 */
@Module({
	imports: [
		// TypeORM을 통한 Repository 주입
		// Interaction, User, Post, Place 엔티티의 Repository를 주입 가능하도록 설정
		TypeOrmModule.forFeature([Interaction, User, Post, Place]),
	],
	controllers: [InteractionController],
	providers: [InteractionService],
	exports: [
		// 다른 모듈에서 InteractionService를 사용할 수 있도록 export
		InteractionService,
		// TypeORM Repository도 export (필요시 다른 모듈에서 사용)
		TypeOrmModule,
	],
})
export class InteractionModule {}
