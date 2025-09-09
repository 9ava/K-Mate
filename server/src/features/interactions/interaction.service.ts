import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Interaction, InteractionType, TargetType } from './interaction.entity'
import { User } from '../users/user.entity'
import { Post } from '../posts/post.entity'
import { Place } from '../places/place.entity'

/**
 * 상호작용 생성 DTO
 */
export interface CreateInteractionDto {
	interaction_type: InteractionType
	target_type: TargetType
	target_id: number
}

/**
 * 상호작용 조회 옵션
 */
export interface GetInteractionsOptions {
	page?: number
	limit?: number
	user_id?: number
	interaction_type?: InteractionType
	target_type?: TargetType
	target_id?: number
}

/**
 * Interaction Service - 상호작용 비즈니스 로직 관리
 * 
 * 주요 기능:
 * - 상호작용 CRUD 작업 (좋아요, 스크랩, 북마크)
 * - 중복 상호작용 방지
 * - 실시간 통계 계산
 * - 페이지네이션
 * - 타입별 상호작용 관리
 */
@Injectable()
export class InteractionService {
	constructor(
		@InjectRepository(Interaction) private readonly interactionRepository: Repository<Interaction>,
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		@InjectRepository(Post) private readonly postRepository: Repository<Post>,
		@InjectRepository(Place) private readonly placeRepository: Repository<Place>
	) {}

	/**
	 * 새로운 상호작용 생성
	 * @param createInteractionDto 상호작용 생성 데이터
	 * @param userId 사용자 ID
	 * @returns 생성된 상호작용
	 */
	async createInteraction(createInteractionDto: CreateInteractionDto, userId: number): Promise<Interaction> {
		// 사용자 존재 확인
		const user = await this.userRepository.findOne({ where: { id: userId } })
		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다.')
		}

		// 대상 존재 확인
		await this.validateTarget(createInteractionDto.target_type, createInteractionDto.target_id)

		// 중복 상호작용 확인
		const existingInteraction = await this.interactionRepository.findOne({
			where: {
				user_id: userId,
				interaction_type: createInteractionDto.interaction_type,
				target_type: createInteractionDto.target_type,
				target_id: createInteractionDto.target_id,
			},
		})

		if (existingInteraction) {
			throw new ConflictException('이미 해당 상호작용을 수행했습니다.')
		}

		// 상호작용 엔티티 생성
		const interaction = this.interactionRepository.create({
			...createInteractionDto,
			user_id: userId,
		})

		// 데이터베이스에 저장
		return await this.interactionRepository.save(interaction)
	}

	/**
	 * 상호작용 목록 조회 (페이지네이션 지원)
	 * @param options 조회 옵션
	 * @returns 상호작용 목록과 총 개수
	 */
	async getInteractions(options: GetInteractionsOptions = {}): Promise<{ interactions: Interaction[]; total: number }> {
		const {
			page = 1,
			limit = 20,
			user_id,
			interaction_type,
			target_type,
			target_id,
		} = options

		// 쿼리 빌더 생성
		const queryBuilder = this.interactionRepository
			.createQueryBuilder('interaction')
			.leftJoinAndSelect('interaction.user', 'user')
			.leftJoinAndSelect('interaction.post', 'post')
			.leftJoinAndSelect('interaction.place', 'place')

		// 사용자 필터
		if (user_id) {
			queryBuilder.andWhere('interaction.user_id = :user_id', { user_id })
		}

		// 상호작용 타입 필터
		if (interaction_type) {
			queryBuilder.andWhere('interaction.interaction_type = :interaction_type', { interaction_type })
		}

		// 대상 타입 필터
		if (target_type) {
			queryBuilder.andWhere('interaction.target_type = :target_type', { target_type })
		}

		// 대상 ID 필터
		if (target_id) {
			queryBuilder.andWhere('interaction.target_id = :target_id', { target_id })
		}

		// 정렬 (최신순)
		queryBuilder.orderBy('interaction.created_at', 'DESC')

		// 페이지네이션
		const skip = (page - 1) * limit
		queryBuilder.skip(skip).take(limit)

		// 실행
		const [interactions, total] = await queryBuilder.getManyAndCount()

		return { interactions, total }
	}

	/**
	 * 상호작용 삭제 (취소)
	 * @param interactionType 상호작용 타입
	 * @param targetType 대상 타입
	 * @param targetId 대상 ID
	 * @param userId 사용자 ID
	 */
	async deleteInteraction(
		interactionType: InteractionType,
		targetType: TargetType,
		targetId: number,
		userId: number
	): Promise<void> {
		const interaction = await this.interactionRepository.findOne({
			where: {
				user_id: userId,
				interaction_type: interactionType,
				target_type: targetType,
				target_id: targetId,
			},
		})

		if (!interaction) {
			throw new NotFoundException('상호작용을 찾을 수 없습니다.')
		}

		await this.interactionRepository.remove(interaction)
	}

	/**
	 * 상호작용 토글 (추가/삭제)
	 * @param createInteractionDto 상호작용 데이터
	 * @param userId 사용자 ID
	 * @returns 상호작용 상태 (추가됨/삭제됨)
	 */
	async toggleInteraction(createInteractionDto: CreateInteractionDto, userId: number): Promise<{ action: 'added' | 'removed' }> {
		const existingInteraction = await this.interactionRepository.findOne({
			where: {
				user_id: userId,
				interaction_type: createInteractionDto.interaction_type,
				target_type: createInteractionDto.target_type,
				target_id: createInteractionDto.target_id,
			},
		})

		if (existingInteraction) {
			// 상호작용이 이미 존재하면 삭제
			await this.deleteInteraction(
				createInteractionDto.interaction_type,
				createInteractionDto.target_type,
				createInteractionDto.target_id,
				userId
			)
			return { action: 'removed' }
		} else {
			// 상호작용이 없으면 추가
			await this.createInteraction(createInteractionDto, userId)
			return { action: 'added' }
		}
	}

	/**
	 * 특정 대상의 상호작용 통계 조회
	 * @param targetType 대상 타입
	 * @param targetId 대상 ID
	 * @returns 상호작용 통계
	 */
	async getInteractionStats(targetType: TargetType, targetId: number): Promise<{
		like_count: number
		scrap_count: number
		bookmark_count: number
	}> {
		const stats = await this.interactionRepository
			.createQueryBuilder('interaction')
			.select('interaction.interaction_type', 'type')
			.addSelect('COUNT(*)', 'count')
			.where('interaction.target_type = :targetType', { targetType })
			.andWhere('interaction.target_id = :targetId', { targetId })
			.groupBy('interaction.interaction_type')
			.getRawMany()

		const result = {
			like_count: 0,
			scrap_count: 0,
			bookmark_count: 0,
		}

		stats.forEach(stat => {
			switch (stat.type) {
				case 'like':
					result.like_count = parseInt(stat.count)
					break
				case 'scrap':
					result.scrap_count = parseInt(stat.count)
					break
				case 'bookmark':
					result.bookmark_count = parseInt(stat.count)
					break
			}
		})

		return result
	}

	/**
	 * 사용자의 상호작용 목록 조회
	 * @param userId 사용자 ID
	 * @param options 조회 옵션
	 * @returns 상호작용 목록
	 */
	async getInteractionsByUser(userId: number, options: GetInteractionsOptions = {}): Promise<{ interactions: Interaction[]; total: number }> {
		return this.getInteractions({ ...options, user_id: userId })
	}

	/**
	 * 특정 대상의 상호작용 목록 조회
	 * @param targetType 대상 타입
	 * @param targetId 대상 ID
	 * @param options 조회 옵션
	 * @returns 상호작용 목록
	 */
	async getInteractionsByTarget(
		targetType: TargetType,
		targetId: number,
		options: GetInteractionsOptions = {}
	): Promise<{ interactions: Interaction[]; total: number }> {
		return this.getInteractions({ ...options, target_type: targetType, target_id: targetId })
	}

	/**
	 * 대상 존재 여부 확인
	 * @param targetType 대상 타입
	 * @param targetId 대상 ID
	 */
	private async validateTarget(targetType: TargetType, targetId: number): Promise<void> {
		if (targetType === 'post') {
			const post = await this.postRepository.findOne({ where: { id: targetId, status: 'published' } })
			if (!post) {
				throw new NotFoundException('게시글을 찾을 수 없습니다.')
			}
		} else if (targetType === 'place') {
			const place = await this.placeRepository.findOne({ where: { id: targetId } })
			if (!place) {
				throw new NotFoundException('장소를 찾을 수 없습니다.')
			}
		}
	}
}
