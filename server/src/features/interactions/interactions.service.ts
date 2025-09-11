// src/features/interactions/interactions.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, FindManyOptions } from 'typeorm'
import { Interaction, InteractionType, TargetType } from './interaction.entity'
import { Post } from '../posts/post.entity'
import { Place } from '../places/place.entity'
import { User } from '../users/user.entity'
import { CreateInteractionDto, GetInteractionsQueryDto, InteractionResponseDto, InteractionStatsDto } from './interactions.dto'

/**
 * InteractionsService - 통합 상호작용 관리
 * 
 * 주요 기능:
 * - like, scrap, bookmark 통합 관리
 * - 정책:
 *   - bookmark → place 전용
 *   - like, scrap → post 전용 (단, post_type이 community 또는 trend일 때만 허용)
 */
@Injectable()
export class InteractionsService {
	constructor(
		@InjectRepository(Interaction) private readonly interactionRepo: Repository<Interaction>,
		@InjectRepository(Post) private readonly postRepo: Repository<Post>,
		@InjectRepository(Place) private readonly placeRepo: Repository<Place>,
		@InjectRepository(User) private readonly userRepo: Repository<User>
	) {}

	/**
	 * 상호작용 생성/토글
	 * - 이미 존재하면 삭제 (토글 방식)
	 */
	async toggleInteraction(userId: number, createInteractionDto: CreateInteractionDto): Promise<{ action: 'created' | 'deleted', interaction?: InteractionResponseDto }> {
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.')

		// 정책 검증
		await this.validateInteractionPolicy(createInteractionDto)

		// 기존 상호작용 확인
		const existingInteraction = await this.interactionRepo.findOne({
			where: {
				user: { id: userId },
				interactionType: createInteractionDto.interactionType,
				targetType: createInteractionDto.targetType,
				targetId: createInteractionDto.targetId
			},
			relations: ['user']
		})

		if (existingInteraction) {
			// 기존 상호작용 삭제 (토글)
			await this.interactionRepo.delete(existingInteraction.id)
			return { action: 'deleted' }
		} else {
			// 새 상호작용 생성
			const interaction = this.interactionRepo.create({
				user,
				interactionType: createInteractionDto.interactionType,
				targetType: createInteractionDto.targetType,
				targetId: createInteractionDto.targetId
			})

			const savedInteraction = await this.interactionRepo.save(interaction)
			return { 
				action: 'created', 
				interaction: this.formatInteractionResponse(savedInteraction)
			}
		}
	}

	/**
	 * 상호작용 목록 조회
	 */
	async getInteractions(query: GetInteractionsQueryDto): Promise<{ interactions: InteractionResponseDto[], total: number }> {
		const { page = 1, limit = 10, interactionType, targetType } = query
		const skip = (page - 1) * limit

		const where: any = {}
		if (interactionType) where.interactionType = interactionType
		if (targetType) where.targetType = targetType

		const findOptions: FindManyOptions<Interaction> = {
			where,
			relations: ['user'],
			order: { createdAt: 'DESC' },
			skip,
			take: limit
		}

		const [interactions, total] = await this.interactionRepo.findAndCount(findOptions)

		const formattedInteractions = interactions.map(interaction => 
			this.formatInteractionResponse(interaction)
		)

		return { interactions: formattedInteractions, total }
	}

	/**
	 * 사용자별 상호작용 목록 조회
	 */
	async getInteractionsByUser(userId: number, query: GetInteractionsQueryDto): Promise<{ interactions: InteractionResponseDto[], total: number }> {
		const { page = 1, limit = 10, interactionType, targetType } = query
		const skip = (page - 1) * limit

		const where: any = { user: { id: userId } }
		if (interactionType) where.interactionType = interactionType
		if (targetType) where.targetType = targetType

		const findOptions: FindManyOptions<Interaction> = {
			where,
			relations: ['user'],
			order: { createdAt: 'DESC' },
			skip,
			take: limit
		}

		const [interactions, total] = await this.interactionRepo.findAndCount(findOptions)

		const formattedInteractions = interactions.map(interaction => 
			this.formatInteractionResponse(interaction)
		)

		return { interactions: formattedInteractions, total }
	}

	/**
	 * 대상별 상호작용 통계 조회
	 */
	async getInteractionStats(targetType: TargetType, targetId: number, userId?: number): Promise<InteractionStatsDto> {
		const [likeCount, scrapCount, bookmarkCount] = await Promise.all([
			this.interactionRepo.count({
				where: { targetType, targetId, interactionType: 'like' }
			}),
			this.interactionRepo.count({
				where: { targetType, targetId, interactionType: 'scrap' }
			}),
			this.interactionRepo.count({
				where: { targetType, targetId, interactionType: 'bookmark' }
			})
		])

		let userInteractions = { liked: false, scrapped: false, bookmarked: false }

		if (userId) {
			const [liked, scrapped, bookmarked] = await Promise.all([
				this.interactionRepo.findOne({
					where: { user: { id: userId }, targetType, targetId, interactionType: 'like' }
				}),
				this.interactionRepo.findOne({
					where: { user: { id: userId }, targetType, targetId, interactionType: 'scrap' }
				}),
				this.interactionRepo.findOne({
					where: { user: { id: userId }, targetType, targetId, interactionType: 'bookmark' }
				})
			])

			userInteractions = {
				liked: !!liked,
				scrapped: !!scrapped,
				bookmarked: !!bookmarked
			}
		}

		return {
			likeCount,
			scrapCount,
			bookmarkCount,
			userInteractions
		}
	}

	/**
	 * 상호작용 삭제
	 */
	async deleteInteraction(id: number, userId: number): Promise<void> {
		const interaction = await this.interactionRepo.findOne({
			where: { id },
			relations: ['user']
		})

		if (!interaction) throw new NotFoundException('상호작용을 찾을 수 없습니다.')

		// 사용자만 삭제 가능
		if (interaction.user.id !== userId) {
			throw new ForbiddenException('본인의 상호작용만 삭제할 수 있습니다.')
		}

		await this.interactionRepo.delete(id)
	}

	/**
	 * 상호작용 정책 검증
	 */
	private async validateInteractionPolicy(dto: CreateInteractionDto): Promise<void> {
		if (dto.interactionType === 'bookmark') {
			// bookmark는 place 전용
			if (dto.targetType !== 'place') {
				throw new ForbiddenException('북마크는 장소에만 사용할 수 있습니다.')
			}
			
			// 대상 장소 존재 확인
			const place = await this.placeRepo.findOne({ where: { id: dto.targetId } })
			if (!place) {
				throw new NotFoundException('대상 장소를 찾을 수 없습니다.')
			}
		} else {
			// like, scrap은 post 전용
			if (dto.targetType !== 'post') {
				throw new ForbiddenException('좋아요/스크랩은 게시글에만 사용할 수 있습니다.')
			}

			// 대상 게시글 존재 확인 및 타입 검증
			const post = await this.postRepo.findOne({ where: { id: dto.targetId } })
			if (!post) {
				throw new NotFoundException('대상 게시글을 찾을 수 없습니다.')
			}

			// community, trend에만 허용
			if (post.postType !== 'community' && post.postType !== 'trend') {
				throw new ForbiddenException('community, trend 게시글에만 좋아요/스크랩을 사용할 수 있습니다.')
			}
		}
	}

	/**
	 * 상호작용 응답 포맷팅
	 */
	private formatInteractionResponse(interaction: Interaction): InteractionResponseDto {
		return {
			id: interaction.id,
			user: {
				id: interaction.user.id,
				name: interaction.user.name,
				avatarUrl: interaction.user.avatar_url
			},
			interactionType: interaction.interactionType,
			targetType: interaction.targetType,
			targetId: interaction.targetId,
			createdAt: interaction.createdAt
		}
	}
}
