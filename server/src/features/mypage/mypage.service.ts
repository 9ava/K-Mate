// src/features/mypage/mypage.service.ts - 마이페이지 서비스
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/user.entity'
import { PlaceBookmark } from '../places/place-bookmark.entity'
import { Interaction } from '../interactions/interaction.entity'
import { Post } from '../posts/post.entity'
import { Comment } from '../comments/comment.entity'
import {
	UserActivityStatsDto,
	PaginationQueryDto,
	BookmarkListResponseDto,
	ScrapListResponseDto,
	MyPostListResponseDto,
	MyCommentListResponseDto,
	UserProfileDto,
	UpdateRoleDto,
	RoleUpdateResponseDto,
} from './mypage.dto'

@Injectable()
export class MypageService {
	constructor(
		@InjectRepository(User) private readonly userRepo: Repository<User>,
		@InjectRepository(PlaceBookmark) private readonly bookmarkRepo: Repository<PlaceBookmark>,
		@InjectRepository(Interaction) private readonly interactionRepo: Repository<Interaction>,
		@InjectRepository(Post) private readonly postRepo: Repository<Post>,
		@InjectRepository(Comment) private readonly commentRepo: Repository<Comment>
	) {}

	/**
	 * 사용자 활동 통계 조회
	 */
	async getUserActivityStats(userId: number): Promise<UserActivityStatsDto> {
		// 사용자 존재 확인
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다.')
		}

		// 각 카테고리별 개수 조회
		const [bookmarkCount, scrapCount, postCount, commentCount] = await Promise.all([
			// 북마크 수
			this.bookmarkRepo.count({ where: { user: { id: userId } } }),
			// 스크랩 수 (interactionType이 'scrap'인 것)
			this.interactionRepo.count({ where: { user: { id: userId }, interactionType: 'scrap' } }),
			// 작성한 게시글 수
			this.postRepo.count({ where: { author: { id: userId } } }),
			// 작성한 댓글 수
			this.commentRepo.count({ where: { user: { id: userId } } }),
		])

		return {
			bookmarkCount,
			scrapCount,
			postCount,
			commentCount,
		}
	}

	/**
	 * 내 북마크 목록 조회
	 */
	async getMyBookmarks(userId: number, query: PaginationQueryDto): Promise<BookmarkListResponseDto> {
		const { page = 1, limit = 10 } = query
		const skip = (page - 1) * limit

		// 사용자 존재 확인
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다.')
		}

		// 북마크 목록 조회
		const [bookmarks, total] = await this.bookmarkRepo.findAndCount({
			where: { user: { id: userId } },
			relations: { place: true },
			order: { createdAt: 'DESC' },
			skip,
			take: limit,
		})

		return {
			bookmarks: bookmarks.map((bookmark) => ({
				id: bookmark.id,
				placeId: bookmark.place.googlePlaceId,
				name: bookmark.place.name,
				address: bookmark.place.address || '',
				lat: bookmark.place.lat,
				lng: bookmark.place.lng,
				googleMapsUrl: bookmark.place.googleMapsUrl || '',
				type: (bookmark.place as any).type,
				createdAt: bookmark.createdAt,
			})),
			total,
			page,
			limit,
		}
	}

	/**
	 * 내 스크랩 목록 조회
	 */
	async getMyScraps(userId: number, query: PaginationQueryDto): Promise<ScrapListResponseDto> {
		const { page = 1, limit = 10 } = query
		const skip = (page - 1) * limit

		// 사용자 존재 확인
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다.')
		}

		// 스크랩 목록 조회 (interactionType이 'scrap'인 것)
		const [interactions, total] = await this.interactionRepo.findAndCount({
			where: { user: { id: userId }, interactionType: 'scrap' },
			relations: { post: { author: true } },
			order: { createdAt: 'DESC' },
			skip,
			take: limit,
		})

		return {
			scraps: interactions.map((interaction) => ({
				id: interaction.id,
				postId: interaction.post.id,
				title: interaction.post.title,
				content: interaction.post.content.substring(0, 100) + (interaction.post.content.length > 100 ? '...' : ''),
				postType: interaction.post.postType,
				category: interaction.post.category || undefined,
				author: {
					id: interaction.post.author.id,
					name: (interaction.post.author as any).name,
					avatarUrl: (interaction.post.author as any).avatar_url,
				},
				createdAt: interaction.createdAt,
			})),
			total,
			page,
			limit,
		}
	}

	/**
	 * 내가 쓴 글 목록 조회
	 */
	async getMyPosts(userId: number, query: PaginationQueryDto): Promise<MyPostListResponseDto> {
		const { page = 1, limit = 10 } = query
		const skip = (page - 1) * limit

		// 사용자 존재 확인
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다.')
		}

		// 내가 쓴 글 목록 조회
		const [posts, total] = await this.postRepo.findAndCount({
			where: { author: { id: userId } },
			relations: { author: true },
			order: { createdAt: 'DESC' },
			skip,
			take: limit,
		})

		// 각 게시글의 좋아요 수와 댓글 수 조회
		const postsWithStats = await Promise.all(
			posts.map(async (post) => {
				const [likeCount, commentCount] = await Promise.all([
					this.interactionRepo.count({ where: { post: { id: post.id }, interactionType: 'like' } }),
					this.commentRepo.count({ where: { post: { id: post.id } } }),
				])

				return {
					id: post.id,
					title: post.title,
					content: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
					postType: post.postType,
					category: post.category || undefined,
					status: post.status,
					likeCount,
					commentCount,
					createdAt: post.createdAt,
					updatedAt: post.updatedAt,
				}
			})
		)

		return {
			posts: postsWithStats,
			total,
			page,
			limit,
		}
	}

	/**
	 * 내가 쓴 댓글 목록 조회
	 */
	async getMyComments(userId: number, query: PaginationQueryDto): Promise<MyCommentListResponseDto> {
		const { page = 1, limit = 10 } = query
		const skip = (page - 1) * limit

		// 사용자 존재 확인
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다.')
		}

		// 내가 쓴 댓글 목록 조회
		const [comments, total] = await this.commentRepo.findAndCount({
			where: { user: { id: userId } },
			relations: { post: true, user: true },
			order: { createdAt: 'DESC' },
			skip,
			take: limit,
		})

		return {
			comments: comments.map((comment) => ({
				id: comment.id,
				content: comment.content,
				post: {
					id: comment.post.id,
					title: comment.post.title,
					postType: comment.post.postType,
				},
				author: {
					id: comment.user.id,
					name: (comment.user as any).name,
					avatarUrl: (comment.user as any).avatar_url,
				},
				createdAt: comment.createdAt,
				updatedAt: comment.createdAt,
			})),
			total,
			page,
			limit,
		}
	}

	/**
	 * 사용자 프로필 및 Role 확인 (RQ-7001)
	 */
	async getUserProfile(userId: number): Promise<UserProfileDto> {
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다.')
		}

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			avatarUrl: user.avatar_url,
			role: user.role,
			emailVerified: Boolean(user.email_verified),
			createdAt: user.created_at,
			updatedAt: user.updated_at,
		}
	}

	/**
	 * 사용자 Role 수정 (RQ-7002)
	 */
	async updateUserRole(userId: number, updateRoleDto: UpdateRoleDto): Promise<RoleUpdateResponseDto> {
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) {
			throw new NotFoundException('사용자를 찾을 수 없습니다.')
		}

		// 권한 유효성 검증
		if (!['user', 'admin'].includes(updateRoleDto.role)) {
			throw new Error('유효하지 않은 권한입니다. user 또는 admin만 허용됩니다.')
		}

		// 권한 업데이트
		await this.userRepo.update(userId, { role: updateRoleDto.role as 'user' | 'admin' })

		// 업데이트된 사용자 정보 조회
		const updatedUser = await this.userRepo.findOne({ where: { id: userId } })
		if (!updatedUser) {
			throw new NotFoundException('사용자를 찾을 수 없습니다.')
		}

		return {
			id: updatedUser.id,
			role: updatedUser.role,
			updatedAt: updatedUser.updated_at,
		}
	}
}
