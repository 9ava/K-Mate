import {
	Controller,
	Get,
	Post,
	Delete,
	Param,
	Body,
	Query,
	UseGuards,
	Request,
	ParseIntPipe,
	HttpCode,
	HttpStatus,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { InteractionService } from './interaction.service'
import type { CreateInteractionDto, GetInteractionsOptions } from './interaction.service'
import { Interaction, InteractionType, TargetType } from './interaction.entity'

/**
 * Interaction Controller - 상호작용 API 엔드포인트 관리
 * 
 * 주요 기능:
 * - 상호작용 CRUD API (좋아요, 스크랩, 북마크)
 * - 상호작용 토글 기능
 * - 통계 조회
 * - 페이지네이션
 * - 권한 기반 접근 제어
 */
@Controller('interactions')
export class InteractionController {
	constructor(private readonly interactionService: InteractionService) {}

	/**
	 * 새로운 상호작용 생성
	 * POST /interactions
	 * 인증 필요: JWT 쿠키 인증
	 */
	@Post()
	@UseGuards(AuthGuard('jwt-cookie'))
	async createInteraction(@Body() createInteractionDto: CreateInteractionDto, @Request() req: any): Promise<Interaction> {
		const userId = req.user.sub
		return await this.interactionService.createInteraction(createInteractionDto, userId)
	}

	/**
	 * 상호작용 토글 (추가/삭제)
	 * POST /interactions/toggle
	 * 인증 필요: JWT 쿠키 인증
	 */
	@Post('toggle')
	@UseGuards(AuthGuard('jwt-cookie'))
	async toggleInteraction(@Body() createInteractionDto: CreateInteractionDto, @Request() req: any): Promise<{ action: 'added' | 'removed' }> {
		const userId = req.user.sub
		return await this.interactionService.toggleInteraction(createInteractionDto, userId)
	}

	/**
	 * 상호작용 목록 조회 (페이지네이션 지원)
	 * GET /interactions?page=1&limit=20&user_id=1&interaction_type=like&target_type=post&target_id=1
	 */
	@Get()
	async getInteractions(
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('user_id') user_id?: string,
		@Query('interaction_type') interaction_type?: string,
		@Query('target_type') target_type?: string,
		@Query('target_id') target_id?: string
	): Promise<{ interactions: Interaction[]; total: number; page: number; limit: number }> {
		const options: GetInteractionsOptions = {
			page: page ? parseInt(page, 10) : 1,
			limit: limit ? parseInt(limit, 10) : 20,
			user_id: user_id ? parseInt(user_id, 10) : undefined,
			interaction_type: interaction_type as InteractionType,
			target_type: target_type as TargetType,
			target_id: target_id ? parseInt(target_id, 10) : undefined,
		}

		const result = await this.interactionService.getInteractions(options)
		
		return {
			...result,
			page: options.page!,
			limit: options.limit!,
		}
	}

	/**
	 * 상호작용 삭제
	 * DELETE /interactions/:interactionType/:targetType/:targetId
	 * 인증 필요: JWT 쿠키 인증
	 */
	@Delete(':interactionType/:targetType/:targetId')
	@UseGuards(AuthGuard('jwt-cookie'))
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteInteraction(
		@Param('interactionType') interactionType: string,
		@Param('targetType') targetType: string,
		@Param('targetId', ParseIntPipe) targetId: number,
		@Request() req: any
	): Promise<void> {
		const userId = req.user.sub
		await this.interactionService.deleteInteraction(
			interactionType as InteractionType,
			targetType as TargetType,
			targetId,
			userId
		)
	}

	/**
	 * 특정 대상의 상호작용 통계 조회
	 * GET /interactions/stats/:targetType/:targetId
	 */
	@Get('stats/:targetType/:targetId')
	async getInteractionStats(
		@Param('targetType') targetType: string,
		@Param('targetId', ParseIntPipe) targetId: number
	): Promise<{
		like_count: number
		scrap_count: number
		bookmark_count: number
	}> {
		return await this.interactionService.getInteractionStats(targetType as TargetType, targetId)
	}

	/**
	 * 사용자의 상호작용 목록 조회
	 * GET /interactions/user/:userId
	 */
	@Get('user/:userId')
	async getInteractionsByUser(
		@Param('userId', ParseIntPipe) userId: number,
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('interaction_type') interaction_type?: string
	): Promise<{ interactions: Interaction[]; total: number; page: number; limit: number }> {
		const options: GetInteractionsOptions = {
			page: page ? parseInt(page, 10) : 1,
			limit: limit ? parseInt(limit, 10) : 20,
			interaction_type: interaction_type as InteractionType,
		}

		const result = await this.interactionService.getInteractionsByUser(userId, options)
		
		return {
			...result,
			page: options.page!,
			limit: options.limit!,
		}
	}

	/**
	 * 특정 대상의 상호작용 목록 조회
	 * GET /interactions/target/:targetType/:targetId
	 */
	@Get('target/:targetType/:targetId')
	async getInteractionsByTarget(
		@Param('targetType') targetType: string,
		@Param('targetId', ParseIntPipe) targetId: number,
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('interaction_type') interaction_type?: string
	): Promise<{ interactions: Interaction[]; total: number; page: number; limit: number }> {
		const options: GetInteractionsOptions = {
			page: page ? parseInt(page, 10) : 1,
			limit: limit ? parseInt(limit, 10) : 20,
			interaction_type: interaction_type as InteractionType,
		}

		const result = await this.interactionService.getInteractionsByTarget(targetType as TargetType, targetId, options)
		
		return {
			...result,
			page: options.page!,
			limit: options.limit!,
		}
	}

	// ==============================================
	// 편의 메서드들 (특정 상호작용 타입별)
	// ==============================================

	/**
	 * 게시글 좋아요 토글
	 * POST /interactions/like/post/:postId
	 */
	@Post('like/post/:postId')
	@UseGuards(AuthGuard('jwt-cookie'))
	async togglePostLike(@Param('postId', ParseIntPipe) postId: number, @Request() req: any): Promise<{ action: 'added' | 'removed' }> {
		const userId = req.user.sub
		return await this.interactionService.toggleInteraction(
			{ interaction_type: 'like', target_type: 'post', target_id: postId },
			userId
		)
	}

	/**
	 * 게시글 스크랩 토글
	 * POST /interactions/scrap/post/:postId
	 */
	@Post('scrap/post/:postId')
	@UseGuards(AuthGuard('jwt-cookie'))
	async togglePostScrap(@Param('postId', ParseIntPipe) postId: number, @Request() req: any): Promise<{ action: 'added' | 'removed' }> {
		const userId = req.user.sub
		return await this.interactionService.toggleInteraction(
			{ interaction_type: 'scrap', target_type: 'post', target_id: postId },
			userId
		)
	}

	/**
	 * 장소 북마크 토글
	 * POST /interactions/bookmark/place/:placeId
	 */
	@Post('bookmark/place/:placeId')
	@UseGuards(AuthGuard('jwt-cookie'))
	async togglePlaceBookmark(@Param('placeId', ParseIntPipe) placeId: number, @Request() req: any): Promise<{ action: 'added' | 'removed' }> {
		const userId = req.user.sub
		return await this.interactionService.toggleInteraction(
			{ interaction_type: 'bookmark', target_type: 'place', target_id: placeId },
			userId
		)
	}
}
