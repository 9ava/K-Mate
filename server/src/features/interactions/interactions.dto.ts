// src/features/interactions/interactions.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsInt, Min, IsOptional, Max } from 'class-validator'
import { Type } from 'class-transformer'
import type { InteractionType } from './interaction.entity'

/** 생성 DTO */
export class CreateInteractionDto {
	@ApiProperty({
		description: '상호작용 타입',
		enum: ['like', 'scrap'],
		example: 'like',
	})
	@IsEnum(['like', 'scrap'])
	interactionType!: InteractionType

	@ApiProperty({ description: '대상 게시글 ID (posts.id)', example: 1 })
	@Type(() => Number)
	@IsInt()
	@Min(1)
	postId!: number
}

/** 목록 조회 쿼리 DTO */
export class GetInteractionsQueryDto {
	@ApiPropertyOptional({
		description: '상호작용 타입 필터',
		enum: ['like', 'scrap'],
	})
	@IsOptional()
	@IsEnum(['like', 'scrap'])
	interactionType?: InteractionType

	@ApiPropertyOptional({ description: '게시글 ID 필터', example: 1 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	postId?: number

	@ApiPropertyOptional({ description: '페이지 번호', example: 1, minimum: 1 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page: number = 1

	@ApiPropertyOptional({ description: '페이지당 항목 수', example: 10, minimum: 1, maximum: 100 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit: number = 10
}

/** 단건 응답 DTO */
export class InteractionResponseDto {
	@ApiProperty({ description: '상호작용 ID' })
	id!: number

	@ApiProperty({ description: '사용자' })
	user!: {
		id: number
		name: string
		avatarUrl: string | null
	}

	@ApiProperty({ description: '상호작용 타입', enum: ['like', 'scrap'] })
	interactionType!: InteractionType

	@ApiProperty({ description: '대상 게시글 ID' })
	postId!: number

	@ApiProperty({ description: '생성일시' })
	createdAt!: Date
}

/** 통계 응답 DTO (post 전용) */
export class InteractionStatsDto {
	@ApiProperty({ description: '좋아요 수' })
	likeCount!: number

	@ApiProperty({ description: '스크랩 수' })
	scrapCount!: number

	@ApiProperty({ description: '사용자의 상호작용 여부' })
	userInteractions!: {
		liked: boolean
		scrapped: boolean
	}
}
