// src/features/posts/posts.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like, FindManyOptions } from 'typeorm'
import { Post, PostType } from './post.entity'
import { User, UserRole } from '../users/user.entity'
import { Comment } from '../comments/comment.entity'
import { Interaction } from '../interactions/interaction.entity'
import { CreatePostDto, UpdatePostDto, GetPostsQueryDto, PostResponseDto } from './posts.dto'

/**
 * PostsService - K-Buzz 게시글 관리
 * 
 * 주요 기능:
 * - 게시글 CRUD (정책에 따른 권한 제어)
 * - community: 모든 사용자 CRUD
 * - tips/trend: 관리자만 CRUD
 * - 상호작용 통계 포함 조회
 */
@Injectable()
export class PostsService {
	constructor(
		@InjectRepository(Post) private readonly postRepo: Repository<Post>,
		@InjectRepository(User) private readonly userRepo: Repository<User>,
		@InjectRepository(Comment) private readonly commentRepo: Repository<Comment>,
		@InjectRepository(Interaction) private readonly interactionRepo: Repository<Interaction>
	) {}

	/**
	 * 게시글 생성
	 * - tips/trend는 관리자만 생성 가능
	 */
	async createPost(userId: number, createPostDto: CreatePostDto): Promise<PostResponseDto> {
		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.')

		// tips/trend는 관리자만 생성 가능
		if (createPostDto.postType === 'tips' || createPostDto.postType === 'trend') {
			if (user.role !== 'admin') {
				throw new ForbiddenException('관리자만 tips/trend 게시글을 생성할 수 있습니다.')
			}
		}

		const post = this.postRepo.create({
			author: user,
			title: createPostDto.title,
			content: createPostDto.content,
			postType: createPostDto.postType,
			category: createPostDto.category || null,
			status: createPostDto.status || 'published'
		})

		const savedPost = await this.postRepo.save(post)
		return this.formatPostResponse(savedPost)
	}

	/**
	 * 게시글 목록 조회 (페이지네이션, 필터링, 검색)
	 */
	async getPosts(query: GetPostsQueryDto): Promise<{ posts: PostResponseDto[], total: number }> {
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
			take: limit
		}

		// 검색 기능
		if (search) {
			findOptions.where = [
				{ ...where, title: Like(`%${search}%`) },
				{ ...where, content: Like(`%${search}%`) }
			]
		}

		const [posts, total] = await this.postRepo.findAndCount(findOptions)
		
		const formattedPosts = await Promise.all(
			posts.map(post => this.formatPostResponse(post))
		)

		return { posts: formattedPosts, total }
	}

	/**
	 * 게시글 상세 조회 (조회수 증가)
	 */
	async getPostById(id: number): Promise<PostResponseDto> {
		const post = await this.postRepo.findOne({
			where: { id },
			relations: ['author']
		})

		if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.')

		// 조회수 증가
		await this.postRepo.update(id, { viewCount: post.viewCount + 1 })
		post.viewCount += 1

		return this.formatPostResponse(post)
	}

	/**
	 * 게시글 수정
	 * - tips/trend는 관리자만 수정 가능
	 * - 작성자만 수정 가능
	 */
	async updatePost(id: number, userId: number, updatePostDto: UpdatePostDto): Promise<PostResponseDto> {
		const post = await this.postRepo.findOne({
			where: { id },
			relations: ['author']
		})

		if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.')

		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.')

		// 권한 검증
		if (post.author.id !== userId) {
			if (post.postType === 'tips' || post.postType === 'trend') {
				if (user.role !== 'admin') {
					throw new ForbiddenException('관리자만 tips/trend 게시글을 수정할 수 있습니다.')
				}
			} else {
				throw new ForbiddenException('작성자만 게시글을 수정할 수 있습니다.')
			}
		}

		// 수정할 필드만 업데이트
		const updateData: Partial<Post> = {}
		if (updatePostDto.title !== undefined) updateData.title = updatePostDto.title
		if (updatePostDto.content !== undefined) updateData.content = updatePostDto.content
		if (updatePostDto.category !== undefined) updateData.category = updatePostDto.category
		if (updatePostDto.status !== undefined) updateData.status = updatePostDto.status

		await this.postRepo.update(id, updateData)

		// 업데이트된 게시글 조회
		const updatedPost = await this.postRepo.findOne({
			where: { id },
			relations: ['author']
		})

		return this.formatPostResponse(updatedPost!)
	}

	/**
	 * 게시글 삭제
	 * - tips/trend는 관리자만 삭제 가능
	 * - 작성자만 삭제 가능
	 */
	async deletePost(id: number, userId: number): Promise<void> {
		const post = await this.postRepo.findOne({
			where: { id },
			relations: ['author']
		})

		if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.')

		const user = await this.userRepo.findOne({ where: { id: userId } })
		if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.')

		// 권한 검증
		if (post.author.id !== userId) {
			if (post.postType === 'tips' || post.postType === 'trend') {
				if (user.role !== 'admin') {
					throw new ForbiddenException('관리자만 tips/trend 게시글을 삭제할 수 있습니다.')
				}
			} else {
				throw new ForbiddenException('작성자만 게시글을 삭제할 수 있습니다.')
			}
		}

		await this.postRepo.delete(id)
	}

	/**
	 * 사용자별 게시글 조회
	 */
	async getPostsByUser(userId: number, query: GetPostsQueryDto): Promise<{ posts: PostResponseDto[], total: number }> {
		const { page = 1, limit = 10, postType, category, status } = query
		const skip = (page - 1) * limit

		const where: any = { author: { id: userId } }
		if (postType) where.postType = postType
		if (category) where.category = category
		if (status) where.status = status

		const [posts, total] = await this.postRepo.findAndCount({
			where,
			relations: ['author'],
			order: { createdAt: 'DESC' },
			skip,
			take: limit
		})

		const formattedPosts = await Promise.all(
			posts.map(post => this.formatPostResponse(post))
		)

		return { posts: formattedPosts, total }
	}

	/**
	 * K-Buzz 게시글 목록 조회 (프론트엔드 호환)
	 */
	async getBuzzPosts(query: any): Promise<{ buzzes: any[], total: number, page: number, limit: number }> {
		const { page = 1, limit = 10, category, search } = query
		const skip = (page - 1) * limit

		const where: any = { status: 'published' }
		
		// 카테고리 매핑 (프론트엔드 카테고리를 백엔드 카테고리로 변환)
		if (category) {
			const categoryMap: { [key: string]: string } = {
				'travel': 'travel_tip',
				'food': 'food_review',
				'cafe': 'cafe_review',
				'culture': 'general',
				'shopping': 'general',
				'nature': 'travel_tip',
				'activity': 'general',
				'other': 'general'
			}
			where.category = categoryMap[category] || category
		}

		const findOptions: FindManyOptions<Post> = {
			where,
			relations: ['author'],
			order: { createdAt: 'DESC' },
			skip,
			take: limit
		}

		// 검색 기능
		if (search) {
			findOptions.where = [
				{ ...where, title: Like(`%${search}%`) },
				{ ...where, content: Like(`%${search}%`) }
			]
		}

		const [posts, total] = await this.postRepo.findAndCount(findOptions)
		
		const buzzes = await Promise.all(
			posts.map(async (post) => {
				// 상호작용 통계 조회
				const [likeCount, commentCount] = await Promise.all([
					this.interactionRepo.count({
						where: { targetType: 'post', targetId: post.id, interactionType: 'like' }
					}),
					this.commentRepo.count({
						where: { post: { id: post.id } }
					})
				])

				// 프론트엔드 호환 형식으로 변환
				return {
					id: post.id,
					title: post.title,
					content: post.content,
					category: this.mapCategoryToFrontend(post.category),
					image_url: null, // 현재 이미지 필드가 없음
					latitude: null, // 현재 위치 필드가 없음
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
						avatar_url: post.author.avatar_url
					},
					created_at: post.createdAt,
					updated_at: post.updatedAt
				}
			})
		)

		return { buzzes, total, page: Number(page), limit: Number(limit) }
	}

	/**
	 * 게시글 좋아요
	 */
	async likePost(postId: number, userId: number): Promise<void> {
		// 이미 좋아요를 눌렀는지 확인
		const existingLike = await this.interactionRepo.findOne({
			where: {
				user: { id: userId },
				targetType: 'post',
				targetId: postId,
				interactionType: 'like'
			}
		})

		if (existingLike) {
			// 이미 좋아요를 눌렀으면 취소
			await this.interactionRepo.remove(existingLike)
		} else {
			// 좋아요 추가
			const user = await this.userRepo.findOne({ where: { id: userId } })
			if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.')

			const like = this.interactionRepo.create({
				user,
				interactionType: 'like',
				targetType: 'post',
				targetId: postId
			})

			await this.interactionRepo.save(like)
		}
	}

	/**
	 * 카테고리를 프론트엔드 형식으로 매핑
	 */
	private mapCategoryToFrontend(backendCategory: string | null): string {
		if (!backendCategory) return 'other'
		
		const categoryMap: { [key: string]: string } = {
			'travel_tip': 'travel',
			'food_review': 'food',
			'cafe_review': 'cafe',
			'general': 'culture'
		}
		
		return categoryMap[backendCategory] || 'other'
	}

	/**
	 * 게시글 응답 포맷팅 (상호작용 통계 포함)
	 */
	private async formatPostResponse(post: Post): Promise<PostResponseDto> {
		// 상호작용 통계 조회
		const [likeCount, scrapCount, commentCount] = await Promise.all([
			this.interactionRepo.count({
				where: { targetType: 'post', targetId: post.id, interactionType: 'like' }
			}),
			this.interactionRepo.count({
				where: { targetType: 'post', targetId: post.id, interactionType: 'scrap' }
			}),
			this.commentRepo.count({
				where: { post: { id: post.id } }
			})
		])

		return {
			id: post.id,
			author: {
				id: post.author.id,
				name: post.author.name,
				avatarUrl: post.author.avatar_url,
				role: post.author.role
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
			updatedAt: post.updatedAt
		}
	}
}
