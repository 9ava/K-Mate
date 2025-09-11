// src/features/interactions/interactions.controller.ts
import {
	Controller,
	Get,
	Post,
	Delete,
	Query,
	Param,
	Body,
	Req,
	UseGuards,
	ParseIntPipe,
} from '@nestjs/common'
import type { Request } from 'express'
import {
	ApiTags,
	ApiOperation,
	ApiOkResponse,
	ApiCookieAuth,
	ApiQuery,
	ApiParam,
	ApiBadRequestResponse,
	ApiNotFoundResponse,
	ApiForbiddenResponse,
} from '@nestjs/swagger'
import { InteractionsService } from './interactions.service'
import { CreateInteractionDto, GetInteractionsQueryDto, InteractionResponseDto, InteractionStatsDto } from './interactions.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@ApiTags('Interactions')
@Controller('interactions')
export class InteractionsController {
	constructor(private readonly interactionsService: InteractionsService) {}

	// ────────────────────────────────────────────────────────────────────────────
	// 상호작용 토글 (생성/삭제)
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '상호작용 토글 (like, scrap, bookmark)' })
	@ApiOkResponse({
		description: '상호작용 토글 성공',
		schema: {
			example: {
				success: true,
				data: {
					action: 'created',
					interaction: {
						id: 1,
						user: { id: 1, name: '홍길동', avatarUrl: null },
						interactionType: 'like',
						targetType: 'post',
						targetId: 1,
						createdAt: '2024-01-01T00:00:00.000Z'
					}
				}
			}
		}
	})
	@ApiBadRequestResponse({ description: '잘못된 요청 데이터' })
	@ApiNotFoundResponse({ description: '대상 게시글/장소를 찾을 수 없음' })
	@ApiForbiddenResponse({ description: '정책 위반 (bookmark는 place 전용, like/scrap은 post 전용)' })
	@ApiCookieAuth('access_token')
	@Post('toggle')
	@UseGuards(JwtAuthGuard)
	async toggleInteraction(@Req() req: Request, @Body() createInteractionDto: CreateInteractionDto) {
		const userId = (req.user as any).sub
		const data = await this.interactionsService.toggleInteraction(userId, createInteractionDto)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 상호작용 목록 조회
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '상호작용 목록 조회' })
	@ApiOkResponse({
		description: '상호작용 목록 조회 성공',
		schema: {
			example: {
				success: true,
				data: {
					interactions: [
						{
							id: 1,
							user: { id: 1, name: '홍길동', avatarUrl: null },
							interactionType: 'like',
							targetType: 'post',
							targetId: 1,
							createdAt: '2024-01-01T00:00:00.000Z'
						}
					],
					total: 1
				}
			}
		}
	})
	@ApiQuery({ name: 'interactionType', required: false, enum: ['like', 'scrap', 'bookmark'] })
	@ApiQuery({ name: 'targetType', required: false, enum: ['post', 'place'] })
	@ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본: 10)' })
	@Get()
	async getInteractions(@Query() query: GetInteractionsQueryDto) {
		const data = await this.interactionsService.getInteractions(query)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 사용자별 상호작용 목록 조회
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '사용자별 상호작용 목록 조회' })
	@ApiOkResponse({
		description: '사용자별 상호작용 목록 조회 성공',
		schema: {
			example: {
				success: true,
				data: {
					interactions: [],
					total: 0
				}
			}
		}
	})
	@ApiParam({ name: 'userId', type: Number, description: '사용자 ID' })
	@ApiQuery({ name: 'interactionType', required: false, enum: ['like', 'scrap', 'bookmark'] })
	@ApiQuery({ name: 'targetType', required: false, enum: ['post', 'place'] })
	@ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본: 10)' })
	@Get('user/:userId')
	async getInteractionsByUser(
		@Param('userId', ParseIntPipe) userId: number,
		@Query() query: GetInteractionsQueryDto
	) {
		const data = await this.interactionsService.getInteractionsByUser(userId, query)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 대상별 상호작용 통계 조회
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '대상별 상호작용 통계 조회 (좋아요, 스크랩, 북마크 수)' })
	@ApiOkResponse({
		description: '상호작용 통계 조회 성공',
		schema: {
			example: {
				success: true,
				data: {
					likeCount: 10,
					scrapCount: 5,
					bookmarkCount: 3,
					userInteractions: {
						liked: true,
						scrapped: false,
						bookmarked: true
					}
				}
			}
		}
	})
	@ApiParam({ name: 'targetType', enum: ['post', 'place'], description: '대상 타입' })
	@ApiParam({ name: 'targetId', type: Number, description: '대상 ID' })
	@ApiQuery({ name: 'userId', required: false, type: Number, description: '사용자 ID (선택사항, 사용자별 상호작용 여부 포함)' })
	@Get('stats/:targetType/:targetId')
	async getInteractionStats(
		@Param('targetType') targetType: 'post' | 'place',
		@Param('targetId', ParseIntPipe) targetId: number,
		@Query('userId') userId?: number
	) {
		const data = await this.interactionsService.getInteractionStats(targetType, targetId, userId)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 상호작용 삭제
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '상호작용 삭제 (본인 것만)' })
	@ApiOkResponse({
		description: '상호작용 삭제 성공',
		schema: {
			example: {
				success: true,
				message: '상호작용이 삭제되었습니다.'
			}
		}
	})
	@ApiNotFoundResponse({ description: '상호작용을 찾을 수 없음' })
	@ApiForbiddenResponse({ description: '본인의 상호작용만 삭제 가능' })
	@ApiParam({ name: 'id', type: Number, description: '상호작용 ID' })
	@ApiCookieAuth('access_token')
	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	async deleteInteraction(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
		const userId = (req.user as any).sub
		await this.interactionsService.deleteInteraction(id, userId)
		return { success: true, message: '상호작용이 삭제되었습니다.' }
	}
}
