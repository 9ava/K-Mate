// src/features/interactions/interactions.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsInt, Min, Max, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'
import type { InteractionType, TargetType } from './interaction.entity'

/**
 * 상호작용 생성 DTO
 */
export class CreateInteractionDto {
	@ApiProperty({ 
		description: '상호작용 타입',
		enum: ['like', 'scrap', 'bookmark'],
		example: 'like'
	})
	@IsEnum(['like', 'scrap', 'bookmark'])
	interactionType!: InteractionType

	@ApiProperty({ 
		description: '대상 타입',
		enum: ['post', 'place'],
		example: 'post'
	})
	@IsEnum(['post', 'place'])
	targetType!: TargetType

	@ApiProperty({ description: '대상 ID (post.id 또는 place.id)', example: 1 })
	@Type(() => Number)
	@IsInt()
	@Min(1)
	targetId!: number
}

/**
 * 상호작용 조회 쿼리 DTO
 */
export class GetInteractionsQueryDto {
	@ApiPropertyOptional({ 
		description: '상호작용 타입 필터',
		enum: ['like', 'scrap', 'bookmark']
	})
	@IsOptional()
	@IsEnum(['like', 'scrap', 'bookmark'])
	interactionType?: InteractionType

	@ApiPropertyOptional({ 
		description: '대상 타입 필터',
		enum: ['post', 'place']
	})
	@IsOptional()
	@IsEnum(['post', 'place'])
	targetType?: TargetType

	@ApiPropertyOptional({ description: '페이지 번호', example: 1, minimum: 1 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1

	@ApiPropertyOptional({ description: '페이지당 항목 수', example: 10, minimum: 1, maximum: 100 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number = 10
}

/**
 * 상호작용 응답 DTO
 */
export class InteractionResponseDto {
	@ApiProperty({ description: '상호작용 ID' })
	id!: number

	@ApiProperty({ description: '사용자 정보' })
	user!: {
		id: number
		name: string
		avatarUrl: string | null
	}

	@ApiProperty({ description: '상호작용 타입' })
	interactionType!: InteractionType

	@ApiProperty({ description: '대상 타입' })
	targetType!: TargetType

	@ApiProperty({ description: '대상 ID' })
	targetId!: number

	@ApiProperty({ description: '생성일시' })
	createdAt!: Date
}

/**
 * 상호작용 통계 응답 DTO
 */
export class InteractionStatsDto {
	@ApiProperty({ description: '좋아요 수' })
	likeCount!: number

	@ApiProperty({ description: '스크랩 수' })
	scrapCount!: number

	@ApiProperty({ description: '북마크 수' })
	bookmarkCount!: number

	@ApiProperty({ description: '사용자의 상호작용 여부' })
	userInteractions!: {
		liked: boolean
		scrapped: boolean
		bookmarked: boolean
	}
}
