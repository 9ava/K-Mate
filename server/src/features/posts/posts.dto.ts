// src/features/posts/posts.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'
import type { PostType, PostCategory, PostStatus } from './post.entity'

/**
 * 게시글 생성 DTO
 */
export class CreatePostDto {
	@ApiProperty({ description: '게시글 제목', example: '서울 맛집 추천' })
	@IsString()
	@IsNotEmpty()
	title!: string

	@ApiProperty({ description: '게시글 내용', example: '서울에서 꼭 가봐야 할 맛집들을 소개합니다.' })
	@IsString()
	@IsNotEmpty()
	content!: string

	@ApiProperty({ 
		description: '게시글 타입',
		enum: ['community', 'tips', 'trend'],
		example: 'community'
	})
	@IsEnum(['community', 'tips', 'trend'])
	postType!: PostType

	@ApiPropertyOptional({ 
		description: '게시글 카테고리',
		enum: ['travel_tip', 'food_review', 'cafe_review', 'general'],
		example: 'food_review'
	})
	@IsOptional()
	@IsEnum(['travel_tip', 'food_review', 'cafe_review', 'general'])
	category?: PostCategory

	@ApiPropertyOptional({ 
		description: '게시글 상태',
		enum: ['published', 'draft', 'hidden'],
		default: 'published'
	})
	@IsOptional()
	@IsEnum(['published', 'draft', 'hidden'])
	status?: PostStatus
}

/**
 * 게시글 수정 DTO
 */
export class UpdatePostDto {
	@ApiPropertyOptional({ description: '게시글 제목', example: '서울 맛집 추천 (수정)' })
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	title?: string

	@ApiPropertyOptional({ description: '게시글 내용', example: '서울에서 꼭 가봐야 할 맛집들을 소개합니다. (수정된 내용)' })
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	content?: string

	@ApiPropertyOptional({ 
		description: '게시글 카테고리',
		enum: ['travel_tip', 'food_review', 'cafe_review', 'general']
	})
	@IsOptional()
	@IsEnum(['travel_tip', 'food_review', 'cafe_review', 'general'])
	category?: PostCategory

	@ApiPropertyOptional({ 
		description: '게시글 상태',
		enum: ['published', 'draft', 'hidden']
	})
	@IsOptional()
	@IsEnum(['published', 'draft', 'hidden'])
	status?: PostStatus
}

/**
 * 게시글 조회 쿼리 DTO
 */
export class GetPostsQueryDto {
	@ApiPropertyOptional({ 
		description: '게시글 타입 필터',
		enum: ['community', 'tips', 'trend']
	})
	@IsOptional()
	@IsEnum(['community', 'tips', 'trend'])
	postType?: PostType

	@ApiPropertyOptional({ 
		description: '게시글 카테고리 필터',
		enum: ['travel_tip', 'food_review', 'cafe_review', 'general']
	})
	@IsOptional()
	@IsEnum(['travel_tip', 'food_review', 'cafe_review', 'general'])
	category?: PostCategory

	@ApiPropertyOptional({ 
		description: '게시글 상태 필터',
		enum: ['published', 'draft', 'hidden']
	})
	@IsOptional()
	@IsEnum(['published', 'draft', 'hidden'])
	status?: PostStatus

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

	@ApiPropertyOptional({ description: '검색 키워드 (제목, 내용)', example: '서울 맛집' })
	@IsOptional()
	@IsString()
	search?: string
}

/**
 * 게시글 응답 DTO
 */
export class PostResponseDto {
	@ApiProperty({ description: '게시글 ID' })
	id!: number

	@ApiProperty({ description: '작성자 정보' })
	author!: {
		id: number
		name: string
		avatarUrl: string | null
		role: string
	}

	@ApiProperty({ description: '게시글 제목' })
	title!: string

	@ApiProperty({ description: '게시글 내용' })
	content!: string

	@ApiProperty({ description: '게시글 타입' })
	postType!: PostType

	@ApiProperty({ description: '게시글 카테고리', nullable: true })
	category!: PostCategory | null

	@ApiProperty({ description: '게시글 상태' })
	status!: PostStatus

	@ApiProperty({ description: '조회수' })
	viewCount!: number

	@ApiProperty({ description: '좋아요 수' })
	likeCount!: number

	@ApiProperty({ description: '스크랩 수' })
	scrapCount!: number

	@ApiProperty({ description: '댓글 수' })
	commentCount!: number

	@ApiProperty({ description: '생성일시' })
	createdAt!: Date

	@ApiProperty({ description: '수정일시' })
	updatedAt!: Date

	@ApiPropertyOptional({ description: '현재 사용자의 좋아요 여부' })
	isLiked?: boolean
}
