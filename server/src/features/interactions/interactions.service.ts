// src/features/interactions/interactions.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, FindManyOptions } from 'typeorm'
import { Interaction, type InteractionType } from './interaction.entity'
import { Post } from '../posts/post.entity'
import { User } from '../users/user.entity'
import {
	CreateInteractionDto,
	GetInteractionsQueryDto,
	InteractionResponseDto,
	InteractionStatsDto,
} from './interactions.dto'

@Injectable()
export class InteractionsService {
	constructor(
		@InjectRepository(Interaction) private readonly interactionRepo: Repository<Interaction>,
		@InjectRepository(Post) private readonly postRepo: Repository<Post>,
		@InjectRepository(User) private readonly userRepo: Repository<User>
	) {}

	/** like/scrap 토글 (post 전용) */
	async toggleInteraction(
		userId: number,
		dto: CreateInteractionDto
	): Promise<{ action: 'created' | 'deleted'; interaction?: InteractionResponseDto }> {
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.')

		const post = await this.postRepo.findOne({ where: { id: dto.postId } })
		if (!post) throw new NotFoundException('대상 게시글을 찾을 수 없습니다.')

		// 정책: community, trend 만 허용
		if (post.postType !== 'community' && post.postType !== 'trend') {
			throw new ForbiddenException(
				'community, trend 게시글에만 좋아요/스크랩을 사용할 수 있습니다.'
			)
		}

		const existing = await this.interactionRepo.findOne({
			where: {
				user: { id: userId },
				post: { id: dto.postId },
				interactionType: dto.interactionType,
			},
			relations: ['user', 'post'],
		})

		if (existing) {
			await this.interactionRepo.delete(existing.id)
			return { action: 'deleted' }
		}

		const entity = this.interactionRepo.create({
			user,
			post,
			interactionType: dto.interactionType,
		})
		const saved = await this.interactionRepo.save(entity)
		return { action: 'created', interaction: this.formatInteractionResponse(saved) }
	}

	/** 목록 조회 */
	async getInteractions(
		query: GetInteractionsQueryDto
	): Promise<{ interactions: InteractionResponseDto[]; total: number }> {
		const { page = 1, limit = 10, interactionType, postId } = query
		const skip = (page - 1) * limit

		const where: any = {}
		if (interactionType) where.interactionType = interactionType
		if (postId) where.post = { id: postId }

		const findOptions: FindManyOptions<Interaction> = {
			where,
			relations: ['user', 'post'],
			order: { createdAt: 'DESC' },
			skip,
			take: limit,
		}

		const [rows, total] = await this.interactionRepo.findAndCount(findOptions)
		return { interactions: rows.map((r) => this.formatInteractionResponse(r)), total }
	}

	/** 사용자별 목록 */
	async getInteractionsByUser(
		userId: number,
		query: GetInteractionsQueryDto
	): Promise<{ interactions: InteractionResponseDto[]; total: number }> {
		const { page = 1, limit = 10, interactionType, postId } = query
		const skip = (page - 1) * limit

		const where: any = { user: { id: userId } }
		if (interactionType) where.interactionType = interactionType
		if (postId) where.post = { id: postId }

		const findOptions: FindManyOptions<Interaction> = {
			where,
			relations: ['user', 'post'],
			order: { createdAt: 'DESC' },
			skip,
			take: limit,
		}

		const [rows, total] = await this.interactionRepo.findAndCount(findOptions)
		return { interactions: rows.map((r) => this.formatInteractionResponse(r)), total }
	}

	/** 게시글별 통계 */
	async getInteractionStatsForPost(postId: number, userId?: number): Promise<InteractionStatsDto> {
		const [likeCount, scrapCount] = await Promise.all([
			this.interactionRepo.count({ where: { post: { id: postId }, interactionType: 'like' } }),
			this.interactionRepo.count({ where: { post: { id: postId }, interactionType: 'scrap' } }),
		])

		let userInteractions = { liked: false, scrapped: false }
		if (userId) {
			const [liked, scrapped] = await Promise.all([
				this.interactionRepo.findOne({
					where: { user: { id: userId }, post: { id: postId }, interactionType: 'like' },
				}),
				this.interactionRepo.findOne({
					where: { user: { id: userId }, post: { id: postId }, interactionType: 'scrap' },
				}),
			])
			userInteractions = { liked: !!liked, scrapped: !!scrapped }
		}

		return { likeCount, scrapCount, userInteractions }
	}

	/** 삭제 (본인 것만) */
	async deleteInteraction(id: number, userId: number): Promise<void> {
		const it = await this.interactionRepo.findOne({ where: { id }, relations: ['user'] })
		if (!it) throw new NotFoundException('상호작용을 찾을 수 없습니다.')
		if (it.user.id !== userId) throw new ForbiddenException('본인의 상호작용만 삭제할 수 있습니다.')
		await this.interactionRepo.delete(id)
	}

	/** 응답 포맷 */
	private formatInteractionResponse(i: Interaction): InteractionResponseDto {
		return {
			id: i.id,
			user: {
				id: i.user.id,
				name: (i.user as any).name,
				avatarUrl: (i.user as any).avatar_url ?? null,
			},
			interactionType: i.interactionType,
			postId: i.post?.id ?? (i as any).postId, // relation 로드 여부에 따라 보조
			createdAt: i.createdAt,
		}
	}
}
