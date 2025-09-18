// src/features/comments/comments.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsInt, Min, Max, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * 댓글 생성 DTO
 */
export class CreateCommentDto {
	@ApiProperty({ description: '댓글 내용', example: '정말 유용한 정보네요!' })
	@IsString()
	@IsNotEmpty()
	content!: string
}

/**
 * 댓글 수정 DTO
 */
export class UpdateCommentDto {
	@ApiProperty({ description: '댓글 내용', example: '정말 유용한 정보네요! (수정)' })
	@IsString()
	@IsNotEmpty()
	content!: string
}

/**
 * 댓글 조회 쿼리 DTO
 */
export class GetCommentsQueryDto {
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
 * 댓글 응답 DTO
 */
export class CommentResponseDto {
	@ApiProperty({ description: '댓글 ID' })
	id!: number

	@ApiProperty({ description: '게시글 ID' })
	postId!: number

	@ApiProperty({ description: '작성자 정보' })
	user!: {
		id: number
		name: string
		avatarUrl: string | null
	}

	@ApiProperty({ description: '댓글 내용' })
	content!: string

	@ApiProperty({ description: '생성일시' })
	createdAt!: Date
}
