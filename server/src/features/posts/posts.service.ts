// src/features/posts/posts.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like, FindManyOptions } from 'typeorm'
import { Post } from './post.entity'
import { User } from '../users/user.entity'
import { Comment } from '../comments/comment.entity'
import { Interaction } from '../interactions/interaction.entity'
import { CreatePostDto, UpdatePostDto, GetPostsQueryDto, PostResponseDto } from './posts.dto'

@Injectable()
export class PostsService {
	constructor(
		@InjectRepository(Post) private readonly postRepo: Repository<Post>,
		@InjectRepository(User) private readonly userRepo: Repository<User>,
		@InjectRepository(Comment) private readonly commentRepo: Repository<Comment>,
		@InjectRepository(Interaction) private readonly interactionRepo: Repository<Interaction>
	) {}

	/** 게시글 생성 (tips/trend는 관리자만) */
	async createPost(userId: number, dto: CreatePostDto): Promise<PostResponseDto> {
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.')

		if ((dto.postType === 'tips' || dto.postType === 'trend') && user.role !== 'admin') {
			throw new ForbiddenException('관리자만 tips/trend 게시글을 생성할 수 있습니다.')
		}

		const entity = this.postRepo.create({
			author: user,
			title: dto.title,
			content: dto.content,
			postType: dto.postType,
			category: dto.category ?? null,
			status: dto.status ?? 'published',
		})
		const saved = await this.postRepo.save(entity)
		return this.formatPostResponse(saved)
	}

	/** 게시글 목록 (검색/필터/페이지네이션) */
	async getPosts(query: GetPostsQueryDto): Promise<{ posts: PostResponseDto[]; total: number }> {
		const { page = 1, limit = 10, postType, category, status, search } = query
		const skip = (page - 1) * limit

		const where: any = {}
		if (postType) where.postType = postType
		if (category) where.category = category
		if (status) where.status = status

		const findOptions: FindManyOptions<Post> = {
			where,
			relations: ['author'],
			order: { createdAt: 'DESC' },
			skip,
			take: limit,
		}

		if (search) {
			// 제목/내용 OR 검색
			findOptions.where = [
				{ ...where, title: Like(`%${search}%`) },
				{ ...where, content: Like(`%${search}%`) },
			]
		}

		const [rows, total] = await this.postRepo.findAndCount(findOptions)
		const posts = await Promise.all(rows.map((p) => this.formatPostResponse(p)))
		return { posts, total }
	}

	/** 게시글 상세 (조회수 +1) */
	async getPostById(id: number): Promise<PostResponseDto> {
		const post = await this.postRepo.findOne({ where: { id }, relations: ['author'] })
		if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.')

		await this.postRepo.update(id, { viewCount: post.viewCount + 1 })
		post.viewCount += 1

		return this.formatPostResponse(post)
	}

	/** 게시글 수정 (작성자 or tips/trend=관리자) */
	async updatePost(id: number, userId: number, dto: UpdatePostDto): Promise<PostResponseDto> {
		const post = await this.postRepo.findOne({ where: { id }, relations: ['author'] })
		if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.')

		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.')

		// 권한 검증
		const isOwner = post.author.id === userId
		const isAdmin = user.role === 'admin'
		if (!isOwner) {
			if (post.postType === 'tips' || post.postType === 'trend') {
				if (!isAdmin)
					throw new ForbiddenException('관리자만 tips/trend 게시글을 수정할 수 있습니다.')
			} else {
				throw new ForbiddenException('작성자만 게시글을 수정할 수 있습니다.')
			}
		}

		const updateData: Partial<Post> = {}
		if (dto.title !== undefined) updateData.title = dto.title
		if (dto.content !== undefined) updateData.content = dto.content
		if (dto.category !== undefined) updateData.category = dto.category
		if (dto.status !== undefined) updateData.status = dto.status

		await this.postRepo.update(id, updateData)
		const updated = await this.postRepo.findOne({ where: { id }, relations: ['author'] })
		return this.formatPostResponse(updated!)
	}

	/** 게시글 삭제 (작성자 or tips/trend=관리자) */
	async deletePost(id: number, userId: number): Promise<void> {
		const post = await this.postRepo.findOne({ where: { id }, relations: ['author'] })
		if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.')

		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.')

		const isOwner = post.author.id === userId
		const isAdmin = user.role === 'admin'
		if (!isOwner) {
			if (post.postType === 'tips' || post.postType === 'trend') {
				if (!isAdmin)
					throw new ForbiddenException('관리자만 tips/trend 게시글을 삭제할 수 있습니다.')
			} else {
				throw new ForbiddenException('작성자만 게시글을 삭제할 수 있습니다.')
			}
		}

		await this.postRepo.delete(id)
	}

	/** 사용자별 게시글 */
	async getPostsByUser(
		userId: number,
		query: GetPostsQueryDto
	): Promise<{ posts: PostResponseDto[]; total: number }> {
		const { page = 1, limit = 10, postType, category, status } = query
		const skip = (page - 1) * limit

		const where: any = { author: { id: userId } }
		if (postType) where.postType = postType
		if (category) where.category = category
		if (status) where.status = status

		const [rows, total] = await this.postRepo.findAndCount({
			where,
			relations: ['author'],
			order: { createdAt: 'DESC' },
			skip,
			take: limit,
		})
		const posts = await Promise.all(rows.map((p) => this.formatPostResponse(p)))
		return { posts, total }
	}

	/** (프론트 호환) K-Buzz 목록 */
	async getBuzzPosts(
		query: any
	): Promise<{ buzzes: any[]; total: number; page: number; limit: number }> {
		const { page = 1, limit = 10, category, search } = query
		const skip = (page - 1) * limit

		const where: any = { status: 'published' }

		// 프론트 카테고리 → 백엔드 카테고리 매핑
		if (category) {
			const map: Record<string, string> = {
				travel: 'travel_tip',
				food: 'food_review',
				cafe: 'cafe_review',
				culture: 'general',
				shopping: 'general',
				nature: 'travel_tip',
				activity: 'general',
				other: 'general',
			}
			where.category = map[category] ?? category
		}

		const findOptions: FindManyOptions<Post> = {
			where,
			relations: ['author'],
			order: { createdAt: 'DESC' },
			skip,
			take: limit,
		}

		if (search) {
			findOptions.where = [
				{ ...where, title: Like(`%${search}%`) },
				{ ...where, content: Like(`%${search}%`) },
			]
		}

		const [rows, total] = await this.postRepo.findAndCount(findOptions)

		const buzzes = await Promise.all(
			rows.map(async (post) => {
				const [likeCount, commentCount] = await Promise.all([
					this.interactionRepo.count({ where: { post: { id: post.id }, interactionType: 'like' } }),
					this.commentRepo.count({ where: { post: { id: post.id } } }),
				])

				return {
					id: post.id,
					title: post.title,
					content: post.content,
					category: this.mapCategoryToFrontend(post.category),
					image_url: null,
					latitude: null,
					longitude: null,
					location_name: null,
					like_count: likeCount,
					comment_count: commentCount,
					view_count: post.viewCount,
					status: post.status,
					user_id: post.author.id,
					user: {
						id: post.author.id,
						name: post.author.name,
						email: post.author.email,
						avatar_url: post.author.avatar_url,
					},
					created_at: post.createdAt,
					updated_at: post.updatedAt,
				}
			})
		)

		return { buzzes, total, page: Number(page), limit: Number(limit) }
	}

	/** 게시글 좋아요 토글 (post 전용, Interaction 모델 준수) */
	async likePost(postId: number, userId: number): Promise<void> {
		const post = await this.postRepo.findOne({ where: { id: postId } })
		if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.')

		// 정책: community/trend만 상호작용 허용
		if (post.postType !== 'community' && post.postType !== 'trend') {
			throw new ForbiddenException('community, trend 게시글에만 좋아요를 사용할 수 있습니다.')
		}

		const existing = await this.interactionRepo.findOne({
			where: { user: { id: userId }, post: { id: postId }, interactionType: 'like' },
			relations: ['user', 'post'],
		})

		if (existing) {
			await this.interactionRepo.delete(existing.id)
			return
		}

		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.')

		const like = this.interactionRepo.create({ user, post, interactionType: 'like' })
		await this.interactionRepo.save(like)
	}

	private mapCategoryToFrontend(cat: string | null): string {
		if (!cat) return 'other'
		const map: Record<string, string> = {
			travel_tip: 'travel',
			food_review: 'food',
			cafe_review: 'cafe',
			general: 'culture',
		}
		return map[cat] ?? 'other'
	}

	/** 공통 응답 포맷 (like/scrap/comment 수 포함) */
	private async formatPostResponse(post: Post): Promise<PostResponseDto> {
		const [likeCount, scrapCount, commentCount] = await Promise.all([
			this.interactionRepo.count({ where: { post: { id: post.id }, interactionType: 'like' } }),
			this.interactionRepo.count({ where: { post: { id: post.id }, interactionType: 'scrap' } }),
			this.commentRepo.count({ where: { post: { id: post.id } } }),
		])

		return {
			id: post.id,
			author: {
				id: post.author.id,
				name: post.author.name,
				avatarUrl: post.author.avatar_url,
				role: post.author.role,
			},
			title: post.title,
			content: post.content,
			postType: post.postType,
			category: post.category,
			status: post.status,
			viewCount: post.viewCount,
			likeCount,
			scrapCount,
			commentCount,
			createdAt: post.createdAt,
			updatedAt: post.updatedAt,
		}
	}
}
