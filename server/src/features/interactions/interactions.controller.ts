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
import {
	CreateInteractionDto,
	GetInteractionsQueryDto,
	InteractionResponseDto,
	InteractionStatsDto,
} from './interactions.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@ApiTags('Interactions')
@Controller('interactions')
export class InteractionsController {
	constructor(private readonly interactionsService: InteractionsService) {}

	// ────────────────────────────────────────────────────────────────────────────
	// 상호작용 토글 (like / scrap) - post 전용
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '상호작용 토글 (like, scrap) - post 전용' })
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
						postId: 1,
						createdAt: '2024-01-01T00:00:00.000Z',
					},
				},
			},
		},
	})
	@ApiBadRequestResponse({ description: '잘못된 요청 데이터' })
	@ApiNotFoundResponse({ description: '대상 게시글을 찾을 수 없음' })
	@ApiForbiddenResponse({ description: '정책 위반' })
	@ApiCookieAuth('access_token')
	@Post('toggle')
	@UseGuards(JwtAuthGuard)
	async toggleInteraction(@Req() req: Request, @Body() dto: CreateInteractionDto) {
		const userId = (req.user as any).id ?? (req.user as any).sub
		const data = await this.interactionsService.toggleInteraction(userId, dto)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 상호작용 목록 조회
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '상호작용 목록 조회' })
	@ApiOkResponse({
		description: '상호작용 목록 조회 성공',
		schema: {
			example: { success: true, data: { interactions: [], total: 0 } },
		},
	})
	@ApiQuery({ name: 'interactionType', required: false, enum: ['like', 'scrap'] })
	@ApiQuery({ name: 'postId', required: false, type: Number })
	@ApiQuery({ name: 'page', required: false, type: Number, description: '기본 1' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: '기본 10, 최대 100' })
	@Get()
	async getInteractions(@Query() query: GetInteractionsQueryDto) {
		const data = await this.interactionsService.getInteractions(query)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 사용자별 상호작용 목록
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '사용자별 상호작용 목록 조회' })
	@ApiOkResponse({
		description: '사용자별 상호작용 목록 조회 성공',
		schema: { example: { success: true, data: { interactions: [], total: 0 } } },
	})
	@ApiParam({ name: 'userId', type: Number, description: '사용자 ID' })
	@ApiQuery({ name: 'interactionType', required: false, enum: ['like', 'scrap'] })
	@ApiQuery({ name: 'postId', required: false, type: Number })
	@ApiQuery({ name: 'page', required: false, type: Number, description: '기본 1' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: '기본 10, 최대 100' })
	@Get('user/:userId')
	async getInteractionsByUser(
		@Param('userId', ParseIntPipe) userId: number,
		@Query() query: GetInteractionsQueryDto
	) {
		const data = await this.interactionsService.getInteractionsByUser(userId, query)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 게시글별 상호작용 통계
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '게시글별 상호작용 통계 (like/scrap 수, 내 상호작용 여부)' })
	@ApiOkResponse({
		description: '통계 조회 성공',
		schema: {
			example: {
				success: true,
				data: {
					likeCount: 10,
					scrapCount: 5,
					userInteractions: { liked: true, scrapped: false },
				},
			},
		},
	})
	@ApiParam({ name: 'postId', type: Number, description: '게시글 ID' })
	@ApiQuery({ name: 'userId', required: false, type: Number, description: '사용자 ID(옵션)' })
	@Get('stats/post/:postId')
	async getInteractionStatsForPost(
		@Param('postId', ParseIntPipe) postId: number,
		@Query('userId') userId?: number
	): Promise<{ success: boolean; data: InteractionStatsDto }> {
		const data = await this.interactionsService.getInteractionStatsForPost(postId, userId)
		return { success: true, data }
	}

	// ────────────────────────────────────────────────────────────────────────────
	// 상호작용 삭제 (본인 것만)
	// ────────────────────────────────────────────────────────────────────────────
	@ApiOperation({ summary: '상호작용 삭제 (본인 것만)' })
	@ApiOkResponse({ description: '상호작용 삭제 성공', schema: { example: { success: true } } })
	@ApiNotFoundResponse({ description: '상호작용을 찾을 수 없음' })
	@ApiForbiddenResponse({ description: '본인의 상호작용만 삭제 가능' })
	@ApiParam({ name: 'id', type: Number, description: '상호작용 ID' })
	@ApiCookieAuth('access_token')
	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	async deleteInteraction(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
		const userId = (req.user as any).id ?? (req.user as any).sub
		await this.interactionsService.deleteInteraction(id, userId)
		return { success: true }
	}
}
